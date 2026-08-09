/**
 * Repository (Data Mapper) for the User Entity.
 *
 * This is the ONLY layer that knows MongoDB exists for users. It translates
 * between the stored document shape and the pure domain `User`:
 *
 *     document  --#toDomain-->  User
 *
 * It also translates Mongo's FAILURES into domain errors: a duplicate-key
 * violation becomes `EmailTakenError` or `UsernameTakenError` depending on
 * which index rejected it, so nothing above this layer has to know what error
 * code 11000 means.
 *
 * The repository depends on the domain; the domain knows nothing about the
 * repository (dependencies point inward).
 */

import { type Collection, type Db, MongoServerError, ObjectId } from "mongodb";
import { User, type UserImage } from "./domain.js";
import type { UserRepositoryPort } from "./application.js";
import { EmailTakenError, NotFoundError, UsernameTakenError } from "./errors.js";

/** Mongo's error code for a unique-index violation. */
const DUPLICATE_KEY = 11000;

type UserDocument = {
    _id: ObjectId;
    username: string;
    email: string;
    passwordHash: string;
    userImage: UserImage;
};

class UserRepository implements UserRepositoryPort {
    private readonly collection: Collection<UserDocument>;

    constructor(db: Db) {
        this.collection = db.collection<UserDocument>("users");
    }

    /**
     * Declare the constraints the domain relies on. Called once from the
     * composition root, after connecting.
     *
     * `findByEmail` treats an email as an identifier, so the database has to
     * enforce that -- otherwise two accounts could share one address and which
     * one logs in would come down to document order. Usernames are unique too:
     * they identify an author to other people, and the avatar path is derived
     * from them. This is also what makes the check-free `add` below safe
     * against a registration race.
     */
    async ensureIndexes(): Promise<void> {
        await this.collection.createIndex({ email: 1 }, { unique: true });
        await this.collection.createIndex({ username: 1 }, { unique: true });
    }

    /** Callers pass an already-normalized address (see `normalizeEmail`), so a
     *  plain equality match is enough -- no case-insensitive collation needed. */
    async findByEmail(email: string): Promise<User> {
        const doc = await this.collection.findOne({ email });
        if (!doc) throw new NotFoundError(email);
        return this.#toDomain(doc);
    }

    /**
     * Insert a new user, letting the unique indexes decide whether the email
     * and username are free. No "does it exist?" query first: that answer is
     * stale the moment it returns, and two simultaneous registrations would
     * both pass it.
     */
    async add(user: User): Promise<User> {
        const doc: UserDocument = {
            _id: new ObjectId(),
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            userImage: user.userImage,
        };

        try {
            await this.collection.insertOne(doc);
        } catch (error) {
            if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
                // `keyPattern` names the index that rejected the write, which is
                // the only way to tell the caller WHICH field collided.
                if (error.keyPattern?.email) throw new EmailTakenError(user.email);
                throw new UsernameTakenError(user.username);
            }
            throw error;
        }

        return this.#toDomain(doc);
    }

    /** document -> domain. Mongo's ObjectId becomes a plain string id so the
     *  domain stays storage-agnostic. */
    #toDomain(doc: UserDocument): User {
        return new User({
            id: doc._id.toString(),
            username: doc.username,
            email: doc.email,
            passwordHash: doc.passwordHash,
            userImage: doc.userImage,
        });
    }
}

export { UserRepository };
export type { UserDocument };
