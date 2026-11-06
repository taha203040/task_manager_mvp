import { Request, Response } from "express";
import { LoginUser } from "../../../Application/use-cases/User-usecases/LoginUser";
import { RegistserUser } from "../../../Application/use-cases/User-usecases/RegisterUser";
import { UpdateUserProfile } from "../../../Application/use-cases/User-usecases/UpdateProfile";
import { UserRepoPostgress } from "../../../Infrastructure/Repositories/Sql/PostgresLogicUser";
import pool from "../../../Config/db";
import jwt from "jsonwebtoken";
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";
import { NotFoundError } from "../../../Domain/Errors/AppError";
const userrepo = new UserRepoPostgress(pool);

export class UserController {
    static async register(req: Request, res: Response) {
        try {
            const { username, password, email, role } = req.body;
            if (!username || !password || !email) {
                return res.status(400).json({ error: "All fields are required" });
            }
            const userRegister = new RegistserUser(userrepo);
            await userRegister.execute(email, password, username, role);
            res.status(201).json({ message: "User registered successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { password, email } = req.body;
            if (!password || !email) {
                return res.status(400).json({ error: "All fields are required" });
            }

            const loginUser = new LoginUser(userrepo);
            const user = await loginUser.execute(email, password);

            if (!user) {
                return res.status(401).json({ error: "Invalid credentials" });
            }
            const token = jwt.sign({ email: email, username: user.username, user_id: user.id }, 'hellofromahemd', { expiresIn: '1h' });
            res.cookie("token", token, {
                httpOnly: true, // ❌ لا يمكن الوصول إليها من JavaScript
                secure: false,   // ✅ تُرسل فقط عبر HTTPS (فعّلها في الإنتاج)
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 1000, // ساعة واحدة 
            });
            res.status(200).json({
                message: "Login successful",
                user: { user_id: user.id, email: user.email }
                , token
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }

    /** Current authenticated user's public profile (adds bio/avatar to the existing /users/info contract). */
    static async getProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }
            const user = await userrepo.findById(userId);
            if (!user) {
                throw new NotFoundError("User not found");
            }
            res.status(200).json({
                user_id: user.id,
                username: user.username,
                email: user.email,
                bio: user.bio ?? null,
                avatar: user.avatar ?? null,
            });
        } catch (error) {
            sendError(res, error);
        }
    }

    /**
     * Updates only the authenticated user's own profile.
     * The target is always taken from the session; a body "user_id" is ignored.
     */
    static async updateProfile(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const body = req.body ?? {};
            const updateProfile = new UpdateUserProfile(userrepo);
            const user = await updateProfile.execute(userId, {
                username: body.username,
                bio: body.bio,
                avatar: body.avatar,
            });

            res.status(200).json({ message: "Profile updated successfully", user });
        } catch (error) {
            sendError(res, error);
        }
    }
}
