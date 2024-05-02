import express from "express";
import { getAllComments, postCreateReply, postCreateComment, deleteRemoveReply } from "../controllers/comments.js";

const router = express.Router();

router.route("/")
    .get(getAllComments)
    .post(postCreateComment)
    .delete(() => { })

router.route("/reply")
    .post(postCreateReply)
    .delete(deleteRemoveReply)

// TODO - delete route, patch route

export default router;