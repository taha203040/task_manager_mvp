import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token; // get token from cookie 
        if (!token) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const decoded = jwt.verify(token, 'hellofromahemd') as JwtPayload
        // Verify the token
        if (typeof decoded !== 'object' || !decoded) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        // @ts-ignore
        req.user = decoded as any
        //@ts-ignore
        console.log(req.user)
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error(err);
        return res.status(403).json({ error: "Forbidden" });
    }
}