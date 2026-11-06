import { TaskComment } from "../../Domain/Entities/Collaboration";

export interface CommentRepo {
    create(comment: TaskComment): Promise<TaskComment>;
    listByTask(taskId: string): Promise<TaskComment[]>;
}
