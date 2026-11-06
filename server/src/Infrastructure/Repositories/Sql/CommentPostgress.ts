import { CommentRepo } from "../../../Application/Repositories/CommentRepo";
import { TaskComment } from "../../../Domain/Entities/Collaboration";
import { Pool } from "pg";

function mapRow(row: any): TaskComment {
    return new TaskComment(
        row.content,
        row.task_id,
        row.user_id,
        row.id,
        row.created_at,
        row.author_username ?? null,
    );
}

export class CommentRepoPostgress implements CommentRepo {
    constructor(private pool: Pool) { }

    async create(comment: TaskComment): Promise<TaskComment> {
        const result = await this.pool.query(
            `WITH inserted AS (
                 INSERT INTO comments (task_id, user_id, content)
                 VALUES ($1, $2, $3)
                 RETURNING *
             )
             SELECT inserted.*, u.username AS author_username
             FROM inserted
             LEFT JOIN users u ON u.id = inserted.user_id`,
            [comment.task_id, comment.author_id, comment.text],
        );
        return mapRow(result.rows[0]);
    }

    async listByTask(taskId: string): Promise<TaskComment[]> {
        const result = await this.pool.query(
            `SELECT c.*, u.username AS author_username
             FROM comments c
             LEFT JOIN users u ON u.id = c.user_id
             WHERE c.task_id = $1
             ORDER BY c.created_at ASC`,
            [taskId],
        );
        return result.rows.map(mapRow);
    }
}
