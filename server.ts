/**
 * Composition root.
 *
 * This is the ONLY place in the codebase that knows the full dependency graph:
 * create the DatabaseClient, connect it, build the Mongo-backed repository from
 * its `db` handle, hand that repository to App, listen. Everything downstream
 * receives its collaborators via constructor -- and the one storage-specific
 * construction (the real CommentRepository) happens here, not inside App.
 */

import { App } from "./app/index.js";
import { CommentRepository } from "./app/comments/repository.js";
import { DatabaseClient } from "./db/dbConnection.js";

const PORT = Number(process.env.PORT || 5050);

const dbClient = await new DatabaseClient().connect();
const repository = new CommentRepository(dbClient.db);
const app = new App(repository);
app.listen(PORT);
