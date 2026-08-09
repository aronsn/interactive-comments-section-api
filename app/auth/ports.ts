/**
 * Ports for the cross-cutting auth concerns.
 *
 * These interfaces describe WHAT the application layer needs ("turn a password
 * into a hash", "sign a token") without naming HOW it happens. The adapters
 * that implement them -- `BcryptPasswordHasher`, `JSONWebToken` -- import from
 * this file; so do their consumers.
 *
 * They live in their own file, apart from the adapters, so a service can depend
 * on the port without dragging `bcryptjs` or `jsonwebtoken` into its import
 * graph. Unlike `UserRepositoryPort` (declared next to its single consumer in
 * `users/application.ts`), these are shared infrastructure: more than one
 * feature will need them, so no single feature owns them.
 */

import type { Principal } from "./principal.js";

interface PasswordHasherPort {
    hash: (plainPassword: string) => Promise<string>;
    verify: (plainPassword: string, hash: string) => Promise<boolean>;
}

interface TokenServicePort {
    sign: (claims: { userId: string }) => string;
    verify: (token: string) => Principal;
}

export type { PasswordHasherPort, TokenServicePort };
