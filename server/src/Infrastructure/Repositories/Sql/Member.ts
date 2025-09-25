import { TeamMember } from "../../../Domain/Entities/Team";
import { TeamMemberRepo } from "../../../Application/Repositories/TeamRepo";
import { Pool } from "pg";
// import { Team } from "../../../Domain/Entities/Team";
// import { User } from "../../../Domain/Entities/User_Entities";

export class SqlMemberRepository implements TeamMemberRepo {
  constructor(private pool: Pool) {}

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

  async getByTeamId(teamId: string): Promise<TeamMember[]> {
    const query = `
      SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
             u.username as user_name, u.email as user_email,
             t.name as team_name, t.created_by, t.description, t.created_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at
    `;
    
    const result = await this.pool.query(query, [teamId]);
    
    return result.rows.map(row => new TeamMember(
      row.team_id,
      row.user_id,
      row.role,
      new Date(row.joined_at)
    ));
  }

  async getByUserId(userId: string): Promise<TeamMember[]> {
    const query = `
      SELECT tm.team_id, tm.user_id, tm.role, tm.joined_at,
             u.username as user_name, u.email as user_email,
             t.name as team_name, t.created_by, t.description, t.created_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN teams t ON tm.team_id = t.id
      WHERE tm.user_id = $1
      ORDER BY tm.joined_at
    `;
    
    const result = await this.pool.query(query, [userId]);
    
    return result.rows.map(row => new TeamMember(
      row.team_id,
      row.user_id,
      row.role,
      new Date(row.joined_at)
    ));
  }

  async isMember(teamId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM team_members 
      WHERE team_id = $1 AND user_id = $2
    `;
    
    const result = await this.pool.query(query, [teamId, userId]);
    return result.rows.length > 0;
  }
}
