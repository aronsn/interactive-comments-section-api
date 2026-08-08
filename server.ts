/**
 * Composition root.
 *
 * This is the ONLY place in the codebase that knows the full dependency graph:
 * read configuration from the environment, create the DatabaseClient, connect
 * it, build the Mongo-backed repositories from its `db` handle, build the
 * bcrypt and JWT adapters, hand them all to App, listen.
 *
 * Everything downstream receives its collaborators via constructor. Every
 * `new` here names a CONCRETE class -- this file is allowed to know the messy
 * specifics precisely because it is the only one that does. It is also where
 * `process.env` is read: no class below this line reaches for global config.
 *
 * The test suite has its own composition root (see test/http/*.test.ts), which
 * builds the same App from fakes. That is the whole payoff of doing it here.
 */

import { App } from "./app/index.js";
import { CommentRepository } from "./app/comments/repository.js";
import { UserRepository } from "./app/users/repository.js";
import { BcryptPasswordHasher } from "./app/auth/passwordHasher.js";
import { JSONWebToken } from "./app/auth/tokenService.js";
import { DatabaseClient } from "./db/dbConnection.js";

/**
 * Read a required variable, or fail loudly at startup.
 *
 * Config problems should crash the process here, before anything is built --
 * not surface as a confusing error from deep inside an adapter, and never as a
 * request that silently succeeds with an empty signing key.
 */
function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(
            `Missing required environment variable ${name}. ` +
            `Set it in config.env (loaded by \`npm run dev\` via --env-file, ` +
            `and by docker compose via \`env_file:\`).`,
        );
    }
    return value;
}

const PORT = Number(process.env.PORT || 5050);

// ~220ms per hash on current hardware. Raise it as machines get faster; the
// value is not secret (bcrypt stores it inside every hash it produces).
const BCRYPT_COST = Number(process.env.BCRYPT_COST || 12);

const dbClient = await new DatabaseClient().connect();

const app = new App({
    commentsRepository: new CommentRepository(dbClient.db),
    usersRepository: new UserRepository(dbClient.db),
    passwordHasher: new BcryptPasswordHasher(BCRYPT_COST),
    tokenService: new JSONWebToken(requireEnv("JWT_SECRET"), process.env.JWT_TTL ?? "1h"),
});

app.listen(PORT);
