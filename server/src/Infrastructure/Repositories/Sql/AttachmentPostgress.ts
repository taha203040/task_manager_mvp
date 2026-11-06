import { AttachmentRepo } from "../../../Application/Repositories/AttachmentRepo";
import { TaskAttachment } from "../../../Domain/Entities/Collaboration";
import { Pool } from "pg";

function mapRow(row: any): TaskAttachment {
    return new TaskAttachment(
        row.name,
        row.url,
        row.task_id,
        row.uploaded_by ?? null,
        row.id,
        row.created_at,
    );
}

export class AttachmentRepoPostgress implements AttachmentRepo {
    constructor(private pool: Pool) { }

    async create(attachment: TaskAttachment): Promise<TaskAttachment> {
        const result = await this.pool.query(
            `INSERT INTO task_attachments (task_id, name, url, uploaded_by)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [attachment.task_id, attachment.name, attachment.url, attachment.uploaded_by],
        );
        return mapRow(result.rows[0]);
    }

    async getById(id: string): Promise<TaskAttachment | null> {
        const result = await this.pool.query("SELECT * FROM task_attachments WHERE id = $1", [id]);
        if (result.rows.length === 0) return null;
        return mapRow(result.rows[0]);
    }

    async getByTaskAndId(taskId: string, attachmentId: string): Promise<TaskAttachment | null> {
        const result = await this.pool.query(
            "SELECT * FROM task_attachments WHERE task_id = $1 AND id = $2",
            [taskId, attachmentId],
        );
        if (result.rows.length === 0) return null;
        return mapRow(result.rows[0]);
    }

    async listByTask(taskId: string): Promise<TaskAttachment[]> {
        const result = await this.pool.query(
            "SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY created_at ASC",
            [taskId],
        );
        return result.rows.map(mapRow);
    }

    async delete(taskId: string, attachmentId: string): Promise<boolean> {
        const result = await this.pool.query(
            "DELETE FROM task_attachments WHERE task_id = $1 AND id = $2",
            [taskId, attachmentId],
        );
        return (result.rowCount ?? 0) > 0;
    }
}
