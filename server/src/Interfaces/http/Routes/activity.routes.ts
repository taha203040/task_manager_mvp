import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { ActivityController } from "../controllers/Activity.controller";

const activityRouter = Router();

activityRouter.get("/", authenticate, ActivityController.list);
activityRouter.patch("/read", authenticate, ActivityController.markRead);

export default activityRouter;
