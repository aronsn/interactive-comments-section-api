/**
 * In-memory CommentRepositoryPort for tests.
 *
 * Because the application layer depends on the PORT and not on the concrete
 * Mongo repository, this fake is a drop-in substitute: the service can't tell
 * the difference. It mirrors the two behaviours the real repository adds on
 * top of storage -- assigning an id to a brand-new comment, and assigning ids
 * to newly-added replies on save -- so use cases behave identically without a
 * database. Ids are 24-char hex strings so they pass the controller's id check.
 */

import { Comment } from "../../app/comments/domain.js";
import type { CommentRepositoryPort } from "../../app/comments/application.js";

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

export { FakeCommentRepository };
