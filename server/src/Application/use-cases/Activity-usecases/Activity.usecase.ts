import { ActivityDTO, ActivityLog } from "../../../Domain/Entities/Activity";
import { ActivityRepo } from "../../Repositories/ActivityRepo";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

function toActivityDTO(activity: ActivityLog): ActivityDTO {
    return {
        id: activity.id as string,
        text: activity.text,
        date: new Date(activity.created_at).toISOString(),
        projectId: activity.project_id,
        read: activity.read,
    };
}

export class GetUserActivity {
    constructor(private readonly activityRepo: ActivityRepo) { }

    /** Activity is always scoped to the authenticated user; there is no way to ask for someone else's. */
    async execute(userId: string, rawLimit?: unknown): Promise<ActivityDTO[]> {
        const parsed = Number(rawLimit);
        const limit = Number.isFinite(parsed) && parsed > 0
            ? Math.min(Math.floor(parsed), MAX_LIMIT)
            : DEFAULT_LIMIT;
        const rows = await this.activityRepo.listForUser(userId, limit);
        return rows.map(toActivityDTO);
    }
}

export class MarkActivityRead {
    constructor(private readonly activityRepo: ActivityRepo) { }

    async execute(userId: string, ids?: string[]): Promise<number> {
        if (ids && ids.length > 0) {
            return this.activityRepo.markRead(userId, ids);
        }
        return this.activityRepo.markAllRead(userId);
    }
}
