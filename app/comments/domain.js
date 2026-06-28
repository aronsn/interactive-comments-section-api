/**
 * Domain layer for the comments feature.
 *
 * These classes are the "domain model": they represent the real-world
 * concepts (a comment, a reply) together with the RULES that govern them.
 *
 * This file is PURE. It imports nothing from Express, MongoDB, or the
 * repository. It does not know how a comment is stored or transported.
 * Dependencies point INWARD: the repository depends on this file, never
 * the other way around. That is why the document<->domain mapping that
 * used to live here (`fromDocument`) now lives in the repository instead.
 */

class NotOwnerError extends Error {
    constructor(owner) {
        super(`This user is not the owner. "${owner}" is the owner of this document.`);
        this.name = "NotOwnerError";
    }
}

/** Build the author value for a comment/reply. The avatar paths are derived
 *  from the username, so the shape of a "user" is decided in one place. */
function createUser(username) {
    return {
        username,
        image: {
            png: `/avatars/image-${username}.png`,
            webp: `/avatars/image-${username}.webp`,
        },
    };
}

/**
 * A Reply is an Entity: it has identity (id) and behaviour, but it is NOT an
 * aggregate root. You always reach a Reply *through* its parent Comment.
 */
class Reply {
    constructor({ id, content, createdAt, score, replyingTo, user }) {
        this.id = id;
        this.content = content;
        this.createdAt = createdAt;
        this.score = score;
        this.replyingTo = replyingTo;
        this.user = user;
    }

    isOwnedBy(username) {
        return this.user.username === username;
    }

    /** The ownership rule lives HERE now, instead of being duplicated in controllers. */
    editContent(newContent, username) {
        if (!this.isOwnedBy(username)) {
            throw new NotOwnerError(this.user.username);
        }
        this.content = newContent;
    }

    /** like === true -> +1, like === false -> -1. */
    applyVote(like) {
        this.score += like ? 1 : -1;
    }
}

/**
 * A Comment is the Aggregate Root. It owns its replies, so all changes to a
 * reply go through the comment. Outside code holds a Comment, never a bare Reply.
 */
class Comment {
    constructor({ id, content, createdAt, score, user, replies = [] }) {
        this.id = id;
        this.content = content;
        this.createdAt = createdAt;
        this.score = score;
        this.user = user;
        this.replies = replies;
    }

    /** Create a brand-new comment. `id` is null until the repository assigns one. */
    static create({ content, username }) {
        return new Comment({
            id: null,
            content,
            createdAt: new Date(),
            score: 0,
            user: createUser(username),
            replies: [],
        });
    }

    isOwnedBy(username) {
        return this.user.username === username;
    }

    editContent(newContent, username) {
        if (!this.isOwnedBy(username)) {
            throw new NotOwnerError(this.user.username);
        }
        this.content = newContent;
    }

    applyVote(like) {
        this.score += like ? 1 : -1;
    }

    /** Add a reply to this aggregate. Goes THROUGH the root, never around it. */
    addReply({ content, replyingTo, username }) {
        const reply = new Reply({
            id: null,
            content,
            createdAt: new Date(),
            score: 0,
            replyingTo,
            user: createUser(username),
        });
        this.replies.push(reply);
        return reply;
    }

    removeReply(id) {
        this.replies = this.replies.filter(reply => reply.id !== id);
    }

    findReply(id) {
        return this.replies.find(reply => reply.id === id);
    }

    /** Return the entity inside this aggregate with the given id: either the
     *  comment itself or one of its replies. Lets callers act on "the target"
     *  without caring whether it is a comment or a reply. */
    target(id) {
        return this.id === id ? this : this.findReply(id);
    }
}

export { Comment, Reply, NotOwnerError, createUser };
