/**
 * Application layer for the comments feature.
 *
 * `CommentService` groups the use cases for the Comment aggregate -- the things
 * a user can do (list, post, reply, edit, vote, delete). Each method is the
 * same thin recipe: load the aggregate, invoke domain behaviour, save it back.
 *
 * No business rules live here (those are on the domain) and no SQL/Mongo lives
 * here (that is in the repository). The repository is injected through the
 * constructor, so this is testable with an in-memory fake and no database.
 */

import { Comment, NotOwnerError } from "./domain.js";

class NotFoundError extends Error {
    constructor(id) {
        super(`The provided id "${id}" did not return a match. It is either removed or does not exist.`);
        this.name = "NotFoundError";
    }
}

class CommentService {
    constructor(repository) {
        this.repository = repository;
    }

    listComments() {
        return this.repository.findAll();
    }

    postComment({ content, username }) {
        const comment = Comment.create({ content, username });
        return this.repository.add(comment);
    }

    async postReply({ parentId, content, username }) {
        const comment = await this.repository.findAggregateContaining(parentId);
        if (!comment) throw new NotFoundError(parentId);

        // You reply "to" whoever owns the thing you clicked (a comment or a reply).
        const replyingTo = comment.target(parentId).user.username;
        const reply = comment.addReply({ content, replyingTo, username });

        await this.repository.save(comment);
        return reply;
    }

    async editComment({ id, newContent, username }) {
        const comment = await this.repository.findAggregateContaining(id);
        if (!comment) throw new NotFoundError(id);

        // The ownership check happens INSIDE editContent -- one rule, one place.
        comment.target(id).editContent(newContent, username);

        await this.repository.save(comment);
        return comment.target(id);
    }

    async vote({ id, like }) {
        const comment = await this.repository.findAggregateContaining(id);
        if (!comment) throw new NotFoundError(id);

        comment.target(id).applyVote(like);

        await this.repository.save(comment);
        return comment.target(id);
    }

    async remove({ id, username }) {
        const comment = await this.repository.findAggregateContaining(id);
        if (!comment) throw new NotFoundError(id);

        const target = comment.target(id);
        if (!target.isOwnedBy(username)) {
            throw new NotOwnerError(target.user.username);
        }

        if (target === comment) {
            // Deleting the aggregate root: remove the whole document.
            await this.repository.removeComment(id);
        } else {
            // Deleting an embedded reply: mutate the aggregate, then save it.
            comment.removeReply(id);
            await this.repository.save(comment);
        }
        return target;
    }
}

export { CommentService, NotFoundError };
