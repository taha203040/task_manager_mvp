import { ITeamInviteRepository, InviteStatus } from "../../../Application/Repositories/Team_invites";
import { TeamInvite } from "../../../Domain/Entities/Invites";
import { Pool } from "pg";

export class SqlTeamInviteRepository implements ITeamInviteRepository {
    constructor(private pool: Pool) { }

    async create(invite: TeamInvite): Promise<TeamInvite> {
        const query = `
            INSERT INTO team_invites (id, team_id, invited_user_id, role, invited_by, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        console.log('invite', invite)
        const result = await this.pool.query(query, [
            invite.id = crypto.randomUUID(),
            invite.team_id,
            invite.invited_user_id,
            invite.role,
            invite.invited_by,
            invite.status,
            invite.created_at
        ]);
        // console.log('result', result)

        return new TeamInvite(result.rows[0]);
    }

    async findById(id: string): Promise<TeamInvite | null> {
        const query = `SELECT * FROM team_invites WHERE id = $1`;
        const result = await this.pool.query(query, [id]);

        if (result.rows.length === 0) {
            return null;
        }

        return new TeamInvite(result.rows[0]);
    }

    async findByTeamId(teamId: string): Promise<TeamInvite[]> {
        const query = `SELECT * FROM team_invites WHERE team_id = $1 ORDER BY created_at DESC`;
        const result = await this.pool.query(query, [teamId]);

        return result.rows.map(row => new TeamInvite(row));
    }

    async findByUserId(email: string): Promise<TeamInvite[]> {
        const query = `SELECT * FROM team_invites WHERE invited_user_id = $1 ORDER BY created_at DESC`;
        const result = await this.pool.query(query, [email]);

        return result.rows.map(row => new TeamInvite(row));
    }

    async findPendingInvite(teamId: string, email: string): Promise<TeamInvite | null> {
        const query = `
            SELECT * FROM team_invites 
            WHERE team_id = $1 AND invited_user_id = $2 AND status = 'pending'
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const result = await this.pool.query(query, [teamId, email]);

        if (result.rows.length === 0) {
            return null;
        }

        return new TeamInvite(result.rows[0]);
    }

    async updateStatus(id: string, status: InviteStatus): Promise<TeamInvite | null> {
        const query = `
            UPDATE team_invites 
            SET status = $1 
            WHERE id = $2 
            RETURNING *
        `;
        const result = await this.pool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return null;
        }

        return new TeamInvite(result.rows[0]);
    }

    async delete(id: string): Promise<boolean> {
        const query = `DELETE FROM team_invites WHERE id = $1`;
        const result = await this.pool.query(query, [id]);

        return result.rowCount !== null && result.rowCount > 0;
    }
}