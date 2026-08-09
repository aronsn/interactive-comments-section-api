/**
 * Domain errors for the users feature.
 *
 * NOTE: `NotFoundError` names the email it failed to find, which makes it
 * useful in logs and dangerous in a response body -- telling a caller "no such
 * account" hands them a way to discover which emails are registered.
 * `AuthService.login` converts it to `InvalidCredentialsError` on purpose, so
 * it never reaches a client from the login route.
 *
 * `EmailTakenError` and `UsernameTakenError` leak that same information by
 * necessity: a signup form has to say "that one is already in use". The only
 * real fix is confirmation-email signup, where the response stays vague and
 * the truth goes to the inbox instead.
 */

class NotFoundError extends Error {
    constructor(email: string) {
        super(`No user found with email "${email}".`);
        this.name = "NotFoundError";
    }
}

class UsernameTakenError extends Error {
    constructor(username: string) {
        super(`The username "${username}" is already taken.`);
        this.name = "UsernameTakenError";
    }
}

class EmailTakenError extends Error {
    constructor(email: string) {
        super(`The email "${email}" is already registered.`);
        this.name = "EmailTakenError";
    }
}

class InvalidUsernameError extends Error {
    constructor(reason: string) {
        super(`Invalid username: ${reason}`);
        this.name = "InvalidUsernameError";
    }
}

class InvalidEmailError extends Error {
    constructor(reason: string) {
        super(`Invalid email: ${reason}`);
        this.name = "InvalidEmailError";
    }
}

class WeakPasswordError extends Error {
    constructor(reason: string) {
        super(`Invalid password: ${reason}`);
        this.name = "WeakPasswordError";
    }
}

export {
    NotFoundError,
    UsernameTakenError,
    EmailTakenError,
    InvalidUsernameError,
    InvalidEmailError,
    WeakPasswordError,
};
