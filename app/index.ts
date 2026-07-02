/**
 * Express application wrapper.
 *
 * `App` is built from a `db` handle and wires the comments feature top-down:
 * repository -> service -> controller -> router. This is the only place in
 * the app where the dependency chain is constructed -- every layer receives
 * its collaborator(s) via constructor (DI).
 *
 * `App` itself receives `db` from the composition root (server.ts); it does
 * not import `dbConnection.ts` directly. That keeps `App` agnostic about how
 * the database is set up (real Mongo, in-memory fake, etc.).
 */

import cors from "cors";
import express, { type Express } from "express";
import type { Server } from "node:http";
import type { Db } from "mongodb";
import { CommentRepository } from "./comments/repository.js";
import { CommentService } from "./comments/application.js";
import { CommentController } from "./comments/presentation.js";
import { CommentsRouter } from "./comments/routes.js";

class App {
    readonly express: Express;

    constructor(db: Db) {
        this.express = express();
        this.#configureMiddleware();
        this.#mountRoutes(db);
    }

    #configureMiddleware(): void {
        this.express.use(cors({ origin: process.env.FRONTEND_URL }));
        this.express.use(express.json());
    }

    #mountRoutes(db: Db): void {
        const repository = new CommentRepository(db);
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
