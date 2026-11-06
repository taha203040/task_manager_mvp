import { ActivityRepo, RecordActivityInput } from "../../../Application/Repositories/ActivityRepo";
import { ActivityLog } from "../../../Domain/Entities/Activity";
import { Pool } from "pg";

function mapRow(row: any): ActivityLog {
    return new ActivityLog(
        row.text ?? row.action,
        row.action,
        row.user_id,
        row.id,
        row.project_id ?? null,
        row.task_id ?? null,
        row.read === true,
        row.created_at,
    );
}

export class ActivityRepoPostgress implements ActivityRepo {
    constructor(private pool: Pool) { }

    async listForUser(userId: string, limit: number): Promise<ActivityLog[]> {
        const result = await this.pool.query(
            `SELECT * FROM activity_logs
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId, limit],
        );
        return result.rows.map(mapRow);
    }

    async markAllRead(userId: string): Promise<number> {
        const result = await this.pool.query(
            "UPDATE activity_logs SET read = TRUE WHERE user_id = $1 AND read = FALSE",
            [userId],
        );
        return result.rowCount ?? 0;
    }

    async markRead(userId: string, ids: string[]): Promise<number> {
        if (ids.length === 0) return 0;
        const result = await this.pool.query(
            "UPDATE activity_logs SET read = TRUE WHERE user_id = $1 AND id = ANY($2::uuid[]) AND read = FALSE",
            [userId, ids],
        );
        return result.rowCount ?? 0;
    }

    async record(input: RecordActivityInput): Promise<void> {
        await this.pool.query(
            `INSERT INTO activity_logs (user_id, action, text, project_id, task_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                input.userId,
                input.action,
                input.text,
                input.projectId ?? null,
                input.taskId ?? null,
            ],
        );
    }
}
