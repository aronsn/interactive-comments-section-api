/**
 * Application layer for the users feature.
 *
 * `UserService` groups the use cases around the User account Entity. Like the
 * comments service, it depends only on a port (`UserRepositoryPort`) -- so it
 * is testable with an in-memory fake and knows nothing about MongoDB. The
 * concrete `UserRepository` implements this port and is injected via the
 * constructor from the composition root.
 */

import { User } from "./domain.js";

/**
 * The port this layer depends on. Declared HERE, next to its only consumer,
 * so the dependency points inward: the repository imports this, never the
 * other way around.
 */
interface UserRepositoryPort {
    findByUsername(username: string): Promise<User>;
}

class UserService {
    private readonly repository: UserRepositoryPort;

    constructor(repository: UserRepositoryPort) {
        this.repository = repository;
    }

    findUser(username: string): Promise<User> {
        return this.repository.findByUsername(username);
    }
}

export { UserService };
export type { UserRepositoryPort };
