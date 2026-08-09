/**
 * HTTP integration tests (tier 1): the whole stack minus the database.
 *
 * The App is built with a FakeCommentRepository injected at the composition
 * root, exactly the way server.ts injects the real one -- so one test drives
 * request validation (presentation), use-case orchestration (application) and
 * response mapping in a single pass, with no Mongo and no network listener
 * (supertest talks to the Express app object directly).
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { buildTestApp } from "../helpers/testApp.js";

let api: ReturnType<typeof buildTestApp>;

beforeEach(() => {
    api = buildTestApp();
});

async function createComment(content = "first!", username = "amyrobson") {
    const response = await api.post("/api/comments").send({ content, username }).expect(201);
    return response.body;
}

describe("GET /api/comments", () => {
    test("returns 200 and an empty list when there are none", async () => {
        const response = await api.get("/api/comments").expect(200);
        assert.deepEqual(response.body, []);
    });

    test("returns comments that have been posted", async () => {
        await createComment("hello");
        const response = await api.get("/api/comments").expect(200);
        assert.equal(response.body.length, 1);
        assert.equal(response.body[0].content, "hello");
    });
});

describe("POST /api/comments", () => {
    test("creates a comment with a real id, score 0 and no replies", async () => {
        // The Act is the POST itself, so it stays inline and explicit here --
        // this is the one test that proves creation, so it can't lean on the
        // createComment helper (which would be testing the endpoint via itself).
        const response = await api
            .post("/api/comments")
            .send({ content: "brand new", username: "amyrobson" })
            .expect(201);

        const body = response.body;
        assert.match(body._id, /^[0-9a-fA-F]{24}$/);
        assert.equal(body.content, "brand new");
        assert.equal(body.score, 0);
        assert.deepEqual(body.replies, []);
    });

    test("posting with an id creates a reply on that aggregate", async () => {
        const comment = await createComment();
        const reply = await api
            .post("/api/comments")
            .send({ id: comment._id, content: "a reply", username: "maxblagun" })
            .expect(201);
        assert.equal(reply.body.replyingTo, "amyrobson");

        const all = await api.get("/api/comments").expect(200);
        assert.equal(all.body[0].replies.length, 1);
    });

    test("rejects a non-JSON content-type with 400", async () => {
        await api
            .post("/api/comments")
            .set("Content-Type", "text/plain")
            .send("content=hi")
            .expect(400);
    });

    test("rejects an unrecognized property with 400", async () => {
        await api
            .post("/api/comments")
            .send({ content: "hi", username: "amyrobson", role: "admin" })
            .expect(400);
    });
});

describe("PATCH /api/comments", () => {
    test("the owner can edit content", async () => {
        const comment = await createComment("old");
        const response = await api
            .patch("/api/comments")
            .send({ id: comment._id, newContent: "edited", username: "amyrobson" })
            .expect(200);
        assert.equal(response.body.content, "edited");
    });

    test("a non-owner editing is rejected with 400", async () => {
        const comment = await createComment("old");
        await api
            .patch("/api/comments")
            .send({ id: comment._id, newContent: "hacked", username: "mallory" })
            .expect(400);
    });

    test("voting changes the score", async () => {
        const comment = await createComment();
        const response = await api
            .patch("/api/comments")
            .send({ id: comment._id, like: true })
            .expect(200);
        assert.equal(response.body.score, 1);
    });

    test("rejects a malformed id with 400", async () => {
        await api
            .patch("/api/comments")
            .send({ id: "not-a-hex-id", like: true })
            .expect(400);
    });
});

describe("DELETE /api/comments", () => {
    test("the owner can delete their comment", async () => {
        const comment = await createComment();
        await api.delete("/api/comments").send({ id: comment._id, username: "amyrobson" }).expect(200);
        const all = await api.get("/api/comments").expect(200);
        assert.deepEqual(all.body, []);
    });

    test("a non-owner deleting is rejected with 400", async () => {
        const comment = await createComment();
        await api.delete("/api/comments").send({ id: comment._id, username: "mallory" }).expect(400);
    });
});
