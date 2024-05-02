import express from "express";
import { getComments, postComment, postReply, deleteComment, deleteReply } from "../controllers/comments.js";

const router = express.Router();

router.route("/")
    .get(getComments)
    .post(postComment)
    .delete(deleteComment)

router.route("/reply")
    .post(postReply)
    .delete(deleteReply)

// TODO - delete route, patch route

export default router;