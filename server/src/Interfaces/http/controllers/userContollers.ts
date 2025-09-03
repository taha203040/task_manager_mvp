import { Request, Response } from "express";
import { LoginUser } from "../../../Application/use-cases/User-usecases/LoginUser";
import { RegistserUser } from "../../../Application/use-cases/User-usecases/RegisterUser";
import { UserRepoPostgress } from "../../../Infrastructure/database/Sql/PostgresLogic";
import pool from "../../../Config/db";
import jwt from "jsonwebtoken";
const userrepo = new UserRepoPostgress(pool);

export class UserController {
    static async register(req: Request, res: Response) {
        try {
            const { username, password, email } = req.body;
            if (!username || !password || !email) {
                return res.status(400).json({ error: "All fields are required" });
            }

            const userRegister = new RegistserUser(userrepo);
            await userRegister.execute(email, password, username);

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
            const token = jwt.sign({ email: email }, 'hellofromahemd', { expiresIn: '1h' });
            res.status(200).json({
                message: "Login successful",
                user: { id: user.id, email: user.email }
                , token
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error" });
        }
    }
}
