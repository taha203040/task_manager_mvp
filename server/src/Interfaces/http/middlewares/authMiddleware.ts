import jwt from "jsonwebtoken";




import { Request, Response, NextFunction } from "express";


export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]; // Get token from Authorization header
    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, 'hellofromahemd'); // Verify the token
        if (typeof decoded !== 'object' || !decoded) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // If the token is valid, attach user information to the request object
        // You can customize this part based on your token structure
        // For example, if your token contains user ID and email:
        // @ts-ignore
        req.user = decoded; // Attach user info to request object
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error(err);
        return res.status(403).json({ error: "Forbidden" });
    }
}