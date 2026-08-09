/**
 * URL routing for the users feature.
 *
 * `UsersRouter` receives a fully-built controller and binds its handlers to
 * HTTP verbs at construction time. It owns no collaborators of its own -- the
 * dependency comes in through the constructor (DI).
 *
 * Mounted at `/api/users` by `App`, so this declares `POST /api/users`.
 * Registration creates a user resource, which is why it lives under the users
 * path rather than `/api/auth/register`: the auth routes are for proving who
 * you already are.
 */

import express, { type Router } from "express";
import type { UserController } from "./presentation.js";

class UsersRouter {
    readonly router: Router;

    constructor(controller: UserController) {
        this.router = express.Router();
        this.router.route("/")
            .post(controller.register);
    }
}

export { UsersRouter };
