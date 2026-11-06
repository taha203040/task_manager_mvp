/**
 * Application-level error carrying the HTTP status the Interfaces layer should return.
 * Use cases throw these; controllers translate them into HTTP responses.
 */
export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        message: string,
        public readonly code: string = "APP_ERROR",
    ) {
        super(message);
        this.name = "AppError";
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, message, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = "Unauthorized") {
        super(401, message, "UNAUTHORIZED");
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = "Forbidden") {
        super(403, message, "FORBIDDEN");
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = "Resource not found") {
        super(404, message, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class ConflictError extends AppError {
    constructor(message: string = "Conflict") {
        super(409, message, "CONFLICT");
        this.name = "ConflictError";
    }
}
