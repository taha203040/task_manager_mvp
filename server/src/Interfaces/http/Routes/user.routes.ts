import { Router } from "express";
//@ts-ignore
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/authMiddleware";

const userRouter = Router();

userRouter.post("/register", UserController.register);

userRouter.post("/signin", UserController.login);

userRouter.get('/info', authenticate, (req, res) => {
    //@ts-ignore
    res.status(200).send({ email: req.user?.email, username: req.user.username })
}
)

export default userRouter;
