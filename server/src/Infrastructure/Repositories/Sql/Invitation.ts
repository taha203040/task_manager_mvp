import { ITeamInviteRepository, InviteStatus } from "../../../Application/Repositories/Team_invites";
import { TeamInvite } from "../../../Domain/Entities/Invites";
import { ConflictError, ForbiddenError } from "../../../Domain/Errors/AppError";
import { Pool } from "pg";

export class SqlTeamInviteRepository implements ITeamInviteRepository {
    constructor(private pool: Pool) { }

    async create(invite: TeamInvite): Promise<TeamInvite> {
        const query = `
            INSERT INTO team_invites (id, team_id, invited_user_id, role, invited_by, status, created_at, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW() + INTERVAL '7 days'))
            RETURNING *
        `;
        const result = await this.pool.query(query, [
            invite.id = crypto.randomUUID(),
            invite.team_id,
            invite.invited_user_id,
            invite.role,
            invite.invited_by,
            invite.status,
            invite.created_at,
            invite.expires_at,
        ]);

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

    async findByUserId(userId: string): Promise<TeamInvite[]> {
        const query = `SELECT * FROM team_invites WHERE invited_user_id = $1 ORDER BY created_at DESC`;
        const result = await this.pool.query(query, [userId]);

        return result.rows.map(row => new TeamInvite(row));
    }

    async findPendingInvite(teamId: string, userId: string): Promise<TeamInvite | null> {
        const query = `
            SELECT * FROM team_invites
            WHERE team_id = $1 AND invited_user_id = $2 AND status = 'pending'
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const result = await this.pool.query(query, [teamId, userId]);

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

    /**
     * Membership creation and invite status update happen in one transaction.
     * The team is taken from the invite row, never from the client.
     */
    async acceptAsInvitee(inviteId: string, inviteeId: string): Promise<TeamInvite | null> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");

            const found = await client.query(
                "SELECT * FROM team_invites WHERE id = $1 FOR UPDATE",
                [inviteId],
            );
            if (found.rows.length === 0) {
                await client.query("ROLLBACK");
                return null;
            }

            const row = found.rows[0];
            if (row.invited_user_id !== inviteeId) {
                await client.query("ROLLBACK");
                throw new ForbiddenError("This invitation does not belong to you");
            }
            if (row.status !== InviteStatus.PENDING) {
                await client.query("ROLLBACK");
                throw new ConflictError("Invitation is no longer pending");
            }

            await client.query(
                `INSERT INTO team_members (team_id, user_id, role)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (team_id, user_id) DO NOTHING`,
                [row.team_id, inviteeId, row.role],
            );

            const updated = await client.query(
                "UPDATE team_invites SET status = 'accepted' WHERE id = $1 RETURNING *",
                [inviteId],
            );

            await client.query("COMMIT");
            return new TeamInvite(updated.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK").catch(() => undefined);
            throw error;
        } finally {
            client.release();
        }
    }
}
