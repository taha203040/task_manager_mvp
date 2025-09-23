import { TeamRepo } from "../../../Application/Repositories/TeamRepo";
import { Pool } from "pg";
import { Team } from "../../../Domain/Entities/Team";

export class TeamRepoPostGress implements TeamRepo {
    constructor(private pool: Pool) {
    }

    async create(team: Team): Promise<void> {
        await this.pool.query(
            "INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3)",
            [team.name, team.description, team.created_by]
        );
    }

    async getTeamsByUser(userId: string): Promise<Team[]> {
        const result = await this.pool.query(
            "SELECT * FROM teams WHERE created_by = $1",
            [userId]
        );
        return result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            created_by: row.created_by,
        }));
    }

    async getById(id: string, userId: string): Promise<Team | null> {
        const result = await this.pool.query(
            "SELECT * FROM teams WHERE id = $1 AND created_by = $2",
            [id, userId]
        );
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            created_by: row.created_by,

        };
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.pool.query(
            "DELETE FROM teams WHERE id = $1 AND created_by = $2",
            [id, userId]
        );
    }

    async update(team: Team, userId: string): Promise<void> {
        await this.pool.query(
            "UPDATE teams SET name = $1, description = $2, created_at = $3 WHERE id = $4 AND created_by = $5",
            [team.name, team.description, team.created_at, team.id, userId]
        );
    }
}
