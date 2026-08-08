/**
 * Application layer for the auth feature.
 *
 * `AuthService` owns the use cases that prove identity. It reads users but
 * never writes them -- creating and editing accounts belongs to the users
 * module. It depends only on PORTS (`UserRepositoryPort`, `PasswordHasherPort`,
 * `TokenServicePort`), so it can be exercised with fakes and knows nothing
 * about MongoDB, bcrypt, or JWTs.
 *
 * No HTTP appears here: `login` takes two strings and returns a token string
 * or throws. Mapping that to status codes is `presentation.ts`'s job.
 */

import type { User } from "../users/domain.js";
import type { UserRepositoryPort } from "../users/application.js";
import { NotFoundError } from "../users/errors.js";
import { InvalidCredentialsError } from "./errors.js";
import type { PasswordHasherPort, TokenServicePort } from "./ports.js";

type LoginInput = {
    username: string;
    password: string;
};

class AuthService {
    private readonly users: UserRepositoryPort;
    private readonly passwordHasher: PasswordHasherPort;
    private readonly tokenService: TokenServicePort;

    /** Lazily-built hash used only to keep timing constant -- see #decoyHash. */
    #decoy: Promise<string> | null = null;

    constructor(
        users: UserRepositoryPort,
        passwordHasher: PasswordHasherPort,
        tokenService: TokenServicePort,
    ) {
        this.users = users;
        this.passwordHasher = passwordHasher;
        this.tokenService = tokenService;
    }

    /**
     * Verify credentials and issue a token.
     *
     * Both failure modes -- no such user, wrong password -- raise the SAME
     * error, and both take the same amount of time (see #decoyHash). An
     * attacker learns nothing about which usernames are real.
     */
    async login({ username, password }: LoginInput): Promise<string> {
        const user = await this.#findOrNull(username);
        const hash = user?.passwordHash ?? (await this.#decoyHash());
        const passwordMatches = await this.passwordHasher.verify(password, hash);

        if (!user || !passwordMatches) throw new InvalidCredentialsError();

        // A user loaded from storage always has an id; a null one is a bug in
        // the repository, not a credential problem, so it must not become a 401.
        if (!user.id) throw new Error(`User "${username}" was loaded without an id`);

        return this.tokenService.sign({ userId: user.id });
    }

    /**
     * The repository signals "no such user" by throwing; here that is not an
     * error but one of two ordinary outcomes, so it is converted to null and
     * `login` decides what it means.
     */
    async #findOrNull(username: string): Promise<User | null> {
        try {
            return await this.users.findByUsername(username);
        } catch (error) {
            if (error instanceof NotFoundError) return null;
            throw error;
        }
    }

    /**
     * A throwaway hash to compare against when the username doesn't exist.
     *
     * Without it, an unknown username returns immediately while a known one
     * costs a ~200ms bcrypt comparison -- and that timing difference is itself
     * a way to enumerate accounts. Hashing through the injected hasher (rather
     * than hardcoding a literal) keeps the decoy at whatever cost factor this
     * deployment is configured for. Computed once, then reused.
     */
    #decoyHash(): Promise<string> {
        this.#decoy ??= this.passwordHasher.hash("no-user-with-this-name");
        return this.#decoy;
    }
}

export { AuthService };
export type { LoginInput };
