/**
 * URL routing for the users feature.
 *
 * `UsersRouter` receives a fully-built controller and binds its handlers to
 * HTTP verbs at construction time. It owns no collaborators of its own -- the
 * dependency comes in through the constructor (DI). Outside code reaches for
 * `.router` to mount the Express Router on a path.
 */

import express, { type Router } from "express";
import type { UserController } from "./presentation.js";

class UsersRouter {
    readonly router: Router;

    constructor(controller: UserController) {
        this.router = express.Router();
        this.router.route("/login")
            .post(controller.login);
    }
}

export { UsersRouter };
