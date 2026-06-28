/**
 * Repository (Data Mapper) for the Comment aggregate.
 *
 * This is the ONLY layer that knows MongoDB exists. It translates in both
 * directions between the database document shape and the pure domain object:
 *
 *     document  --#toDomain-->   Comment   (rich, with behaviour)
 *     Comment   --#toDocument--> document  (flat, ready for Mongo)
 *
 * Because replies are embedded in the comment document, the whole Comment is
 * one aggregate: we load it, mutate it through the domain, then `save` the
 * entire thing back. The repository depends on the domain; the domain knows
 * nothing about the repository (dependencies point inward).
 */

import { ObjectId } from "mongodb";
import { Comment, Reply } from "./domain.js";

class CommentRepository {
    constructor(db) {
        this.collection = db.collection("comments");
    }

    /** document -> domain. Mongo's ObjectId becomes a plain string id so the
     *  domain stays storage-agnostic. */
    #toDomain(doc) {
        return new Comment({
            id: doc._id.toString(),
            content: doc.content,
            createdAt: doc.createdAt,
            score: doc.score,
            user: doc.user,
            replies: (doc.replies ?? []).map(reply => new Reply({
                id: reply._id.toString(),
                content: reply.content,
                createdAt: reply.createdAt,
                score: reply.score,
                replyingTo: reply.replyingTo,
                user: reply.user,
            })),
        });
    }

    /** domain -> document. Entities without an id (newly created comments or
     *  replies) get a fresh ObjectId here, since id generation is a Mongo concern. */
    #toDocument(comment) {
        return {
            _id: comment.id ? new ObjectId(comment.id) : new ObjectId(),
            content: comment.content,
            createdAt: comment.createdAt,
            score: comment.score,
            user: comment.user,
            replies: comment.replies.map(reply => ({
                _id: reply.id ? new ObjectId(reply.id) : new ObjectId(),
                content: reply.content,
                createdAt: reply.createdAt,
                score: reply.score,
                replyingTo: reply.replyingTo,
                user: reply.user,
            })),
        };
    }

    async findAll() {
        const docs = await this.collection.find().toArray();
        return docs.map(doc => this.#toDomain(doc));
    }

    /** Load the Comment aggregate that owns `id`, whether `id` is the comment's
     *  own id or the id of one of its embedded replies. Returns null if neither. */
    async findAggregateContaining(id) {
        let doc = await this.collection.findOne({ _id: new ObjectId(id) });
        if (!doc) {
            doc = await this.collection.findOne({ "replies._id": new ObjectId(id) });
        }
        return doc ? this.#toDomain(doc) : null;
    }

    /** Insert a brand-new comment and return it with its assigned id. */
    async add(comment) {
        const doc = this.#toDocument(comment);
        await this.collection.insertOne(doc);
        return this.#toDomain(doc);
    }

    /** Persist the whole aggregate (the comment and all its replies). */
    async save(comment) {
        const doc = this.#toDocument(comment);
        await this.collection.replaceOne({ _id: doc._id }, doc);
        return this.#toDomain(doc);
    }

    /** Delete a top-level comment (and its embedded replies) entirely. */
    async removeComment(id) {
        await this.collection.deleteOne({ _id: new ObjectId(id) });
    }
}

export { CommentRepository };
