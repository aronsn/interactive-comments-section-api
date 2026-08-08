/**
 * Presentation layer for the auth feature.
 *
 * `AuthController` is HTTP-ONLY. Each handler: (1) validates that the *request*
 * is well-formed, (2) hands plain data to an AuthService use case, (3) maps the
 * result -- or a thrown domain error -- back to an HTTP status.
 *
 * Note the division of validation labour. The controller answers questions it
 * can settle from the request alone ("is this JSON?", "is password a string?")
 * -> 400. Whether the credentials are actually correct needs the repository and
 * the hasher, so it is the service's question -> 401. Rule of thumb: if
 * answering it requires a dependency, it is not the controller's question.
 *
 * The handlers are arrow-function class fields on purpose: that binds `this`
 * to the instance, so they keep working when passed to Express as
 * `controller.login` (a plain method would lose its `this`).
 */

import type { Request, Response } from "express";
import type { AuthService } from "./application.js";
import { InvalidCredentialsError } from "./errors.js";

const LOGIN_PROPERTIES = ["username", "password"];

class AuthController {
    private readonly service: AuthService;

    constructor(service: AuthService) {
        this.service = service;
    }

    login = async (request: Request, response: Response): Promise<Response> => {
        try {
            if (!this.#isJson(request)) {
                return response.status(400).send("Content-Type is not correctly set and must be of 'application/json'");
            }

            const { username, password } = request.body as Record<string, unknown>;

            if (username === "" || username === undefined || password === "" || password === undefined) {
                return response.status(400).send("Request is malformed or invalid. The body is missing properties");
            }
            if (typeof username !== "string" || typeof password !== "string") {
                return response.status(400).send("Request is malformed or invalid. Check if the data types of the properties provided are correct");
            }
            for (const property in request.body) {
                if (!LOGIN_PROPERTIES.includes(property)) {
                    return response.status(400).send(`Request is malformed or invalid. "${property}" property is not recognized. `);
                }
            }

            const token = await this.service.login({ username, password });
            return response.status(200).send({ token });
        } catch (error) {
            return this.#sendError(response, error, "Error: Unable to login.");
        }
    };

    /* ---- request helpers ---- */

    /**
     * Map a thrown error to an HTTP response. This is the ONLY place domain
     * errors become status codes -- the use cases never mention HTTP.
     *
     * Unlike the comments controller, the 500 branch does NOT echo the error
     * message back to the client: on an auth route an internal message can
     * disclose which username was looked up. It is logged instead.
     */
    #sendError(response: Response, error: unknown, fallback: string): Response {
        console.error(`\n${error}`);
        if (error instanceof InvalidCredentialsError) return response.status(401).send(error.message);
        return response.status(500).send(fallback);
    }

    #isJson(request: Request): boolean {
        const contentType = request.headers["content-type"];
        return typeof contentType === "string" && contentType.includes("application/json");
    }
}

export { AuthController };
