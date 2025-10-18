import { Router } from "express";
//@ts-ignore
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middlewares/authMiddleware";

const userRouter = Router();

userRouter.post("/register", UserController.register);

userRouter.post("/signin", UserController.login);

userRouter.get('/info', authenticate, (req, res) => {
        //@ts-ignore
    // console.log(req.user?.user_id)
    //@ts-ignore
    res.status(200).send({ email: req.user?.email, username: req.user.username, user_id: req.user?.user_id })
}
)

export default userRouter;
