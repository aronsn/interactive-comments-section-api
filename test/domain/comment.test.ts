/**
 * Domain unit tests (tier 2): pure, no I/O, no database.
 *
 * These pin down the business RULES that live on the aggregate. They are the
 * cheapest, fastest tests in the suite -- every branch of ownership, voting
 * and reply-targeting is exercised here so the HTTP tests don't have to.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { Comment, Reply } from "../../app/comments/domain.js";
import { NotOwnerError } from "../../app/comments/errors.js";

describe("Comment.create", () => {
    test("starts unsaved (id null), score 0, no replies", () => {
        const comment = Comment.create({ content: "hi", username: "amyrobson" });
        assert.equal(comment.id, null);
        assert.equal(comment.score, 0);
        assert.deepEqual(comment.replies, []);
    });

    test("derives the author's avatar paths from the username", () => {
        const comment = Comment.create({ content: "hi", username: "amyrobson" });
        assert.equal(comment.user.username, "amyrobson");
        assert.equal(comment.user.image.png, "/avatars/image-amyrobson.png");
        assert.equal(comment.user.image.webp, "/avatars/image-amyrobson.webp");
    });
});

describe("editContent", () => {
    test("the owner may change the content", () => {
        const comment = Comment.create({ content: "old", username: "amyrobson" });
        comment.editContent("new", "amyrobson");
        assert.equal(comment.content, "new");
    });

    test("a non-owner is rejected with NotOwnerError and the content is unchanged", () => {
        const comment = Comment.create({ content: "old", username: "amyrobson" });
        assert.throws(() => comment.editContent("hacked", "mallory"), NotOwnerError);
        assert.equal(comment.content, "old");
    });
});

describe("applyVote", () => {
    test("like true adds one, like false subtracts one", () => {
        const comment = Comment.create({ content: "hi", username: "amyrobson" });
        comment.applyVote(true);
        comment.applyVote(true);
        comment.applyVote(false);
        assert.equal(comment.score, 1);
    });
});

describe("addReply / target / removeReply", () => {
    test("addReply attaches a reply through the root and returns it", () => {
        const comment = Comment.create({ content: "parent", username: "amyrobson" });
        const reply = comment.addReply({ content: "child", replyingTo: "amyrobson", username: "maxblagun" });
        assert.equal(comment.replies.length, 1);
        assert.equal(reply.replyingTo, "amyrobson");
        assert.ok(reply instanceof Reply);
    });

    test("target(id) resolves the comment itself, an embedded reply, or nothing", () => {
        const comment = new Comment({
            id: "a".repeat(24),
            content: "parent",
            createdAt: new Date(0),
            score: 0,
            user: { username: "amyrobson", image: { png: "", webp: "" } },
        });
        const reply = comment.addReply({ content: "child", replyingTo: "amyrobson", username: "maxblagun" });
        reply.id = "b".repeat(24);

        assert.equal(comment.target("a".repeat(24)), comment);
        assert.equal(comment.target("b".repeat(24)), reply);
        assert.equal(comment.target("c".repeat(24)), undefined);
    });

    test("removeReply drops the matching reply", () => {
        const comment = Comment.create({ content: "parent", username: "amyrobson" });
        const reply = comment.addReply({ content: "child", replyingTo: "amyrobson", username: "maxblagun" });
        reply.id = "b".repeat(24);
        comment.removeReply("b".repeat(24));
        assert.equal(comment.replies.length, 0);
    });
});
