import { TaskAttachment } from "../../Domain/Entities/Collaboration";

export interface AttachmentRepo {
    create(attachment: TaskAttachment): Promise<TaskAttachment>;
    getById(id: string): Promise<TaskAttachment | null>;
    /** Scoped lookup: an attachment must belong to the task it is addressed through. */
    getByTaskAndId(taskId: string, attachmentId: string): Promise<TaskAttachment | null>;
    listByTask(taskId: string): Promise<TaskAttachment[]>;
    delete(taskId: string, attachmentId: string): Promise<boolean>;
}
