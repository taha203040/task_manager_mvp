import { Request, Response } from "express";
import { Team } from "../../../Domain/Entities/Team";
import { GetTeamById, GetTeamsByUser, UpdateTeam, DeleteTeam, CreateTeam, GetInvitesByUserIdUseCase } from "../../../Application/use-cases/Team-usecases/Team.usecase";
import pool from "../../../Config/db";
import { TeamRepoPostGress } from "../../../Infrastructure/Repositories/Sql/Team_SQl";
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";

const teamRepo = new TeamRepoPostGress(pool);
export class TeamController {
    /** The creator is always the authenticated user; a client-supplied created_by is ignored. */
    static async createTeam(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const { name, description } = req.body ?? {};
            const team: Team = new Team(
                typeof name === "string" ? name : "",
                userId,
                description === undefined || description === null || description === "" ? null : String(description),
            );

            const teamUseCase = new CreateTeam(teamRepo);
            const created = await teamUseCase.execute(team);
            res.status(201).json({ message: "Team created successfully", team: created });
        } catch (err) {
            sendError(res, err);
        }
    }

    /** Teams created by the caller plus teams the caller belongs to. Never includes members. */
    static async getTeamsByUser(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }
            const teamUseCase = new GetTeamsByUser(teamRepo);
            const teams = await teamUseCase.execute(userId);
            res.status(200).json(teams);
        } catch (err) {
            sendError(res, err);
        }
    }

    static async getTeamById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }
            const teamUseCase = new GetTeamById(teamRepo);
            const team = await teamUseCase.execute(id, userId);
            if (!team) {
                return res.status(404).json({ error: "Team not found" });
            }
            res.status(200).json(team);
        } catch (err) {
            sendError(res, err);
        }
    }

    static async deleteTeam(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const user_id = req.user?.user_id;
            if (!id || !user_id) {
                return res.status(400).json({ error: "Team id and userId are required2" });
            }
            const teamUseCase = new DeleteTeam(teamRepo);
            await teamUseCase.execute(id, user_id);
            res.status(200).json({ message: "Team deleted successfully" });
        } catch (err) {
            sendError(res, err);
        }
    }

    static async updateTeam(req: Request, res: Response) {
        try {
            const { id, userId } = req.params;
            const { name, description } = req.body;
            if (!id || !userId) {
                return res.status(400).json({ error: "Team id and userId are required3" });
            }
            const teamUseCase = new UpdateTeam(teamRepo);

            const updatedTeam: Team = new Team(
                name,
                description,
                userId,
                id
            );
            await teamUseCase.execute(updatedTeam, userId);
            res.status(200).json({ message: "Team updated successfully" });
        } catch (err) {
            sendError(res, err);
        }
    }
}
