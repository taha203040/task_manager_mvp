import { TeamRepo } from "../../../Application/Repositories/TeamRepo";
import { Pool, PoolClient } from "pg";
import { Team } from "../../../Domain/Entities/Team";

function mapTeam(row: any): Team {
    return new Team(
        row.name,
        row.created_by,
        row.description ?? null,
        row.id,
        row.created_at ?? null,
    );
}

export class TeamRepoPostGress implements TeamRepo {
    constructor(private pool: Pool) {
    }

    /**
     * Team + creator OWNER membership in one transaction.
     * If the membership insert fails, the team insert is rolled back too.
     */
    async create(team: Team): Promise<Team> {
        if (!team.created_by) {
            throw new Error("Team creator is required");
        }

        const client: PoolClient = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const inserted = await client.query(
                "INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *",
                [team.name, team.description ?? null, team.created_by],
            );
            const row = inserted.rows[0];

            // PRIMARY KEY (team_id, user_id) prevents duplicate owner memberships.
            await client.query(
                `INSERT INTO team_members (team_id, user_id, role)
                 VALUES ($1, $2, 'owner')
                 ON CONFLICT (team_id, user_id) DO UPDATE SET role = 'owner'`,
                [row.id, team.created_by],
            );

            await client.query("COMMIT");
            return mapTeam(row);
        } catch (error) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw error;
        } finally {
            client.release();
        }
    }

    /** Teams the user created plus teams the user actually belongs to; EXISTS avoids duplicates. */
    async getTeamsByUser(userId: string): Promise<Team[]> {
        const result = await this.pool.query(
            `SELECT t.*
             FROM teams t
             WHERE t.created_by = $1
                OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $1)
             ORDER BY t.created_at DESC, t.name ASC`,
            [userId],
        );
        return result.rows.map(mapTeam);
    }

    async getById(id: string, userId: string): Promise<Team | null> {
        const result = await this.pool.query(
            `SELECT t.*
             FROM teams t
             WHERE t.id = $1
               AND (
                   t.created_by = $2
                   OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $2)
               )`,
            [id, userId],
        );
        if (result.rows.length === 0) return null;
        return mapTeam(result.rows[0]);
    }

    async getCreatedBy(id: string): Promise<string | null> {
        const result = await this.pool.query("SELECT created_by FROM teams WHERE id = $1", [id]);
        if (result.rows.length === 0) return null;
        return result.rows[0].created_by ?? null;
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.pool.query(
            "DELETE FROM teams WHERE id = $1 AND created_by = $2",
            [id, userId]
        );
    }

    async update(team: Team, userId: string): Promise<void> {
        // created_at is immutable; it is no longer written here.
        await this.pool.query(
            "UPDATE teams SET name = $1, description = $2 WHERE id = $3 AND created_by = $4",
            [team.name, team.description ?? null, team.id, userId]
        );
    }
}
