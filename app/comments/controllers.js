import { ObjectId } from "mongodb";
import { allComments, createComment, createReply, removeComment, removeReply, updateComment, updateReply } from "./services.js";

export const getCommentsRequest = async (req, res) => {
    try {
        const results = await allComments();
        res.send(results).status(200);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching comments");
    }
}

export const postCommentRequest = async (req, res) => {
    try {
        let newDocument = {
            _id: new ObjectId(),
            content: req.body.content,
            createdAt: req.body.createdAt,
            score: req.body.score,
            user: {
                image: {
                    png: `../public/avatars/image-${req.body.user.username}.png`,
                    webp: `../public/avatars/image-${req.body.user.username}.webp`
                },
                username: req.body.user.username,
            },
            replies: [],
        };

        const result = await createComment(newDocument);
        res.send(result).status(201);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding comment");
    }
}

export const postReplyRequest = async (req, res) => {
    try {
        let newDocument = {
            _id: new ObjectId(),
            content: req.body.content,
            createdAt: req.body.createdAt,
            score: req.body.score,
            replyingTo: req.body.replyingTo,
            user: {
                image: {
                    png: `../public/avatars/image-${req.body.user.username}.png`,
                    webp: `../public/avatars/image-${req.body.user.username}.webp`
                },
                username: req.body.user.username,
            },
            commentId: new ObjectId(req.body.id)
        };

        const result = await createReply(newDocument);
        res.send(result).status(204);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error adding reply");
    }
}

export const patchCommentRequest = async (req, res) => {
    try {
        let result = await updateComment(req.body.id, req.body.newContent);
        res.send(result).status(200);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating comment");
    }
}

export const patchReplyRequest = async (req, res) => {
    try {
        let result = await updateReply(req.body.id, req.body.newContent);
        res.send(result).status(200);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating reply");
    }
}

export const deleteCommentRequest = async (req, res) => {
    try {
        const result = await removeComment(req.body.targetId)
        res.send(result).status(204);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting comment");
    }
}

export const deleteReplyRequest = async (req, res) => {
    try {
        const result = await removeReply(req.body.targetId)
        res.send(result).status(204);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error deleting reply");
    }
}