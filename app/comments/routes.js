import express from "express";
import { fetchCommentSection, createCommentRequest, editCommentRequest, deleteCommentRequest } from "./controllers.js";

const router = express.Router();

router.route("/")
    .get(fetchCommentSection)
    .post(createCommentRequest)
    .patch(editCommentRequest)
    .delete(deleteCommentRequest)

export default router;