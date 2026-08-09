/**
 * Presentation layer for the users feature.
 *
 * `UserController` is HTTP-ONLY: validate the request, hand plain data to a
 * UserService use case, map the result -- or a thrown domain error -- back to
 * a status code.
 *
 * The response NEVER includes `passwordHash`. That is why `#toResponse` lists
 * fields explicitly instead of sending the entity: a presenter that names its
 * output cannot leak a field someone adds to the domain later.
 */

import type { Request, Response } from "express";
import type { UserService } from "./application.js";
import type { User } from "./domain.js";
import {
    EmailTakenError,
    InvalidEmailError,
    InvalidUsernameError,
    UsernameTakenError,
    WeakPasswordError,
} from "./errors.js";

type UserResponse = {
    _id: string | null;
    username: string;
    email: string;
    userImage: User["userImage"];
};

const REGISTER_PROPERTIES = ["username", "email", "password"];

class UserController {
    private readonly service: UserService;

    constructor(service: UserService) {
        this.service = service;
    }

    register = async (request: Request, response: Response): Promise<Response> => {
        try {
            if (!this.#isJson(request)) {
                return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
            }

            const { username, email, password } = request.body as Record<string, unknown>;

            if (username === "" || username === undefined
                || email === "" || email === undefined
                || password === "" || password === undefined) {
                return response.status(400).send("Request is malformed or invalid. The body is missing properties");
            }
            if (typeof username !== "string" || typeof email !== "string" || typeof password !== "string") {
                return response.status(400).send("Request is malformed or invalid. Check if the data types of the properties provided are correct");
            }
            for (const property in request.body) {
                if (!REGISTER_PROPERTIES.includes(property)) {
                    return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
                }
            }

            const user = await this.service.register({ username, email, password });
            return response.status(201).send(this.#toResponse(user));
        } catch (error) {
            return this.#sendError(response, error, "Error: Unable to register.");
        }
    };

    /* ---- presenter: domain object -> the JSON shape the frontend expects ---- */
    /* The frontend keys off `_id`, so we translate the domain's `id` back here. */

    #toResponse(user: User): UserResponse {
        return {
            _id: user.id,
            username: user.username,
            email: user.email,
            userImage: user.userImage,
        };
    }

    /* ---- request helpers ---- */

    /** Map a thrown error to an HTTP response. This is the ONLY place domain
     *  errors become status codes -- the use cases never mention HTTP. */
    #sendError(response: Response, error: unknown, fallback: string): Response {
        console.error(`\n${error}`);
        // 409, not 400: the request was well-formed, it just lost a race for a
        // name or an address that someone else already holds.
        if (error instanceof UsernameTakenError) return response.status(409).send(error.message);
        if (error instanceof EmailTakenError) return response.status(409).send(error.message);
        if (error instanceof InvalidUsernameError) return response.status(400).send(error.message);
        if (error instanceof InvalidEmailError) return response.status(400).send(error.message);
        if (error instanceof WeakPasswordError) return response.status(400).send(error.message);
        return response.status(500).send(fallback);
    }

    #isJson(request: Request): boolean {
        const contentType = request.headers["content-type"];
        return typeof contentType === "string" && contentType.includes("application/json");
    }
}

export { UserController };
export type { UserResponse };
