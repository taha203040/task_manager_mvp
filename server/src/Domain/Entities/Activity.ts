import { ActivityType } from "./Task";

export class ActivityLog {
    constructor(
        public text: string,
        public action: string,
        public readonly user_id: string,
        public readonly id: string | null = null,
        public project_id: string | null = null,
        public task_id: string | null = null,
        public read: boolean = false,
        public readonly created_at: Date = new Date(),
    ) { }
}

export interface ActivityDTO {
    id: string;
    text: string;
    date: string;
    projectId: string | null;
    read: boolean;
}

export type ActivityAction =
    | ActivityType.TASK_CREATED
    | ActivityType.TASK_UPDATED
    | ActivityType.TASK_DELETED
    | ActivityType.USER_JOINED
    | ActivityType.USER_LEFT
    | ActivityType.COMMENT_ADDED
    | "TASK_ASSIGNED"
    | "PROJECT_CREATED"
    | "TEAM_INVITE";
