import { ProjectRepo } from "../../Repositories/ProjectRepo";
import { TeamMemberRepo } from "../../Repositories/TeamRepo";
import { Task } from "../../../Domain/Entities/Task";
import { ForbiddenError, ValidationError } from "../../../Domain/Errors/AppError";

/**
 * Assignment authorization rule:
 * a task may be assigned to a user who belongs to the task's project
 * (explicit project member or member of the project's team).
 * Tasks without a project may only be assigned to their creator.
 */
export class TaskAssigneePolicy {
    constructor(
        private readonly projectRepo: ProjectRepo,
        private readonly memberRepo: TeamMemberRepo,
    ) { }

    async isAssignable(task: Pick<Task, "project_id" | "user_id">, assigneeId: string): Promise<boolean> {
        if (!task.project_id) {
            return assigneeId === task.user_id;
        }
        if (await this.projectRepo.isMember(task.project_id, assigneeId)) {
            return true;
        }
        const project = await this.projectRepo.getById(task.project_id);
        if (!project || !project.team_id) {
            return false;
        }
        const role = await this.memberRepo.getRole(project.team_id, assigneeId);
        return role !== null;
    }

    /** A task may only be placed in a project the actor can access. */
    async assertProjectAccess(projectId: string, userId: string): Promise<void> {
        const allowed = await this.projectRepo.canAccess(projectId, userId);
        if (!allowed) {
            throw new ForbiddenError("You do not have access to this project");
        }
    }

    async assertAssignable(task: Pick<Task, "project_id" | "user_id">, assigneeId: string): Promise<void> {
        if (!await this.isAssignable(task, assigneeId)) {
            if (!task.project_id) {
                throw new ValidationError("Tasks without a project can only be assigned to their creator");
            }
            throw new ForbiddenError("Assignee must be a member of the task's project or team");
        }
    }
}
