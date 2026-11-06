import { Response } from "express";
import { AppError } from "../../../Domain/Errors/AppError";

/**
 * Translates application/domain errors (and common PostgreSQL error codes)
 * into the API's existing JSON error convention: { error: string }.
 */
export function sendError(res: Response, error: unknown): void {
    if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
        return;
    }

    const pgCode = (error as { code?: string } | null)?.code;
    switch (pgCode) {
        case "22P02": // invalid text representation (e.g. malformed uuid)
            res.status(400).json({ error: "Invalid identifier" });
            return;
        case "23505": // unique violation
            res.status(409).json({ error: "Resource already exists" });
            return;
        case "23503": // foreign key violation
            res.status(400).json({ error: "Referenced resource does not exist" });
            return;
        default:
            break;
    }

    console.error(error);
    res.status(500).json({ error: "Server error" });
}

export function sendUnauthorized(res: Response): void {
    res.status(401).json({ error: "Unauthorized" });
}
