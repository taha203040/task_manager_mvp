import { ActivityLog } from "../../Domain/Entities/Activity";

export interface RecordActivityInput {
    /** Recipient of the notification. */
    userId: string;
    action: string;
    text: string;
    projectId?: string | null;
    taskId?: string | null;
}

export interface ActivityRepo {
    /** Activity relevant to one user only, newest first. */
    listForUser(userId: string, limit: number): Promise<ActivityLog[]>;
    /** Marks every unread row of that user as read; returns the number of rows updated. */
    markAllRead(userId: string): Promise<number>;
    markRead(userId: string, ids: string[]): Promise<number>;
    record(input: RecordActivityInput): Promise<void>;
}
