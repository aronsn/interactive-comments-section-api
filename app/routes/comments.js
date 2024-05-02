import express from "express";
import { getComments, postComment, postReply, patchComment, patchReply, deleteComment, deleteReply } from "../controllers/comments.js";

const router = express.Router();

router.route("/")
    .get(getComments)
    .post(postComment)
    .patch(patchComment)
    .delete(deleteComment)

router.route("/reply")
    .post(postReply)
    .patch(patchReply)
    .delete(deleteReply)

// TODO - patch route

export default router;