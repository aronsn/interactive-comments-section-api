/**
 * jsonwebtoken adapter for `TokenServicePort`.
 *
 * This is the ONLY file that knows tokens are JWTs. Callers hand it claims and
 * get an opaque string back; on the way in they hand it a string and get a
 * `Principal`. Library-specific failures (`TokenExpiredError`,
 * `JsonWebTokenError`) are caught here and re-thrown as the domain's
 * `InvalidTokenError`, so nothing above this layer imports jsonwebtoken.
 */

import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { Principal } from "./principal.js";
import { InvalidTokenError } from "./errors.js";
import type { TokenServicePort } from "./ports.js";

class JSONWebToken implements TokenServicePort {
    private readonly secret: string;
    private readonly expiresIn: string | number;

    constructor(secret: string, expiresIn: string | number) {
        if (!secret) throw new Error("JWT secret is missing");
        this.secret = secret;
        this.expiresIn = expiresIn;
    }

    sign(claims: { userId: string }): string {
        return jwt.sign(
            { sub: claims.userId },        // the payload (your claims)
            this.secret,                   // the signing key
            // `expiresIn` comes from config as a plain string ("1h"); the cast
            // stays here, in the adapter that owns jsonwebtoken's types.
            { expiresIn: this.expiresIn as SignOptions["expiresIn"] },
        );
    }

    verify(token: string): Principal {
        let decoded: string | JwtPayload;

        try {
            decoded = jwt.verify(token, this.secret);
        } catch {
            // TokenExpiredError / JsonWebTokenError die here, inside the adapter
            throw new InvalidTokenError();
        }

        if (typeof decoded === "string" || !decoded.sub) {
            throw new InvalidTokenError();
        }

        return new Principal(decoded.sub);
    }
}

export { JSONWebToken };
