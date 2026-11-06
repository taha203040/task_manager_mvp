import { TeamMember } from "../../../Domain/Entities/Team";
import { TeamMemberRepo } from "../../../Application/Repositories/TeamRepo";
import { Pool } from "pg";
import { InvitationWithTeamDTO } from "../../../Domain/Entities/Invites";
import { MemberSearchResult } from "../../../Domain/Entities/User_Entities";
// import { Team } from "../../../Domain/Entities/Team";
// import { User } from "../../../Domain/Entities/User_Entities";

export class SqlMemberRepository implements TeamMemberRepo {
  constructor(private pool: Pool) { }

  async create(teamId: string, userId: string, role: string): Promise<void> {
    const query = `
      INSERT INTO team_members (team_id, user_id, role)
      VALUES ($1, $2, $3)
    `;

    await this.pool.query(query, [teamId, userId, role]);
  }

  async delete(teamId: string, userId: string): Promise<void> {
    const query = `
      DELETE FROM team_members 
      WHERE team_id = $1 AND user_id = $2
    `;

    await this.pool.query(query, [teamId, userId]);
  }

  async updateRole(teamId: string, userId: string, role: string): Promise<void> {
    const query = `
      UPDATE team_members 
      SET role = $3
      WHERE team_id = $1 AND user_id = $2
    `;

    await this.pool.query(query, [teamId, userId, role]);
  }

  /**
   * Members of exactly one team (bounded result set; no batching needed).
   * The creator has a real 'owner' row thanks to migration 007, so no UNION is required.
   * Alias must match the mapping below (u.username AS username).
   */
  async getByTeamId(teamId: string): Promise<TeamMember[]> {
    const query = `
      SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
             u.username AS username
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at ASC NULLS LAST, u.username
    `;
    const result = await this.pool.query(query, [teamId]);

    return result.rows.map(row => new TeamMember(
      row.username ?? null,
      row.team_id,
      row.user_id,
      row.role,
      row.joined_at ? new Date(row.joined_at) : null,
    ));
  }

  async getByUserId(userId: string): Promise<TeamMember[]> {
    const query = `
      SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
             u.username AS username
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.user_id = $1
      ORDER BY tm.joined_at ASC NULLS LAST
    `;

    const result = await this.pool.query(query, [userId]);

    return result.rows.map(row => new TeamMember(
      row.username ?? null,
      row.team_id,
      row.user_id,
      row.role,
      row.joined_at ? new Date(row.joined_at) : null,
    ));
  }

  async countOwners(teamId: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT count(*)::int AS owners FROM team_members WHERE team_id = $1 AND role = 'owner'",
      [teamId],
    );
    return result.rows[0]?.owners ?? 0;
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM team_members 
      WHERE team_id = $1 AND user_id = $2
    `;

    const result = await this.pool.query(query, [teamId, userId]);
    return result.rows.length > 0;
  }
  async getRole(teamId: string, userId: string): Promise<string | null> {
    // The team creator is an owner even when no team_members row was created for them.
    const query = `
      SELECT COALESCE(
        (SELECT tm.role FROM team_members tm WHERE tm.team_id = $1 AND tm.user_id = $2),
        (SELECT 'owner' FROM teams t WHERE t.id = $1 AND t.created_by = $2)
      ) AS role
    `;
    const result = await this.pool.query(query, [teamId, userId]);
    const role = result.rows[0]?.role;
    return role ?? null;
  }

  /** Case-insensitive search over username/email; only the public projection is returned. */
  async searchUsers(searchTerm: string, limit: number): Promise<MemberSearchResult[]> {
    const query = `
      SELECT id, username, email, avatar
      FROM users
      WHERE username ILIKE $1 OR email ILIKE $1
      ORDER BY username
      LIMIT $2
    `;
    const result = await this.pool.query(query, [`%${searchTerm}%`, limit]);
    return result.rows.map(row => ({
      user_id: row.id,
      username: row.username,
      email: row.email,
      avatar: row.avatar ?? null,
    }));
  }
  async getByUserIdWithTeam(userId: string): Promise<InvitationWithTeamDTO[]> {
    const query = `
      SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
             t.name as team_name, t.description as team_description, t.created_at as team_created_at
      FROM team_members tm
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = $1
      ORDER BY tm.joined_at
    `;

    const result = await this.pool.query(query, [userId]);

    return result.rows.map(row => ({
      id: row.team_id,
      role: row.role,
      status: 'member',
      invited_by: '',
      team: { id: row.team_id, name: row.team_name },
    }));
  }
}



