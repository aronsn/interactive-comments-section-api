/**
 * Composition root.
 *
 * This is the ONLY place in the codebase that knows the full dependency graph:
 * create the DatabaseClient, connect it, hand its `db` handle to App, listen.
 * Everything downstream receives its collaborators via constructor.
 */

import { App } from "./app/index.js";
import { DatabaseClient } from "./db/dbConnection.js";

const PORT = process.env.PORT || 5050;

const dbClient = await new DatabaseClient().connect();
const app = new App(dbClient.db);
app.listen(PORT);
