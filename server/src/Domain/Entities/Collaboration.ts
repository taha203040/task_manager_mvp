/**
 * Task collaboration entities: comments and attachments.
 * Comments reuse the existing `comments` table; attachments use `task_attachments`.
 */
export class TaskComment {
    constructor(
        public text: string,
        public readonly task_id: string,
        public readonly author_id: string,
        public readonly id: string | null = null,
        public readonly created_at: Date = new Date(),
        public readonly author_username: string | null = null,
    ) { }
}

export interface TaskCommentDTO {
    id: string;
    author: { user_id: string; username: string | null };
    text: string;
    date: string;
}

export class TaskAttachment {
    constructor(
        public name: string,
        public url: string,
        public readonly task_id: string,
        public readonly uploaded_by: string | null,
        public readonly id: string | null = null,
        public readonly created_at: Date = new Date(),
    ) { }
}

export interface TaskAttachmentDTO {
    id: string;
    name: string;
    url: string;
    uploadedBy: string | null;
    date: string;
}
