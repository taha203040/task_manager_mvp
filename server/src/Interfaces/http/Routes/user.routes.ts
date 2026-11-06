import { Router } from "express";
//@ts-ignore
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/authMiddleware";

const userRouter = Router();

userRouter.post("/register", UserController.register);

userRouter.post("/signin", UserController.login);

// Current user's public profile
userRouter.get('/info', authenticate, UserController.getProfile);

// Update only the authenticated user's own profile
userRouter.put('/profile', authenticate, UserController.updateProfile);

export default userRouter;
