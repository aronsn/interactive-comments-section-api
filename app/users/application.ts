/**
 * Application layer for the users feature.
 *
 * `UserService` owns the use cases that CREATE and MUTATE user accounts.
 * Reading a user to prove identity is the other side of the line and lives in
 * `app/auth/application.ts` -- login produces a session, not a user.
 *
 * The two services never call each other. Both depend on the port below and on
 * `PasswordHasherPort` directly, so a change to registration cannot break
 * login. Sharing a port between two consumers is normal; sharing a service
 * would build a chain.
 */

import { User } from "./domain.js";
import { WeakPasswordError } from "./errors.js";
import type { PasswordHasherPort } from "../auth/ports.js";

const PASSWORD_MIN_LENGTH = 8;
/** bcrypt silently ignores everything past 72 BYTES. A longer password would
 *  appear to work while the tail did nothing, so reject it rather than lie. */
const PASSWORD_MAX_BYTES = 72;

/**
 * The port for user persistence. Declared in the application layer, next to
 * the use cases that consume it, so the dependency points inward:
 * `UserRepository` imports this to implement it, never the other way around.
 *
 * `AuthService` imports it too -- it needs `findByEmail` to log someone in.
 * A port having more than one consumer is normal; what matters is that the
 * adapter depends on the interface.
 */
interface UserRepositoryPort {
    findByEmail(email: string): Promise<User>;
    add(user: User): Promise<User>;
}

type RegisterInput = {
    username: string;
    email: string;
    password: string;
};

class UserService {
    private readonly users: UserRepositoryPort;
    private readonly passwordHasher: PasswordHasherPort;

    constructor(users: UserRepositoryPort, passwordHasher: PasswordHasherPort) {
        this.users = users;
        this.passwordHasher = passwordHasher;
    }

    /**
     * Create an account.
     *
     * Note what is NOT here: a "is this email taken?" query before the insert.
     * Between that check and the insert, another request can register the same
     * address -- so the check would be reassuring and wrong. The unique indexes
     * on `users.email` and `users.username` are the real guard, and the
     * repository turns a duplicate-key violation into the matching domain error.
     *
     * The plaintext password exists only inside this method: validated, hashed,
     * and dropped. It is never stored on the entity or passed any further.
     */
    async register({ username, email, password }: RegisterInput): Promise<User> {
        this.#assertValidPassword(password);

        const passwordHash = await this.passwordHasher.hash(password);

        return this.users.add(User.create({ username, email, passwordHash }));
    }

    /**
     * The password policy. It lives here rather than on `User` because a User
     * holds a HASH -- there is no plaintext password on the entity for this to
     * be an invariant of. It is a precondition of the use case instead.
     *
     * Private, so the only way to reach it is through a use case that already
     * calls it. When a second one appears (`changePassword`), it goes on this
     * class too and reuses this method.
     */
    #assertValidPassword(password: string): void {
        if (password.length < PASSWORD_MIN_LENGTH) {
            throw new WeakPasswordError(`must be at least ${PASSWORD_MIN_LENGTH} characters.`);
        }
        if (Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
            throw new WeakPasswordError(`must be at most ${PASSWORD_MAX_BYTES} bytes.`);
        }
    }
}

export { UserService };
export type { UserRepositoryPort, RegisterInput };
