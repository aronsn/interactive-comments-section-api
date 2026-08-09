class NotOwnerError extends Error {
    constructor(owner: string) {
        super(`This user is not the owner. "${owner}" is the owner of this document.`);
        this.name = "NotOwnerError";
    }
}

class NotFoundError extends Error {
    constructor(id: string) {
        super(`The provided id "${id}" did not return a match. It is either removed or does not exist.`);
        this.name = "NotFoundError";
    }
}

export { NotFoundError, NotOwnerError };
