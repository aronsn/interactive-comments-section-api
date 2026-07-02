/**
 * Application layer for the comments feature.
 *
 * `CommentService` groups the use cases for the Comment aggregate -- the things
 * a user can do (list, post, reply, edit, vote, delete). Each method is the
 * same thin recipe: load the aggregate, invoke domain behaviour, save it back.
 *
 * No business rules live here (those are on the domain) and no SQL/Mongo lives
 * here (that is in the repository). The repository is injected through the
 * constructor, so this is testable with an in-memory fake and no database.
 */

import { Comment, Reply } from "./domain.js";
import { NotFoundError, NotOwnerError } from "./errors.js";

/**
 * The port this layer depends on. The application declares what it needs from
 * persistence ("load an aggregate, save it back"); `CommentRepository` is the
 * adapter that implements it. Defining the interface HERE, next to its only
 * consumer, is what makes the dependency point inward: the repository imports
 * this, never the other way around.
 */
interface CommentRepositoryPort {
    findAll(): Promise<Comment[]>;
    findAggregateContaining(id: string): Promise<Comment | null>;
    add(comment: Comment): Promise<Comment>;
    save(comment: Comment): Promise<Comment>;
    removeComment(id: string): Promise<void>;
}

/* ---- use-case inputs: the plain data each method accepts ---- */

type PostCommentInput = {
    content: string;
    username: string;
};

type PostReplyInput = {
    parentId: string;
    content: string;
    username: string;
};

type EditCommentInput = {
    id: string;
    newContent: string;
    username: string;
};

type VoteInput = {
    id: string;
    like: boolean;
};

type RemoveCommentInput = {
    id: string;
    username: string;
};

type CommentEntity = Comment | Reply;

class CommentService {
    private readonly repository: CommentRepositoryPort;

    constructor(repository: CommentRepositoryPort) {
        this.repository = repository;
    }

    listComments(): Promise<Comment[]> {
        return this.repository.findAll();
    }

    postComment({ content, username }: PostCommentInput): Promise<Comment> {
        const comment = Comment.create({ content, username });
        return this.repository.add(comment);
    }

    async postReply({ parentId, content, username }: PostReplyInput): Promise<Reply> {
        const comment = await this.repository.findAggregateContaining(parentId);
        if (!comment) throw new NotFoundError(parentId);

        // You reply "to" whoever owns the thing you clicked (a comment or a reply).
        const replyingTo = this.#target(comment, parentId).user.username;
        const reply = comment.addReply({ content, replyingTo, username });

        await this.repository.save(comment);
        return reply;
    }

    async editComment({ id, newContent, username }: EditCommentInput): Promise<CommentEntity> {
        const comment = await this.repository.findAggregateContaining(id);
        if (!comment) throw new NotFoundError(id);

        // The ownership check happens INSIDE editContent -- one rule, one place.
        const target = this.#target(comment, id);
        target.editContent(newContent, username);

        await this.repository.save(comment);
        return target;
    }

    async vote({ id, like }: VoteInput): Promise<CommentEntity> {
        const comment = await this.repository.findAggregateContaining(id);
        if (!comment) throw new NotFoundError(id);

        const target = this.#target(comment, id);
        target.applyVote(like);

        await this.repository.save(comment);
        return target;
    }

    async remove({ id, username }: RemoveCommentInput): Promise<CommentEntity> {
        const comment = await this.repository.findAggregateContaining(id);
        if (!comment) throw new NotFoundError(id);

        const target = this.#target(comment, id);
        if (!target.isOwnedBy(username)) {
            throw new NotOwnerError(target.user.username);
        }

        if (target === comment) {
            // Deleting the aggregate root: remove the whole document.
            await this.repository.removeComment(id);
        } else {
            // Deleting an embedded reply: mutate the aggregate, then save it.
            comment.removeReply(id);
            await this.repository.save(comment);
        }
        return target;
    }

    #target(comment: Comment, id: string): CommentEntity {
        const target = comment.target(id);
        if (!target) throw new NotFoundError(id);
        return target;
    }
}

export { CommentService };
export type {
    CommentEntity,
    CommentRepositoryPort,
    EditCommentInput,
    PostCommentInput,
    PostReplyInput,
    RemoveCommentInput,
    VoteInput,
};
