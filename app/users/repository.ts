/**
 * Repository (Data Mapper) for the User Entity.
 *
 * This is the ONLY layer that knows MongoDB exists for users. It translates
 * between the stored document shape and the pure domain `User`:
 *
 *     document  --#toDomain-->  User
 *
 * The repository depends on the domain; the domain knows nothing about the
 * repository (dependencies point inward).
 */

import { type Collection, type Db, ObjectId } from "mongodb";
import { User, type UserImage } from "./domain.js";
import type { UserRepositoryPort } from "./application.js";
import { NotFoundError } from "./errors.js";

type UserDocument = {
    _id: ObjectId;
    username: string;
    passwordHash: string;
    userImage: UserImage;
};

class UserRepository implements UserRepositoryPort {
    private readonly collection: Collection<UserDocument>;

    constructor(db: Db) {
        this.collection = db.collection<UserDocument>("users");
    }

    async findByUsername(username: string): Promise<User> {
        const doc = await this.collection.findOne({ username });
        if (!doc) throw new NotFoundError(username);
        return this.#toDomain(doc);
    }

    /** document -> domain. Mongo's ObjectId becomes a plain string id so the
     *  domain stays storage-agnostic. */
    #toDomain(doc: UserDocument): User {
        return new User({
            id: doc._id.toString(),
            username: doc.username,
            passwordHash: doc.passwordHash,
            userImage: doc.userImage,
        });
    }
}

export { UserRepository };
export type { UserDocument };
