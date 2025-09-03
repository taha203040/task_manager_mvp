import { Router } from "express";
import { UserController } from "../Controllers/userContollers";

const userRouter = Router();

userRouter.post("/register", UserController.register);
userRouter.post("/signin", UserController.login);

export default userRouter;
