/**
 * The test suite's composition root.
 *
 * server.ts builds the App from Mongo + bcrypt-at-cost-12; this builds the same
 * App from in-memory fakes + bcrypt-at-cost-4. `App` cannot tell the
 * difference, because it only ever sees ports -- which is exactly what makes an
 * HTTP test over the real controller/service stack possible with no database.
 *
 * Every test goes through `buildTestApp`, so the day `App` gains another
 * dependency there is one call site to update instead of one per test file.
 */

import request from "supertest";
import { App } from "../../app/index.js";
import { BcryptPasswordHasher } from "../../app/auth/passwordHasher.js";
import { JSONWebToken } from "../../app/auth/tokenService.js";
import { User } from "../../app/users/domain.js";
import { FakeCommentRepository, FakeUserRepository } from "./fakeRepository.js";

/** Cost 4 hashes in ~7ms; production's 12 takes ~220ms. Same algorithm. */
const TEST_BCRYPT_COST = 4;
const TEST_JWT_SECRET = "test-only-secret";
const TEST_JWT_TTL = "1h";

const testPasswordHasher = new BcryptPasswordHasher(TEST_BCRYPT_COST);
const testTokenService = new JSONWebToken(TEST_JWT_SECRET, TEST_JWT_TTL);

/** Build a User whose passwordHash is a real bcrypt hash of `password`. */
async function makeUser(username: string, password: string, id = "000000000000000000000001"): Promise<User> {
    return new User({
        id,
        username,
        passwordHash: await testPasswordHasher.hash(password),
        userImage: { png: `./images/avatars/image-${username}.png`, webp: `./images/avatars/image-${username}.webp` },
    });
}

function buildTestApp(users: User[] = []) {
    const app = new App({
        commentsRepository: new FakeCommentRepository(),
        usersRepository: new FakeUserRepository(users),
        passwordHasher: testPasswordHasher,
        tokenService: testTokenService,
    });

    return request(app.express);
}

export { buildTestApp, makeUser, testTokenService, testPasswordHasher, TEST_BCRYPT_COST };
