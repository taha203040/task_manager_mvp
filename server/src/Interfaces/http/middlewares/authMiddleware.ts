import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../../../Config/jwt";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token: unknown = req.cookies?.token;

    if (typeof token !== "string" || token.length === 0) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        req.user = verifyAccessToken(token);
    } catch {
        // Never echo or log the underlying jwt error: "expired" vs "bad signature"
        // is a useful oracle, and either message can carry token material.
        return res.status(401).json({ error: "Unauthorized" });
    }

    return next();
};
