import { Request, Response } from "express";
import { Team } from "../../../Domain/Entities/Team";
import { GetTeamById, GetTeamsByUser, UpdateTeam, DeleteTeam, CreateTeam } from "../../../Application/use-cases/Team-usecases/Team.usecase";
import pool from "../../../Config/db";
import { TeamRepoPostGress } from "../../../Infrastructure/Repositories/Sql/Team_SQl";

const teamRepo = new TeamRepoPostGress(pool);

export class TeamController {
    static async createTeam(req: Request, res: Response) {
        try {
            const { name, description, created_by } = req.body;
            if (!name || !created_by) {
                return res.status(400).json({ error: "Name and userId are required" });
            }
            const team: Team = new Team(
                name,
                description || null,
                created_by,
            );
            const teamUseCase = new CreateTeam(teamRepo);
            await teamUseCase.execute(team);
            res.status(201).json({ message: "Team created successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error1" });
        }
    }

    static async getTeamsByUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            if (!userId) {
                return res.status(400).json({ error: "UserId is required" });
            }
            const teamUseCase = new GetTeamsByUser(teamRepo);
            const teams = await teamUseCase.execute(userId);
            res.status(200).json(teams);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async getTeamById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            // @ts-ignore
            const { user_id } = req.user
            if (!id || !user_id) {
                return res.status(400).json({ error: "Team id and userId are required" });
            }
            const teamUseCase = new GetTeamById(teamRepo);
            const team = await teamUseCase.execute(id, user_id);
            if (!team) {
                return res.status(404).json({ error: "Team not found" });
            }
            res.status(200).json(team);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async deleteTeam(req: Request, res: Response) {
        try {
            const { id, userId } = req.params;
            if (!id || !userId) {
                return res.status(400).json({ error: "Team id and userId are required" });
            }
            const teamUseCase = new DeleteTeam(teamRepo);
            await teamUseCase.execute(id, userId);
            res.status(200).json({ message: "Team deleted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async updateTeam(req: Request, res: Response) {
        try {
            const { id, userId } = req.params;
            const { name, description } = req.body;
            if (!id || !userId) {
                return res.status(400).json({ error: "Team id and userId are required" });
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
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
}

