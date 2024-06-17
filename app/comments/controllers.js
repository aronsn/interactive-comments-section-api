import { allComments, createComment, createReply, removeComment, removeReply, updateComment, updateReply } from "./services.js";

export const GETCommentsRequest = async (request, response) => {
    try {
        let results = await allComments();
        return response.status(200).send(results);
    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Fetching comments failed. Error: ${error}`);
    }
}

export const POSTCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { content, createdAt, username } = request.body;

        if (content === undefined || createdAt === undefined || username === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof content !== 'string' || typeof createdAt !== 'string' || typeof username !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        for (let property in request.body) {
            if (!['content', 'createdAt', 'username'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        let result = await createComment({ content, createdAt, score: 0, username });

        return response.status(201).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Creating comment failed. Error: ${error}`);
    }
}

export const POSTReplyRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, content, createdAt, replyingTo, username } = request.body;

        if (id === undefined || content === undefined || createdAt === undefined || username === undefined || replyingTo === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof id !== 'string' || typeof content !== 'string' || typeof createdAt !== 'string' || typeof username !== 'string' || typeof replyingTo !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        for (let property in request.body) {
            if (!['id', 'content', 'createdAt', 'replyingTo', 'username'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        let result = await createReply({ id, content, createdAt, score: 0, replyingTo, username });

        return response.status(201).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error creating reply: ${error}`);

    }
}

export const PATCHCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, newContent } = request.body;

        if (id === undefined || newContent === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof id !== 'string' || typeof newContent !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        for (let property in request.body) {
            if (!['id', 'newContent'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        let result = await updateComment({ id, newContent });
        return response.status(200).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error updating comment: ${error}`);
    }
}

export const PATCHReplyRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, newContent } = request.body;

        if (id === undefined || newContent === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof id !== 'string' || typeof newContent !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        for (let property in request.body) {
            if (!['id', 'newContent'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        let result = await updateReply({ id, newContent });
        return response.status(200).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Error updating reply: ${error}`);
    }
}

export const DELETECommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id } = request.body;

        if (id === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof id !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        for (let property in request.body) {
            if (!['id'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        let result = await removeComment({ id });
        return response.status(204).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Error deleting comment: ${error}`);
    }
}

export const DELETEReplyRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id } = request.body;

        if (id === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (typeof id !== 'string') {
            return response.status(400).send('Request is malformed or invalid. Check if the data types of the properties provided are correct');
        }

        for (let property in request.body) {
            if (!['id'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        let result = await removeReply({ id });
        return response.status(204).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Error deleting reply: ${error}`);
    }
}