import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & {
        user_id: string;
        email: string;
        username: string;
        role?: string;
      }
    }
  }
}
