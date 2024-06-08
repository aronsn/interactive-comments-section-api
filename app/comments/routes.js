import express from "express";
import { getCommentsRequest, postCommentRequest, postReplyRequest, patchCommentRequest, patchReplyRequest, deleteCommentRequest, deleteReplyRequest } from "./controllers.js";

const router = express.Router();

router.route("/")
    .get(getCommentsRequest)
    .post(postCommentRequest)
    .patch(patchCommentRequest)
    .delete(deleteReplyRequest)

router.route("/reply")
    .post(postReplyRequest)
    .patch(patchReplyRequest)
    .delete(deleteCommentRequest)

export default router;