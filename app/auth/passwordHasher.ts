/**
 * bcrypt adapter for `PasswordHasherPort`.
 *
 * The cost factor is injected rather than hardcoded, for two reasons: it needs
 * to rise over time as hardware gets faster, and tests need it LOW. At cost 12
 * a single hash takes ~220ms -- correct for production, unbearable in a test
 * suite that logs in on every case. Tests construct this with cost 4 (~7ms).
 *
 * The cost factor is not a secret: bcrypt stores it in plaintext inside every
 * hash it produces (`$2b$12$...`). It is injected for tuning, not secrecy.
 */

import bcrypt from "bcryptjs";
import type { PasswordHasherPort } from "./ports.js";

class BcryptPasswordHasher implements PasswordHasherPort {
    private readonly costFactor: number;

    constructor(costFactor: number) {
        this.costFactor = costFactor;
    }

    /** bcrypt generates and embeds the salt itself when given a cost factor. */
    async hash(plainPassword: string): Promise<string> {
        return bcrypt.hash(plainPassword, this.costFactor);
    }

    async verify(plainPassword: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hash);
    }
}

export { BcryptPasswordHasher };
