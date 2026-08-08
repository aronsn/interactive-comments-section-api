/**
 * HTTP integration tests for login: the whole auth stack minus the database.
 *
 * The App is built with a FakeUserRepository injected at the test suite's
 * composition root, exactly the way server.ts injects the real one -- so one
 * test drives request validation (presentation), credential checking
 * (application), the real bcrypt adapter and the real JWT adapter in a single
 * pass, with no Mongo and no network listener.
 *
 * The password hasher is real, just configured at cost 4 instead of 12. Faking
 * it would be faster still, but then nothing would prove that a hash produced
 * by `hash` is actually accepted by `verify`.
 */

import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import { buildTestApp, makeUser, testTokenService } from "../helpers/testApp.js";
import { User } from "../../app/users/domain.js";

const USERNAME = "amyrobson";
const PASSWORD = "correct-horse-battery-staple";
const USER_ID = "000000000000000000000001";

let api: ReturnType<typeof buildTestApp>;
let user: User;

// `before`, not `beforeEach`: hashing is the slow part and nothing here mutates
// the repository, so one seeded user is enough for the whole file.
before(async () => {
    user = await makeUser(USERNAME, PASSWORD, USER_ID);
    api = buildTestApp([user]);
});

function login(body: unknown) {
    return api.post("/api/auth/login").send(body as object);
}

describe("POST /api/auth/login", () => {
    test("returns 200 and a token for correct credentials", async () => {
        const response = await login({ username: USERNAME, password: PASSWORD }).expect(200);

        assert.equal(typeof response.body.token, "string");
        assert.ok(response.body.token.length > 0);
    });

    test("issues a token carrying the user's id as the subject", async () => {
        const response = await login({ username: USERNAME, password: PASSWORD }).expect(200);

        const principal = testTokenService.verify(response.body.token);
        assert.equal(principal.userId, USER_ID);
    });

    test("never puts the password hash in the response", async () => {
        const response = await login({ username: USERNAME, password: PASSWORD }).expect(200);

        assert.deepEqual(Object.keys(response.body), ["token"]);
        assert.ok(!JSON.stringify(response.body).includes(user.passwordHash));
    });

    test("returns 401 for a wrong password", async () => {
        await login({ username: USERNAME, password: "wrong" }).expect(401);
    });

    test("returns 401 for an unknown username", async () => {
        await login({ username: "nobody", password: PASSWORD }).expect(401);
    });

    /* The point of the whole InvalidCredentialsError design: an attacker must
       not be able to tell "that user exists" from "that user does not". */
    test("gives an identical response for a wrong password and an unknown user", async () => {
        const wrongPassword = await login({ username: USERNAME, password: "wrong" });
        const unknownUser = await login({ username: "nobody", password: PASSWORD });

        assert.equal(wrongPassword.status, unknownUser.status);
        assert.equal(wrongPassword.text, unknownUser.text);
        assert.ok(!unknownUser.text.includes("nobody"));
    });

    test("returns 400 when the password is missing", async () => {
        await login({ username: USERNAME }).expect(400);
    });

    test("returns 400 when the username is missing", async () => {
        await login({ password: PASSWORD }).expect(400);
    });

    test("returns 400 when a field is empty", async () => {
        await login({ username: USERNAME, password: "" }).expect(400);
    });

    test("returns 400 when a field is the wrong type", async () => {
        await login({ username: USERNAME, password: 12345 }).expect(400);
    });

    test("returns 400 for an unrecognised property", async () => {
        await login({ username: USERNAME, password: PASSWORD, admin: true }).expect(400);
    });

    test("returns 400 when Content-Type is not JSON", async () => {
        await api
            .post("/api/auth/login")
            .set("Content-Type", "text/plain")
            .send(`{"username":"${USERNAME}","password":"${PASSWORD}"}`)
            .expect(400);
    });
});
