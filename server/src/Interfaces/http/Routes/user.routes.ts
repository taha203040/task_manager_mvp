import { Router } from "express";
//@ts-ignore
import { UserController } from "../controllers/user.contoller";

const userRouter = Router();

userRouter.post("/register", UserController.register);

userRouter.post("/signin", UserController.login);



export default userRouter;
