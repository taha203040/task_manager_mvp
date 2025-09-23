import { TaskRepo } from "../../../Application/Repositories/Task_Repo";
import { Task } from "../../../Domain/Entities/Task";
import { Pool } from "pg";
export class TaskRepoPostGress implements TaskRepo {
    constructor(private pool: Pool) {
    }
    async create(task: Task): Promise<void> {
        await this.pool.query(
            "INSERT INTO tasks ( title, description, priority, due_date, status, project_id, created_at, updated_at, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
            [task.title, task.description, task.priority, task.due_date, task.status, task.project_id, task.created_at, task.updated_at, task.user_id]
        );
    }
    async getById(id: string, userId: string): Promise<Task | null> {
        const result = await this.pool.query(
            "SELECT * FROM tasks WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
        if (result.rows.length === 0) return null;
        const row = result.rows[0];
        return new Task(
            row.id,
            row.title,
            row.description,
            row.priority,
            row.due_date,
            row.status,
            row.project_id,
            row.created_at,
            row.updated_at,
            row.user_id
        );
    }

    async update(task: Task, userId: string): Promise<void> {
        await this.pool.query(
            "UPDATE tasks SET title = $1, description = $2, priority = $3, due_date = $4, status = $5, project_id = $6, updated_at = $7 WHERE id = $8 AND user_id = $9",
            [task.title, task.description, task.priority, task.due_date, task.status, task.project_id, task.updated_at, task.id, userId]
        );
    }

    async delete(id: string, userId: string): Promise<void> {
        await this.pool.query(
            "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
            [id, userId]
        );
    }
    async getTasksByUser(userId: string): Promise<Task[]> {
        const result = await this.pool.query(
            "SELECT * FROM tasks WHERE user_id = $1",
            [userId]
        );
        return result.rows.map(row => new Task(
            row.id,
            row.title,
            row.description,
            row.priority,
            row.due_date,
            row.status,
            row.project_id,
            row.created_at,
            row.updated_at,
            row.user_id
        ));
    }
}