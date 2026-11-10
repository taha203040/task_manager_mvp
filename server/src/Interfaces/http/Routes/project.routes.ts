import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware";
import { ProjectController } from "../controllers/Project.controller";

const projectRouter = Router();

projectRouter.get("/", authenticate, ProjectController.list);
projectRouter.post("/", authenticate, ProjectController.create);
projectRouter.get("/:id/members", authenticate, ProjectController.getMembers);
projectRouter.get("/:id", authenticate, ProjectController.getById);
projectRouter.put("/:id", authenticate, ProjectController.update);
projectRouter.delete("/:id", authenticate, ProjectController.delete);

export default projectRouter;
