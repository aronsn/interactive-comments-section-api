import { allComments, createComment, createReply, removeComment, removeReply, updateComment, updateReply } from "./services.js";

export const GETCommentsRequest = async (request, response) => {
    try {
        const results = await allComments();
        return response.status(200).send(results);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Fetching comments failed. Error: ${error}`);
    }
}

export const POSTCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { content, createdAt, username } = request.body;

        for (let key in request.body) {
            if (!['content', 'createdAt', 'username'].includes(key)) {
                return response.status(400).send('Request is malformed or invalid. The body has unwanted properties');
            }
        }

        if (content === undefined || createdAt === undefined || username === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof content !== 'string' || typeof createdAt !== 'string' || typeof username !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        const result = await createComment({ content, createdAt, score: 0, username });

        return response.status(201).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Creating comment failed. Error: ${error}`);
    }
}

export const POSTReplyRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, content, createdAt, replyingTo, username } = request.body;

        for (let key in request.body) {
            if (!['id', 'content', 'createdAt', 'replyingTo', 'username'].includes(key)) {
                return response.status(400).send('Request is malformed or invalid. The body has unwanted properties');
            }
        }

        if (id === undefined || content === undefined || createdAt === undefined || username === undefined || replyingTo === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof id !== 'string' || typeof content !== 'string' || typeof createdAt !== 'string' || typeof username !== 'string' || typeof replyingTo !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        const result = await createReply({ id, content, createdAt, score: 0, replyingTo, username });

        return response.status(201).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error creating reply: ${error}`);

    }
}

export const PATCHCommentRequest = async (request, response) => {
    try {
        let result = await updateComment(request.body.id, request.body.newContent);
        response.status(200).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error updating comment: ${error}`);
    }
}

export const PATCHReplyRequest = async (request, response) => {
    try {
        let result = await updateReply(request.body.id, request.body.newContent);
        response.status(200).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error updating reply: ${error}`);
    }
}

export const DELETECommentRequest = async (request, response) => {
    try {
        const result = await removeComment(request.body.targetId)
        response.status(204).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error deleting comment: ${error}`);
    }
}

export const DELETEReplyRequest = async (request, response) => {
    try {
        const result = await removeReply(request.body.targetId);
        response.status(204).send(result);
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error deleting reply: ${error}`);
    }
}