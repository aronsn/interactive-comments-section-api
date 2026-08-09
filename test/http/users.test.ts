/**
 * HTTP integration tests for registration: the whole users stack minus the
 * database.
 *
 * The most valuable case here is the register-then-login pair -- it is the only
 * test that proves the two bounded contexts agree about how a password is
 * stored and how an email is normalized. UserService writes it, AuthService
 * reads it, and only real bcrypt adapters on both sides would catch a mismatch.
 */

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { buildTestApp } from "../helpers/testApp.js";

const USERNAME = "new_user";
const EMAIL = "new_user@example.com";
const PASSWORD = "correct-horse-battery-staple";

let api: ReturnType<typeof buildTestApp>;

// A fresh app per test: registration mutates the repository, so state must not
// leak between cases.
beforeEach(() => {
    api = buildTestApp();
});

function register(body: unknown) {
    return api.post("/api/users").send(body as object);
}

describe("POST /api/users", () => {
    test("creates an account and returns 201 with the new user", async () => {
        const response = await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);

        assert.equal(response.body.username, USERNAME);
        assert.equal(response.body.email, EMAIL);
        assert.equal(typeof response.body._id, "string");
        assert.equal(response.body.userImage.png, `/avatars/image-${USERNAME}.png`);
    });

    test("stores the email lowercased and trimmed", async () => {
        const response = await register({
            username: USERNAME,
            email: "  New_User@EXAMPLE.com  ",
            password: PASSWORD,
        }).expect(201);

        assert.equal(response.body.email, EMAIL);
    });

    test("never returns the password or its hash", async () => {
        const response = await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);

        assert.deepEqual(Object.keys(response.body).sort(), ["_id", "email", "userImage", "username"]);
        assert.ok(!JSON.stringify(response.body).includes(PASSWORD));
    });

    test("returns 409 when the email is already registered", async () => {
        await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);
        await register({ username: "someone_else", email: EMAIL, password: PASSWORD }).expect(409);
    });

    /* Capitalisation must not open a second account on the same address. */
    test("returns 409 for the same email in different capitalisation", async () => {
        await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);
        await register({ username: "someone_else", email: "NEW_USER@example.com", password: PASSWORD }).expect(409);
    });

    test("returns 409 when the username is already taken", async () => {
        await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);
        await register({ username: USERNAME, email: "other@example.com", password: PASSWORD }).expect(409);
    });

    test("returns 400 for an email that is not an address", async () => {
        await register({ username: USERNAME, email: "not-an-email", password: PASSWORD }).expect(400);
    });

    test("returns 400 for a password shorter than 8 characters", async () => {
        await register({ username: USERNAME, email: EMAIL, password: "short" }).expect(400);
    });

    test("returns 400 for a password longer than bcrypt's 72-byte limit", async () => {
        await register({ username: USERNAME, email: EMAIL, password: "a".repeat(73) }).expect(400);
    });

    test("returns 400 for a username with illegal characters", async () => {
        await register({ username: "Not Valid!", email: EMAIL, password: PASSWORD }).expect(400);
    });

    test("returns 400 for a username that is too short", async () => {
        await register({ username: "ab", email: EMAIL, password: PASSWORD }).expect(400);
    });

    test("returns 400 when a field is missing", async () => {
        await register({ username: USERNAME, email: EMAIL }).expect(400);
        await register({ username: USERNAME, password: PASSWORD }).expect(400);
        await register({ email: EMAIL, password: PASSWORD }).expect(400);
    });

    test("returns 400 for an unrecognised property", async () => {
        await register({ username: USERNAME, email: EMAIL, password: PASSWORD, admin: true }).expect(400);
    });

    test("returns 400 when Content-Type is not JSON", async () => {
        await api
            .post("/api/users")
            .set("Content-Type", "text/plain")
            .send(`{"username":"${USERNAME}","email":"${EMAIL}","password":"${PASSWORD}"}`)
            .expect(400);
    });

    test("a registered user can immediately log in with their email", async () => {
        const registered = await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);

        const loggedIn = await api
            .post("/api/auth/login")
            .send({ email: EMAIL, password: PASSWORD })
            .expect(200);

        assert.equal(typeof loggedIn.body.token, "string");

        // The token's subject must be the account that was just created.
        const [, payload] = loggedIn.body.token.split(".");
        const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
        assert.equal(claims.sub, registered.body._id);
    });

    test("a wrong password is still rejected after registering", async () => {
        await register({ username: USERNAME, email: EMAIL, password: PASSWORD }).expect(201);

        await api.post("/api/auth/login").send({ email: EMAIL, password: "wrong" }).expect(401);
    });
});
