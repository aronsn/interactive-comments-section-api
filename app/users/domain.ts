/**
 * Domain layer for the users feature.
 *
 * A `User` is the account Entity used for authentication: it has identity
 * (id), a username, a hashed password, and an avatar. This is a DIFFERENT
 * concept from the author snapshot embedded inside a Comment -- that value
 * object lives in the comments module. Splitting them into separate bounded
 * contexts is the whole point of this module.
 *
 * This file is PURE. It imports nothing from Express, MongoDB, or the
 * repository. Dependencies point INWARD: the repository depends on this file,
 * never the other way around.
 */

type UserId = string | null;

type UserImage = {
    png: string;
    webp: string;
};

type UserInput = {
    id: UserId;
    username: string;
    passwordHash: string;
    userImage: UserImage;
};

class User {
    id: UserId;
    username: string;
    passwordHash: string;
    userImage: UserImage;

    constructor({ id, username, passwordHash, userImage }: UserInput) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.userImage = userImage;
    }
}

export { User };
export type { UserId, UserImage, UserInput };
