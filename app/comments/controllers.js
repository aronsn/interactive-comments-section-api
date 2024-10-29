import { getComments, createComment, createReply, findComment, removeComment, removeReply, updateComment, updateReply, updateCommentScore, updateReplyScore } from "./services.js";

export const fetchCommentSection = async (request, response) => {
    try {
        let results = await getComments();
        return response.status(200).send(results);
    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Fetching comments failed. Error: ${error}`);
    }
}

export const createCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, content, username } = request.body;

        if (content === undefined || username === undefined) {
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

        if (id !== undefined) {
            if (!/^[0-9a-fA-F]{24}$/.test(id) || typeof id !== 'string') {
                return response.status(400).send('Request is malformed or invalid. The "id" must be a 24 character hex string');
            }

            const comment = await findComment(id);
            const replyingTo = comment.user.username;

            if (!comment) {
                return response.status(400).send('The provided comment id did not return a match. Comment is either removed or does not exist.');
            }

            let result = await createReply({ id, content, score: 0, replyingTo, username });

            return response.status(201).send(result);
        }

        let result = await createComment({ content, score: 0, username });

        return response.status(201).send(result);

    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Error: Unable to create comment. ${error}`);
    }
}

export const editCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, newContent, username, like } = request.body;

        if (id === undefined || username === undefined || (newContent === undefined && like === undefined)) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (!/^[0-9a-fA-F]{24}$/.test(id) || typeof id !== 'string') {
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
            const comment = await findComment(id);
            const isReply = comment?.replyingTo;

            if (!comment) {
                return response.status(400).send('The provided comment id did not return a match. Comment is either removed or does not exist.');
            }

            if (username !== comment.user.username) {
                return response.status(400).send(`This user is not the owner ${comment.user.username} is not the owner of this document`);
            }

            if (isReply) {
                let result = await updateReply({ id, newContent });
                return response.status(204).send(result);
            }

            let result = await updateComment({ id, newContent });
            return response.status(200).send(result);
        }

        if (like !== undefined) {
            const comment = await findComment(id);
            const isReply = comment?.replyingTo;

            let number = null;
            if (like === true) {
                number = 1;
            } else {
                number = -1;
            }

            if (!comment) {
                return response.status(400).send('The provided comment id did not return a match. Comment is either removed or does not exist.');
            }

            if (isReply) {
                let result = await updateReplyScore({ id, score: number });
                return response.status(204).send(result);
            }

            let result = await updateCommentScore({ id, score: number });
            return response.status(200).send(result);
        }
    } catch (error) {
        console.error(`\n${error}`);
        response.status(500).send(`Error: Unable to update comment. ${error.message}`);
    }
}

export const deleteCommentRequest = async (request, response) => {
    try {
        if (!request.headers['content-type'] && request.headers['content-type'] !== 'application/json') {
            return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
        }

        const { id, username } = request.body;

        if (id === undefined || username === undefined) {
            return response.status(400).send('Request is malformed or invalid. The body is missing properties');
        }

        if (!/^[0-9a-fA-F]{24}$/.test(id) || typeof id !== 'string') {
            return response.status(400).send('Request is malformed or invalid. The "id" must be a 24 character hex string');
        }

        for (let property in request.body) {
            if (!['id', 'username'].includes(property)) {
                return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
            }
        }

        const comment = await findComment(id);
        const isReply = comment?.replyingTo;

        if (!comment) {
            return response.status(400).send('The provided comment id did not return a match. Comment is either removed or does not exist.');
        }

        if (username !== comment.user.username) {
            return response.status(400).send(`This user is not the owner ${comment.user.username} is not the owner of this document`);
        }

        if (isReply) {
            await removeReply({ id });
            return response.status(204).send("Document successfully deleted");
        }

        await removeComment({ id });
        return response.status(204).send("Document successfully deleted");

    } catch (error) {
        console.error(`\n${error}`);
        return response.status(500).send(`Error: Unable to delete comment. ${error.message}`);
    }
}

