import { Task } from "../../../Domain/Entities/Task";
import { TaskRepo } from "../../Repositories/Task_Repo";
import { ActivityRepo } from "../../Repositories/ActivityRepo";
import { TaskAssigneePolicy } from "./TaskAssigneePolicy";
import { NotFoundError } from "../../../Domain/Errors/AppError";

/**
 * Records a notification for the assignee. Notification delivery is a side channel:
 * a failure here must not roll back an already persisted task write.
 */
async function notifyAssignment(
    activityRepo: ActivityRepo | undefined,
    task: Task,
    actorId: string,
): Promise<void> {
    if (!activityRepo || !task.assignee_id || task.assignee_id === actorId) return;
    try {
        await activityRepo.record({
            userId: task.assignee_id,
            action: "TASK_ASSIGNED",
            text: `A task was assigned to you: ${task.title}`,
            projectId: task.project_id ?? null,
            taskId: task.id ?? null,
        });
    } catch (error) {
        console.error("Failed to record task assignment activity", error);
    }
}

export class CreateTask {
    constructor(
        private taskRepo: TaskRepo,
        private assigneePolicy?: TaskAssigneePolicy,
        private activityRepo?: ActivityRepo,
    ) { }

    async execute(task: Task, actorId: string = task.user_id): Promise<Task> {
        if (task.project_id && this.assigneePolicy) {
            await this.assigneePolicy.assertProjectAccess(task.project_id, actorId);
        }
        if (task.assignee_id && this.assigneePolicy) {
            await this.assigneePolicy.assertAssignable(task, task.assignee_id);
        }
        const created = await this.taskRepo.create(task);
        await notifyAssignment(this.activityRepo, created, actorId);
        return created;
    }
}

export class GetTasksByUser {
    constructor(private taskRepo: TaskRepo) { }

    async execute(userId: string): Promise<Task[]> {
        return await this.taskRepo.getTasksByUser(userId);
    }
}
export class GetTaskById {
    constructor(private taskRepo: TaskRepo) { }
    async execute(id: string, userId: string): Promise<Task | null> {
        return await this.taskRepo.getById(id, userId);
    }
}

export class UpdateTask {
    constructor(
        private taskRepo: TaskRepo,
        private assigneePolicy?: TaskAssigneePolicy,
        private activityRepo?: ActivityRepo,
    ) { }

    /**
     * @param task     the fully merged task to persist
     * @param userId   actor
     * @param previous the task as loaded before the update (used to detect assignment changes)
     */
    async execute(task: Task, userId: string, previous?: Task | null): Promise<void> {
        const assigneeChanged = (previous?.assignee_id ?? null) !== (task.assignee_id ?? null);
        const projectChanged = (previous?.project_id ?? null) !== (task.project_id ?? null);
        if (projectChanged && task.project_id && this.assigneePolicy) {
            await this.assigneePolicy.assertProjectAccess(task.project_id, userId);
        }
        if (task.assignee_id && assigneeChanged && this.assigneePolicy) {
            await this.assigneePolicy.assertAssignable(task, task.assignee_id);
        }
        await this.taskRepo.update(task, userId);
        if (assigneeChanged) {
            await notifyAssignment(this.activityRepo, task, userId);
        }
    }
}

export class DeleteTask {
    constructor(private taskRepo: TaskRepo) { }
    async execute(id: string, userId: string): Promise<void> {
        const task = await this.taskRepo.getById(id, userId);
        if (!task) {
            throw new NotFoundError("Task not found");
        }
        await this.taskRepo.delete(id, userId);
    }
}
