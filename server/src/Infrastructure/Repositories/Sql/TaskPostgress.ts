import { TaskRepo } from "../../../Application/Repositories/Task_Repo";
import { Task } from "../../../Domain/Entities/Task";
import { Pool } from "pg";

/**
 * Access rule (parameter $1 = requesting user):
 * creator, assignee, explicit project member, or member/creator of the project's team.
 */
const ACCESS_PREDICATE = `(
    t.user_id = $1
    OR t.assignee_id = $1
    OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = t.project_id AND pm.user_id = $1)
    OR EXISTS (
        SELECT 1
        FROM projects p
        JOIN teams tm ON tm.id = p.team_id
        WHERE p.id = t.project_id
          AND (
              tm.created_by = $1
              OR EXISTS (SELECT 1 FROM team_members tmm WHERE tmm.team_id = tm.id AND tmm.user_id = $1)
          )
    )
)`;

function mapRow(row: any): Task {
    const labels: string[] = Array.isArray(row.labels)
        ? row.labels.map((label: unknown) => String(label))
        : [];
    return new Task(
        row.title,
        row.description,
        row.priority,
        row.due_date,
        row.status,
        row.user_id,
        row.project_id ?? undefined,
        row.id,
        row.created_at,
        row.updated_at,
        row.assignee_id ?? null,
        labels,
    );
}

export class TaskRepoPostGress implements TaskRepo {
    constructor(private pool: Pool) {
    }

    async create(task: Task): Promise<Task> {
        const inserted = await this.pool.query(
            "INSERT INTO tasks ( title, description, priority, due_date, status, project_id,updated_at , created_at , user_id, assignee_id, labels) VALUES ($1, $2, $3, $4, $5, $6, $7, $8 , $9 , $10 , $11::jsonb ) RETURNING *",
            [
                task.title,
                task.description,
                task.priority,
                task.due_date,
                task.status,
                task.project_id ?? null,
                task.updated_at,
                task.created_at,
                task.user_id,
                task.assignee_id ?? null,
                JSON.stringify(task.labels ?? []),
            ]
        );
        return mapRow(inserted.rows[0]);
    }

    async getById(id: string, userId: string): Promise<Task | null> {
        const result = await this.pool.query(
            `SELECT t.* FROM tasks AS t WHERE t.id = $2 AND ${ACCESS_PREDICATE}`,
            [userId, id]
        );
        if (result.rows.length === 0) return null;
        return mapRow(result.rows[0]);
    }

    async canAccess(id: string, userId: string): Promise<boolean> {
        const result = await this.pool.query(
            `SELECT 1 FROM tasks AS t WHERE t.id = $2 AND ${ACCESS_PREDICATE}`,
            [userId, id]
        );
        return result.rows.length > 0;
    }

    async update(task: Task, userId: string): Promise<void> {
        await this.pool.query(
            `UPDATE tasks AS t
             SET title = $2, description = $3, priority = $4, due_date = $5, status = $6,
                 project_id = $7, updated_at = $8, assignee_id = $9, labels = $10::jsonb
             WHERE t.id = $11 AND ${ACCESS_PREDICATE}`,
            [
                userId,
                task.title,
                task.description,
                task.priority,
                task.due_date,
                task.status,
                task.project_id ?? null,
                task.updated_at,
                task.assignee_id ?? null,
                JSON.stringify(task.labels ?? []),
                task.id,
            ]
        );
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.pool.query(
            `DELETE FROM tasks AS t WHERE t.id = $2 AND ${ACCESS_PREDICATE}`,
            [userId, id]
        );
    }

    async getTasksByUser(userId: string): Promise<Task[]> {
        const result = await this.pool.query(
            `SELECT t.* FROM tasks AS t WHERE ${ACCESS_PREDICATE} ORDER BY t.created_at DESC`,
            [userId]
        );
        return result.rows.map(mapRow);
    }
}
