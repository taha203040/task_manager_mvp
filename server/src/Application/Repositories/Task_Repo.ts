/**
 * CRUD task
 * Admin roles  task 
 * 
 * 
 */
import { Task } from "../../Domain/Entities/Task";

export interface TaskRepo {
    create(task: Task): Promise<void>;
    getTasksByUser(userId: string): Promise<Task[]>;
    getById(id: string): Promise<Task | null>;
    update(task: Task): Promise<void>;
    updatePriority(
        id: string,

        priority: string
    ): Promise<void>;
    updateState(
        id: string,
        state: string,
    ): Promise<void>;
    delete(id: string): Promise<void>;
}
