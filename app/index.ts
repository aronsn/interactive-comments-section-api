/**
 * Express application wrapper.
 *
 * `App` receives its adapters from the composition root (server.ts) and wires
 * each feature top-down: service -> controller -> router. It constructs the
 * services and controllers itself because there is only ever one of those and
 * nothing about them varies between environments. It refuses to construct the
 * things that DO vary -- repositories, the password hasher, the token service
 * -- and demands them through the constructor instead. That is the line
 * between "composition that can live here" and "composition that belongs in
 * the root".
 *
 * Because it only ever sees ports, `App` is agnostic about how anything is
 * implemented: real Mongo and bcrypt in production, in-memory fakes and a
 * cheap cost factor in tests.
 *
 * Dependencies arrive as a named object rather than positional arguments:
 * with four collaborators, `new App(a, b, c, d)` is easy to get wrong at a
 * call site and gives no hint what each slot means.
 */

import cors from "cors";
import express, { type Express } from "express";
import type { Server } from "node:http";
import { CommentService } from "./comments/application.js";
import type { CommentRepositoryPort } from "./comments/application.js";
import { CommentController } from "./comments/presentation.js";
import { CommentsRouter } from "./comments/routes.js";
import { AuthService } from "./auth/application.js";
import { AuthController } from "./auth/presentation.js";
import { AuthRouter } from "./auth/routes.js";
import type { PasswordHasherPort, TokenServicePort } from "./auth/ports.js";
import { UserService } from "./users/application.js";
import type { UserRepositoryPort } from "./users/application.js";
import { UserController } from "./users/presentation.js";
import { UsersRouter } from "./users/routes.js";

type AppDependencies = {
    commentsRepository: CommentRepositoryPort;
    usersRepository: UserRepositoryPort;
    passwordHasher: PasswordHasherPort;
    tokenService: TokenServicePort;
};

class App {
    readonly express: Express;

    constructor(dependencies: AppDependencies) {
        this.express = express();
        this.#configureMiddleware();
        this.#mountComments(dependencies);
        this.#mountUsers(dependencies);
        this.#mountAuth(dependencies);
    }

    #configureMiddleware(): void {
        this.express.use(cors({ origin: process.env.FRONTEND_URL }));
        this.express.use(express.json());
    }

    #mountUsers({ usersRepository, passwordHasher }: AppDependencies): void {
        const service = new UserService(usersRepository, passwordHasher);
        const controller = new UserController(service);
        const router = new UsersRouter(controller);
        this.express.use("/api/users", router.router);
    }

    #mountAuth({ usersRepository, passwordHasher, tokenService }: AppDependencies): void {
        const service = new AuthService(usersRepository, passwordHasher, tokenService);
        const controller = new AuthController(service);
        const router = new AuthRouter(controller);
        this.express.use("/api/auth", router.router);
    }

    #mountComments({ commentsRepository }: AppDependencies): void {
        const service = new CommentService(commentsRepository);
        const controller = new CommentController(service);
        const router = new CommentsRouter(controller);
        this.express.use("/api/comments", router.router);
    }

    listen(port: number): Server {
        return this.express.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    }
}

export { App };
export type { AppDependencies };
