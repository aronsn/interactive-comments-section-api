import express from "express";
import { GETCommentsRequest, POSTCommentRequest, POSTReplyRequest, PATCHCommentRequest, PATCHReplyRequest, DELETECommentRequest, DELETEReplyRequest } from "./controllers.js";

const router = express.Router();

router.route("/")
    .get(GETCommentsRequest)
    .post(POSTCommentRequest)
    .patch(PATCHCommentRequest)
    .delete(DELETEReplyRequest)

router.route("/reply")
    .post(POSTReplyRequest)
    .patch(PATCHReplyRequest)
    .delete(DELETECommentRequest)

export default router;