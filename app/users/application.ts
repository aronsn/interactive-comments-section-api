/**
 * Application layer for the users feature.
 *
 * Right now this file declares only the port -- there are no user use cases
 * yet. Logging in reads users but belongs to the auth feature (it produces a
 * session, not a user), so it lives in `app/auth/application.ts`. A
 * `UserService` will appear here when the first use case that WRITES a user
 * does: registration, profile edits, password changes.
 *
 * That is also the split to keep as this grows: auth reads user records,
 * the users module creates and mutates them. Neither service should call the
 * other -- both depend on this port directly.
 */

import type { User } from "./domain.js";

/**
 * The port for user persistence. Declared in the application layer, next to
 * the use cases that will consume it, so the dependency points inward:
 * `UserRepository` imports this to implement it, never the other way around.
 *
 * `AuthService` imports it too. A port having more than one consumer is
 * normal -- what matters is that the adapter depends on the interface, not
 * that exactly one caller uses it.
 */
interface UserRepositoryPort {
    findByUsername(username: string): Promise<User>;
}

export type { UserRepositoryPort };
