import { ObjectId } from "mongodb";
import { allComments, createComment, createReply, removeComment, removeReply, updateComment, updateReply } from "./services.js";

export const getCommentsRequest = async (request, response) => {
    try {
        const results = await allComments();
        return response.status(200).send(results);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Fetching comments failed. Error: ${error}`);
    }
}

export const postCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { content, createdAt, score, username } = request.body;

        if (content === undefined || createdAt === undefined || username === undefined || score === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof content !== 'string' || typeof createdAt !== 'string' || typeof username !== 'string' || typeof score !== 'number') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        const result = await createComment(content, createdAt, score, username);
        return response.status(201).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Creating comment failed. Error: ${error}`);
    }
}

export const postReplyRequest = async (request, response) => {
    try {
        let newDocument = {
            _id: new ObjectId(),
            content: request.body.content,
            createdAt: request.body.createdAt,
            score: request.body.score,
            replyingTo: request.body.replyingTo,
            user: {
                image: {
                    png: `../public/avatars/image-${request.body.user.username}.png`,
                    webp: `../public/avatars/image-${request.body.user.username}.webp`
                },
                username: request.body.user.username,
            },
            commentId: new ObjectId(request.body.id)
        };

        const result = await createReply(newDocument);
        response.status(204).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error creating reply: ${error}`);

    }
}

export const patchCommentRequest = async (request, response) => {
    try {
        let result = await updateComment(request.body.id, request.body.newContent);
        response.status(200).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error updating comment: ${error}`);
    }
}

export const patchReplyRequest = async (request, response) => {
    try {
        let result = await updateReply(request.body.id, request.body.newContent);
        response.status(200).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error updating reply: ${error}`);
    }
}

export const deleteCommentRequest = async (request, response) => {
    try {
        const result = await removeComment(request.body.targetId)
        response.status(204).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error deleting comment: ${error}`);
    }
}

export const deleteReplyRequest = async (request, response) => {
    try {
        const result = await removeReply(request.body.targetId);
        response.status(204).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error deleting reply: ${error}`);
    }
}