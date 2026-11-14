import { routeParam } from "../utils/params";
import { Request, Response } from "express";
import pool from "../../../Config/db";
import { ProjectRepoPostgress } from "../../../Infrastructure/Repositories/Sql/ProjectPostgress";
import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import {
    CreateProject,
    DeleteProject,
    GetProjectById,
    GetProjectMembers,
    ListProjects,
    UpdateProject,
} from "../../../Application/use-cases/Project-usecases/Project.usecase";
import { ValidationError } from "../../../Domain/Errors/AppError";
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";

const projectRepo = new ProjectRepoPostgress(pool);
const memberRepo = new SqlMemberRepository(pool);

function readTeamIdFilter(value: unknown): string | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") {
        throw new ValidationError("team_id filter must be a single string");
    }
    return value;
}

export class ProjectController {
    static async list(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const teamId = readTeamIdFilter(req.query["team_id"]);
            const listProjects = new ListProjects(projectRepo, memberRepo);
            const projects = await listProjects.execute(userId, teamId);

            res.status(200).json({ projects });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const getProject = new GetProjectById(projectRepo);
            const project = await getProject.execute(id as string, userId);

            res.status(200).json({ project });
        } catch (error) {
            sendError(res, error);
        }
    }

    /** Assignment candidates for a project (same rows as project.members on GET /projects/:id). */
    static async getMembers(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const getMembers = new GetProjectMembers(projectRepo);
            const members = await getMembers.execute(id as string, userId);

            res.status(200).json({ members });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const body = req.body ?? {};
            const createProject = new CreateProject(projectRepo, memberRepo);
            const project = await createProject.execute(
                {
                    name: body.name,
                    description: body.description,
                    team_id: body.team_id,
                    status: body.status,
                    start_date: body.start_date,
                    due_date: body.due_date,
                    member_ids: body.member_ids,
                },
                userId,
            );

            res.status(201).json({ message: "Project created successfully", project });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const body = req.body ?? {};
            const updateProject = new UpdateProject(projectRepo, memberRepo);
            const project = await updateProject.execute(
                id as string,
                {
                    name: body.name,
                    description: body.description,
                    status: body.status,
                    start_date: body.start_date,
                    due_date: body.due_date,
                    member_ids: body.member_ids,
                    team_id: body.team_id,
                },
                userId,
            );

            res.status(200).json({ message: "Project updated successfully", project });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const deleteProject = new DeleteProject(projectRepo, memberRepo);
            await deleteProject.execute(id as string, userId);

            res.status(200).json({ message: "Project deleted successfully" });
        } catch (error) {
            sendError(res, error);
        }
    }
}
