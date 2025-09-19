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
    getById(id: string, userId: string): Promise<Task | null>;
    delete(id: string, userId: string): Promise<void>
    update(task: Task, userId: string): Promise<void>;
}
