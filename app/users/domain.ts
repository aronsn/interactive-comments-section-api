/**
 * Domain layer for the users feature.
 *
 * A `User` is the account Entity used for authentication: it has identity
 * (id), an email (what you log in WITH), a username (what other people SEE),
 * a hashed password, and an avatar. This is a DIFFERENT concept from the
 * author snapshot embedded inside a Comment -- that value object lives in the
 * comments module. Splitting them into separate bounded contexts is the whole
 * point of this module.
 *
 * This file is PURE. It imports nothing from Express, MongoDB, or the
 * repository. Dependencies point INWARD: the repository depends on this file,
 * never the other way around.
 */

import { InvalidEmailError, InvalidUsernameError } from "./errors.js";

type UserId = string | null;

type UserImage = {
    png: string;
    webp: string;
};

type UserInput = {
    id: UserId;
    username: string;
    email: string;
    passwordHash: string;
    userImage: UserImage;
};

type CreateUserInput = {
    username: string;
    email: string;
    passwordHash: string;
};

const USERNAME_PATTERN = /^[a-z0-9_]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

/**
 * Deliberately loose. A stricter regex rejects addresses that are perfectly
 * valid (RFC 5322 allows far more than people expect), and no regex can tell
 * you whether an inbox exists. The only real validation is sending mail to it.
 * This catches typos and nothing more.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

/** Avatar paths are derived from the username, matching `createUser` in the
 *  comments domain, so an author looks the same wherever they are rendered. */
function avatarFor(username: string): UserImage {
    return {
        png: `/avatars/image-${username}.png`,
        webp: `/avatars/image-${username}.webp`,
    };
}

/**
 * Emails are compared case-insensitively, so store and look them up in ONE
 * canonical form. Without this, "Bob@example.com" would register a second
 * account alongside "bob@example.com", and logging in would depend on how the
 * user happened to type it that day.
 *
 * Both `User.create` and `AuthService.login` run this, so the value written
 * and the value searched for always match.
 */
function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

/**
 * NOTE: the username and email rules live here, but the PASSWORD rules do not
 * -- they are in `application.ts`. The line is what the entity actually holds:
 * a `User` has a username and an email, so their formats are invariants of
 * this class and no `User` can exist that breaks them. A `User` never sees a
 * plaintext password (only a hash), so a password policy would have nothing
 * here to be an invariant of. It is a precondition of the use case instead.
 */
class User {
    id: UserId;
    username: string;
    email: string;
    passwordHash: string;
    userImage: UserImage;

    constructor({ id, username, email, passwordHash, userImage }: UserInput) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.userImage = userImage;
    }

    /**
     * Build a brand-new account. `id` is null until the repository stores it.
     *
     * The rules are enforced HERE rather than in the controller, so there is no
     * way to create a User that breaks them -- whatever the entry point. The
     * controller still rejects malformed *requests*; this rejects invalid
     * *users*.
     */
    static create({ username, email, passwordHash }: CreateUserInput): User {
        if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
            throw new InvalidUsernameError(`must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`);
        }
        if (!USERNAME_PATTERN.test(username)) {
            throw new InvalidUsernameError("may only contain lowercase letters, numbers and underscores.");
        }

        const normalizedEmail = normalizeEmail(email);

        if (normalizedEmail.length > EMAIL_MAX_LENGTH) {
            throw new InvalidEmailError(`must be at most ${EMAIL_MAX_LENGTH} characters.`);
        }
        if (!EMAIL_PATTERN.test(normalizedEmail)) {
            throw new InvalidEmailError("must look like name@example.com.");
        }

        return new User({
            id: null,
            username,
            email: normalizedEmail,
            passwordHash,
            userImage: avatarFor(username),
        });
    }
}

export { User, avatarFor, normalizeEmail };
export type { UserId, UserImage, UserInput, CreateUserInput };
