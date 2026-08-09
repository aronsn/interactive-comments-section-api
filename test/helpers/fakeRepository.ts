/**
 * In-memory repository ports for tests.
 *
 * Because the application layer depends on the PORT and not on the concrete
 * Mongo repository, these fakes are drop-in substitutes: a service can't tell
 * the difference. Each mirrors the behaviour the real repository adds on top of
 * storage, so use cases behave identically without a database.
 */

import { Comment } from "../../app/comments/domain.js";
import type { CommentRepositoryPort } from "../../app/comments/application.js";
import { User } from "../../app/users/domain.js";
import type { UserRepositoryPort } from "../../app/users/application.js";
import { EmailTakenError, NotFoundError, UsernameTakenError } from "../../app/users/errors.js";

/**
 * Mirrors the two behaviours the real comment repository adds on top of
 * storage -- assigning an id to a brand-new comment, and assigning ids to newly
 * added replies on save. Ids are 24-char hex strings so they pass the
 * controller's id check.
 */
class FakeCommentRepository implements CommentRepositoryPort {
    #comments = new Map<string, Comment>();
    #seq = 0;

    #nextId(): string {
        this.#seq += 1;
        return this.#seq.toString(16).padStart(24, "0");
    }

    async findAll(): Promise<Comment[]> {
        return [...this.#comments.values()];
    }

    async findAggregateContaining(id: string): Promise<Comment | null> {
        for (const comment of this.#comments.values()) {
            if (comment.id === id || comment.replies.some(reply => reply.id === id)) {
                return comment;
            }
        }
        return null;
    }

    async add(comment: Comment): Promise<Comment> {
        comment.id = this.#nextId();
        this.#comments.set(comment.id, comment);
        return comment;
    }

    async save(comment: Comment): Promise<Comment> {
        for (const reply of comment.replies) {
            if (reply.id === null) reply.id = this.#nextId();
        }
        if (comment.id) this.#comments.set(comment.id, comment);
        return comment;
    }

    async removeComment(id: string): Promise<void> {
        this.#comments.delete(id);
    }
}

/**
 * Seeded with whatever users a test needs. Like the Mongo adapter, it signals
 * "no such user" by THROWING `NotFoundError` rather than returning null -- if
 * it returned null instead, `AuthService.#findOrNull` would never exercise its
 * error-conversion path and the test would prove nothing about it.
 */
class FakeUserRepository implements UserRepositoryPort {
    /** Keyed by email, the identifier callers log in with. */
    #users = new Map<string, User>();
    #seq = 0;

    constructor(users: User[] = []) {
        for (const user of users) this.#users.set(user.email, user);
    }

    #nextId(): string {
        this.#seq += 1;
        return this.#seq.toString(16).padStart(24, "0");
    }

    async findByEmail(email: string): Promise<User> {
        const user = this.#users.get(email);
        if (!user) throw new NotFoundError(email);
        return user;
    }

    /**
     * Stands in for the two unique indexes: the real repository lets Mongo
     * reject the duplicate and converts error 11000 into these same domain
     * errors, reading `keyPattern` to tell which field collided.
     */
    async add(user: User): Promise<User> {
        if (this.#users.has(user.email)) throw new EmailTakenError(user.email);
        for (const existing of this.#users.values()) {
            if (existing.username === user.username) throw new UsernameTakenError(user.username);
        }

        user.id = this.#nextId();
        this.#users.set(user.email, user);
        return user;
    }
}

export { FakeCommentRepository, FakeUserRepository };
