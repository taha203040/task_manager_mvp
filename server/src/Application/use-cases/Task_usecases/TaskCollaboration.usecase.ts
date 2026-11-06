import { CommentRepo } from "../../Repositories/CommentRepo";
import { AttachmentRepo } from "../../Repositories/AttachmentRepo";
import { TaskRepo } from "../../Repositories/Task_Repo";
import { ActivityRepo } from "../../Repositories/ActivityRepo";
import {
    TaskAttachment,
    TaskAttachmentDTO,
    TaskComment,
    TaskCommentDTO,
} from "../../../Domain/Entities/Collaboration";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";
import { requireNonEmptyString } from "../../../Shared/utils/validation";

const COMMENT_MAX = 2000;
const ATTACHMENT_NAME_MAX = 255;
const ATTACHMENT_URL_MAX = 2048;

function toCommentDTO(comment: TaskComment): TaskCommentDTO {
    return {
        id: comment.id as string,
        author: { user_id: comment.author_id, username: comment.author_username },
        text: comment.text,
        date: new Date(comment.created_at).toISOString(),
    };
}

function toAttachmentDTO(attachment: TaskAttachment): TaskAttachmentDTO {
    return {
        id: attachment.id as string,
        name: attachment.name,
        url: attachment.url,
        uploadedBy: attachment.uploaded_by,
        date: new Date(attachment.created_at).toISOString(),
    };
}

/** Shared authorization guard: comments and attachments are visible to whoever may see the task. */
async function assertTaskAccess(taskRepo: TaskRepo, taskId: string, userId: string): Promise<void> {
    const allowed = await taskRepo.canAccess(taskId, userId);
    if (!allowed) {
        throw new ForbiddenError("You do not have access to this task");
    }
}

export class GetTaskComments {
    constructor(
        private readonly commentRepo: CommentRepo,
        private readonly taskRepo: TaskRepo,
    ) { }

    async execute(taskId: string, userId: string): Promise<TaskCommentDTO[]> {
        await assertTaskAccess(this.taskRepo, taskId, userId);
        const comments = await this.commentRepo.listByTask(taskId);
        return comments.map(toCommentDTO);
    }
}

export class AddTaskComment {
    constructor(
        private readonly commentRepo: CommentRepo,
        private readonly taskRepo: TaskRepo,
        private readonly activityRepo?: ActivityRepo,
    ) { }

    async execute(taskId: string, userId: string, rawText: unknown): Promise<TaskCommentDTO> {
        let text: string;
        try {
            text = requireNonEmptyString(rawText, "text", COMMENT_MAX);
        } catch (error) {
            throw new ValidationError((error as Error).message);
        }
        await assertTaskAccess(this.taskRepo, taskId, userId);

        const task = await this.taskRepo.getById(taskId, userId);
        const comment = await this.commentRepo.create(
            new TaskComment(text, taskId, userId),
        );

        if (task) {
            // Notify the task's stakeholders, never the comment author.
            const recipients = Array.from(new Set(
                [task.user_id, task.assignee_id].filter((id): id is string => !!id && id !== userId),
            ));
            for (const recipient of recipients) {
                try {
                    await this.activityRepo?.record({
                        userId: recipient,
                        action: "COMMENT_ADDED",
                        text: `A comment was added to "${task.title}"`,
                        projectId: task.project_id ?? null,
                        taskId,
                    });
                } catch (error) {
                    console.error("Failed to record comment activity", error);
                }
            }
        }
        return toCommentDTO(comment);
    }
}

export class GetTaskAttachments {
    constructor(
        private readonly attachmentRepo: AttachmentRepo,
        private readonly taskRepo: TaskRepo,
    ) { }

    async execute(taskId: string, userId: string): Promise<TaskAttachmentDTO[]> {
        await assertTaskAccess(this.taskRepo, taskId, userId);
        const attachments = await this.attachmentRepo.listByTask(taskId);
        return attachments.map(toAttachmentDTO);
    }
}

export class AddTaskAttachment {
    constructor(
        private readonly attachmentRepo: AttachmentRepo,
        private readonly taskRepo: TaskRepo,
    ) { }

    async execute(taskId: string, userId: string, input: { name: unknown; url: unknown }): Promise<TaskAttachmentDTO> {
        let name: string;
        let url: string;
        try {
            name = requireNonEmptyString(input.name, "name", ATTACHMENT_NAME_MAX);
            url = requireNonEmptyString(input.url, "url", ATTACHMENT_URL_MAX);
        } catch (error) {
            throw new ValidationError((error as Error).message);
        }
        if (!/^https?:\/\//i.test(url)) {
            throw new ValidationError("url must be an absolute http(s) URL");
        }
        await assertTaskAccess(this.taskRepo, taskId, userId);

        const attachment = await this.attachmentRepo.create(
            new TaskAttachment(name, url, taskId, userId),
        );
        return toAttachmentDTO(attachment);
    }
}

export class DeleteTaskAttachment {
    constructor(
        private readonly attachmentRepo: AttachmentRepo,
        private readonly taskRepo: TaskRepo,
    ) { }

    async execute(taskId: string, attachmentId: string, userId: string): Promise<void> {
        await assertTaskAccess(this.taskRepo, taskId, userId);

        // Scoped lookup prevents deleting an attachment through an unrelated task id.
        const attachment = await this.attachmentRepo.getByTaskAndId(taskId, attachmentId);
        if (!attachment) {
            throw new NotFoundError("Attachment not found");
        }
        const deleted = await this.attachmentRepo.delete(taskId, attachmentId);
        if (!deleted) {
            throw new NotFoundError("Attachment not found");
        }
    }
}
