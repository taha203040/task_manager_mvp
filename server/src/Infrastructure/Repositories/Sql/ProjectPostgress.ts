import { ProjectRepo } from "../../../Application/Repositories/ProjectRepo";
import { Project, ProjectMemberDTO, ProjectStatus } from "../../../Domain/Entities/Project";
import { Pool } from "pg";

const PROJECT_SELECT = `SELECT p.* FROM projects AS p`;

/** Parameter $2 = requesting user; project row alias is p. */
const PROJECT_ACCESS = `(
    EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $2)
    OR EXISTS (
        SELECT 1 FROM teams t
        WHERE t.id = p.team_id
          AND (
              t.created_by = $2
              OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $2)
          )
    )
)`;

function mapProject(row: any): Project {
    return new Project(
        row.name,
        row.team_id ?? null,
        row.description ?? null,
        row.status as ProjectStatus,
        row.start_date ?? null,
        row.due_date ?? null,
        row.id,
        row.created_at,
        row.updated_at,
    );
}

export class ProjectRepoPostgress implements ProjectRepo {
    constructor(private pool: Pool) { }

    async create(project: Project, memberIds: string[]): Promise<Project> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const inserted = await client.query(
                `INSERT INTO projects (name, description, team_id, status, start_date, due_date, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [
                    project.name,
                    project.description,
                    project.team_id,
                    project.status,
                    project.start_date,
                    project.due_date,
                    project.created_at,
                    project.updated_at,
                ],
            );
            const row = inserted.rows[0];
            await this.insertMembers(client, row.id, memberIds);
            await client.query("COMMIT");
            return mapProject(row);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async update(project: Project, memberIds: string[] | null): Promise<Project | null> {
        const client = await this.pool.connect();
        try {
            await client.query("BEGIN");
            const updated = await client.query(
                `UPDATE projects
                 SET name = $2, description = $3, status = $4, start_date = $5, due_date = $6, updated_at = $7
                 WHERE id = $1
                 RETURNING *`,
                [
                    project.id,
                    project.name,
                    project.description,
                    project.status,
                    project.start_date,
                    project.due_date,
                    project.updated_at,
                ],
            );
            if (updated.rows.length === 0) {
                await client.query("ROLLBACK");
                return null;
            }
            if (memberIds !== null) {
                await client.query("DELETE FROM project_members WHERE project_id = $1", [project.id]);
                await this.insertMembers(client, project.id as string, memberIds);
            }
            await client.query("COMMIT");
            return mapProject(updated.rows[0]);
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }

    async getById(id: string): Promise<Project | null> {
        const result = await this.pool.query("SELECT * FROM projects WHERE id = $1", [id]);
        if (result.rows.length === 0) return null;
        return mapProject(result.rows[0]);
    }

    async listForUser(userId: string, teamId: string | null): Promise<Project[]> {
        const result = await this.pool.query(
            `${PROJECT_SELECT}
             WHERE (
                 EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = p.id AND pm.user_id = $1)
                 OR EXISTS (
                     SELECT 1 FROM teams t
                     WHERE t.id = p.team_id
                       AND (
                           t.created_by = $1
                           OR EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = t.id AND tm.user_id = $1)
                       )
                 )
             )
             AND ($2::uuid IS NULL OR p.team_id = $2::uuid)
             ORDER BY p.created_at DESC, p.name ASC`,
            [userId, teamId],
        );
        return result.rows.map(mapProject);
    }

    async delete(id: string): Promise<boolean> {
        const result = await this.pool.query("DELETE FROM projects WHERE id = $1", [id]);
        return (result.rowCount ?? 0) > 0;
    }

    async canAccess(projectId: string, userId: string): Promise<boolean> {
        const result = await this.pool.query(
            `${PROJECT_SELECT} WHERE p.id = $1 AND ${PROJECT_ACCESS}`,
            [projectId, userId],
        );
        return result.rows.length > 0;
    }

    async isMember(projectId: string, userId: string): Promise<boolean> {
        const result = await this.pool.query(
            "SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2",
            [projectId, userId],
        );
        return result.rows.length > 0;
    }

    async listMembers(projectId: string): Promise<ProjectMemberDTO[]> {
        const result = await this.pool.query(
            `SELECT pm.user_id, pm.created_at, u.username, u.email, tm.role
             FROM project_members pm
             LEFT JOIN users u ON u.id = pm.user_id
             LEFT JOIN projects p ON p.id = pm.project_id
             LEFT JOIN team_members tm ON tm.team_id = p.team_id AND tm.user_id = pm.user_id
             WHERE pm.project_id = $1
             ORDER BY pm.created_at ASC`,
            [projectId],
        );
        return result.rows.map((row) => ({
            user_id: row.user_id,
            username: row.username ?? null,
            email: row.email ?? null,
            role: row.role ?? null,
            created_at: row.created_at ?? null,
        }));
    }

    private async insertMembers(client: any, projectId: string, memberIds: string[]): Promise<void> {
        if (memberIds.length === 0) return;
        const placeholders = memberIds.map((_, index) => `($1, $${index + 2})`).join(", ");
        await client.query(
            `INSERT INTO project_members (project_id, user_id) VALUES ${placeholders} ON CONFLICT DO NOTHING`,
            [projectId, ...memberIds],
        );
    }
}
