/**
 * Express application wrapper.
 *
 * `App` is built from a `db` handle and wires the comments feature top-down:
 * repository -> service -> controller -> router. This is the only place in
 * the app where the dependency chain is constructed -- every layer receives
 * its collaborator(s) via constructor (DI).
 *
 * `App` receives a `CommentRepositoryPort` from the composition root
 * (server.ts); it does not import `CommentRepository` or `dbConnection.ts`
 * directly. That keeps `App` agnostic about how comments are stored -- real
 * Mongo in production, an in-memory fake in tests -- since it only ever sees
 * the port, never the concrete adapter.
 */

import cors from "cors";
import express, { type Express } from "express";
import type { Server } from "node:http";
import { CommentService } from "./comments/application.js";
import type { CommentRepositoryPort } from "./comments/application.js";
import { CommentController } from "./comments/presentation.js";
import { CommentsRouter } from "./comments/routes.js";
import { UserService } from "./users/application.js";
import type { UserRepositoryPort } from "./users/application.js";
import { UserController } from "./users/presentation.js";
import { UsersRouter } from "./users/routes.js";

class App {
    readonly express: Express;

    constructor(commentsRepository: CommentRepositoryPort, usersRepository: UserRepositoryPort ) {
        this.express = express();
        this.#configureMiddleware();
        this.#mountComments(commentsRepository);
        this.#mountUsers(usersRepository);
    }

    #configureMiddleware(): void {
        this.express.use(cors({ origin: process.env.FRONTEND_URL }));
        this.express.use(express.json());
    }
    #mountUsers(repository: UserRepositoryPort): void {
        const service = new UserService(repository);
        const controller = new UserController(service);
        const userRouter = new UsersRouter(controller);
        this.express.use("/api/auth", userRouter.router);
    }

    #mountComments(repository: CommentRepositoryPort): void {
        const service = new CommentService(repository);
        const controller = new CommentController(service);
        const commentsRouter = new CommentsRouter(controller);
        this.express.use("/api/comments", commentsRouter.router);
    }


   
    listen(port: number): Server {
        return this.express.listen(port, () => {
            console.log(`Server listening on port ${port}`);
        });
    }
}

export { App };
