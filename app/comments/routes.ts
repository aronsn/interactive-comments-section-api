/**
 * URL routing for the comments feature.
 *
 * `CommentsRouter` receives a fully-built controller and binds its handlers
 * to HTTP verbs at construction time. It owns no collaborators of its own --
 * the dependency comes in through the constructor (DI). Outside code reaches
 * for `.router` to mount the Express Router on a path.
 */

import express, { type Router } from "express";
import type { CommentController } from "./presentation.js";

class CommentsRouter {
    readonly router: Router;

    constructor(controller: CommentController) {
        this.router = express.Router();
        this.router.route("/")
            .get(controller.getComments)
            .post(controller.createComment)
            .patch(controller.updateComment)
            .delete(controller.deleteComment);
    }
}

export { CommentsRouter };
