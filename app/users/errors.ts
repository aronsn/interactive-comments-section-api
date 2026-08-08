/**
 * Domain errors for the users feature.
 *
 * NOTE: `NotFoundError` names the username it failed to find, which makes it
 * useful in logs and dangerous in a response body -- telling a caller "no such
 * username" hands them a way to enumerate valid accounts. `AuthService.login`
 * converts it to `InvalidCredentialsError` on purpose, so it never reaches a
 * client from the login route.
 */

class NotFoundError extends Error {
    constructor(username: string) {
        super(`No user found with username "${username}".`);
        this.name = "NotFoundError";
    }
}

export { NotFoundError };
