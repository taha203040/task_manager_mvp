/**
 * CRUD task
 * Admin roles  task 
 *
 * Authorization model (collaborative):
 * a user may access a task when they created it, are its assignee,
 * are a member of its project, or belong to the project's team.
 */
import { Task } from "../../Domain/Entities/Task";
export interface TaskRepo {
    /** Persists the task and returns the stored row (including the database-generated id). */
    create(task: Task): Promise<Task>;
    /** Tasks created by, assigned to, or visible through the user's project/team membership. */
    getTasksByUser(userId: string): Promise<Task[]>;
    /** Access-scoped read (creator | assignee | project member | team member). */
    getById(id: string, userId: string): Promise<Task | null>;
    /** Explicit access check used by collaboration use cases. */
    canAccess(id: string, userId: string): Promise<boolean>;
    delete(id: string, userId: string): Promise<void>
    update(task: Task, userId: string): Promise<void>;
}
