/**
 * Presentation layer for the comments feature.
 *
 * `CommentController` is HTTP-ONLY. Each handler: (1) validates that the
 * *request* is well-formed, (2) hands plain data to a CommentService use case,
 * (3) maps the result -- or a thrown domain error -- back to an HTTP status.
 *
 * No business rules and no database access live here. The controller owns the
 * service it talks to (instantiated in the constructor) so the class declares
 * its dependencies up front. URL routing lives in `routes.js`.
 *
 * The handlers are arrow-function class fields on purpose: that binds `this`
 * to the instance, so they keep working when passed to Express as
 * `controller.getComments` (a plain method would lose its `this`).
 */

import { Comment, NotOwnerError } from "./domain.js";
import { NotFoundError } from "./application.js";

class CommentController {
    constructor(service) {
        this.service = service;
    }

    getComments = async (request, response) => {
        try {
            const comments = await this.service.listComments();
            return response.status(200).send(comments.map(comment => this.#commentToResponse(comment)));
        } catch (error) {
            return this.#sendError(response, error, "Fetching comments failed. Error:");
        }
    };

    createComment = async (request, response) => {
        try {
            if (!this.#isJson(request)) {
                return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
            }

            const { id, content, username } = request.body;

            if (content === "" || content === undefined || username === undefined) {
                return response.status(400).send('Request is malformed or invalid. The body is missing properties');
            }
            if (typeof content !== 'string' || typeof username !== 'string') {
                return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
            }
            for (let property in request.body) {
                if (!['id', 'content', 'username'].includes(property)) {
                    return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
                }
            }

            // `id` present means "reply to that comment/reply"; absent means "new comment".
            if (id !== undefined) {
                if (!this.#isHexId(id)) {
                    return response.status(400).send('Request is malformed or invalid. The "id" must be a 24 character hex string');
                }
                const reply = await this.service.postReply({ parentId: id, content, username });
                return response.status(201).send(this.#replyToResponse(reply));
            }

            const comment = await this.service.postComment({ content, username });
            return response.status(201).send(this.#commentToResponse(comment));
        } catch (error) {
            return this.#sendError(response, error, "Error: Unable to create comment.");
        }
    };

    updateComment = async (request, response) => {
        try {
            if (!this.#isJson(request)) {
                return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
            }

            const { id, newContent, username, like } = request.body;

            if (id === undefined || (newContent === undefined && like === undefined) || (username === undefined && like === undefined)) {
                return response.status(400).send('Request is malformed or invalid. The body is missing properties');
            }
            if (!this.#isHexId(id)) {
                return response.status(400).send('Request is malformed or invalid. The "id" must be a 24 character hex string');
            }
            if ((newContent !== undefined && typeof newContent !== 'string') || (like !== undefined && typeof like !== 'boolean')) {
                return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
            }
            for (let property in request.body) {
                if (!['id', 'newContent', 'username', 'like'].includes(property)) {
                    return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
                }
            }

            if (newContent !== undefined) {
                const updated = await this.service.editComment({ id, newContent, username });
                return response.status(200).send(this.#toResponse(updated));
            }

            if (like !== undefined) {
                const updated = await this.service.vote({ id, like });
                return response.status(200).send(this.#toResponse(updated));
            }
        } catch (error) {
            return this.#sendError(response, error, "Error: Unable to update comment.");
        }
    };

    deleteComment = async (request, response) => {
        try {
            if (!this.#isJson(request)) {
                return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
            }

            const { id, username } = request.body;

            if (id === undefined || username === undefined) {
                return response.status(400).send('Request is malformed or invalid. The body is missing properties');
            }
            if (!this.#isHexId(id)) {
                return response.status(400).send('Request is malformed or invalid. The "id" must be a 24 character hex string');
            }
            for (let property in request.body) {
                if (!['id', 'username'].includes(property)) {
                    return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
                }
            }

            const removed = await this.service.remove({ id, username });
            return response.status(200).send(this.#toResponse(removed));
        } catch (error) {
            return this.#sendError(response, error, "Error: Unable to delete comment.");
        }
    };

    /* ---- presenters: domain object -> the JSON shape the frontend expects ---- */
    /* The frontend keys off `_id`, so we translate the domain's `id` back here.   */

    #replyToResponse(reply) {
        return {
            _id: reply.id,
            content: reply.content,
            createdAt: reply.createdAt,
            score: reply.score,
            replyingTo: reply.replyingTo,
            user: reply.user,
        };
    }

    #commentToResponse(comment) {
        return {
            _id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            score: comment.score,
            user: comment.user,
            replies: comment.replies.map(reply => this.#replyToResponse(reply)),
        };
    }

    /** A use case may return either a Comment or a Reply; present accordingly. */
    #toResponse(entity) {
        return entity instanceof Comment ? this.#commentToResponse(entity) : this.#replyToResponse(entity);
    }

    /* ---- request helpers ---- */

    /** Map a thrown error to an HTTP response. This is the ONLY place domain
     *  errors become status codes -- the use cases never mention HTTP. */
    #sendError(response, error, fallback) {
        console.error(`\n${error}`);
        if (error instanceof NotFoundError) return response.status(400).send(error.message);
        if (error instanceof NotOwnerError) return response.status(400).send(error.message);
        return response.status(500).send(`${fallback} ${error.message}`);
    }

    #isJson(request) {
        return request.headers['content-type'] && request.headers['content-type'].includes('application/json');
    }

    #isHexId(id) {
        return typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);
    }
}

export { CommentController };
