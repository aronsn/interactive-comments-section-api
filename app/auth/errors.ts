/**
 * Domain errors for the auth feature.
 *
 * These are the vocabulary `AuthService` throws; `AuthController` is the only
 * place that turns them into HTTP status codes.
 *
 * `InvalidCredentialsError` is deliberately vague. It is thrown for BOTH an
 * unknown username and a wrong password, so a caller cannot use the response
 * to discover which usernames exist.
 */

class InvalidCredentialsError extends Error {
    constructor() {
        super(`Wrong username or password.`);
        this.name = "InvalidCredentialsError";
    }
}

class InvalidTokenError extends Error {
    constructor() {
        super(`Token is invalid or expired.`);
        this.name = "InvalidTokenError";
    }
}

export { InvalidCredentialsError, InvalidTokenError };
