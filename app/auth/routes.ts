/**
 * URL routing for the auth feature.
 *
 * `AuthRouter` receives a fully-built controller and binds its handlers to HTTP
 * verbs at construction time. It owns no collaborators of its own -- the
 * dependency comes in through the constructor (DI). Outside code reaches for
 * `.router` to mount the Express Router on a path.
 *
 * Mounted at `/api/auth` by `App`, so this declares `POST /api/auth/login`.
 */

import express, { type Router } from "express";
import type { AuthController } from "./presentation.js";

class AuthRouter {
    readonly router: Router;

    constructor(controller: AuthController) {
        this.router = express.Router();
        this.router.route("/login")
            .post(controller.login);
    }
}

export { AuthRouter };
