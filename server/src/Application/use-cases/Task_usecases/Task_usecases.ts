import { Task } from "../../../Domain/Entities/Task";
import { TaskRepo } from "../../Repositories/Task_Repo";


export class CreateTask {
    constructor(private taskRepo: TaskRepo) { }


    async execute(task: Task): Promise<void> {
        await this.taskRepo.create(task);
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
    constructor(private taskRepo: TaskRepo) { }
    async execute(task: Task, userId: string): Promise<void> {
        await this.taskRepo.update(task, userId);
    }
}

export class DeleteTask {
    constructor(private taskRepo: TaskRepo) { }
    async execute(id: string, userId: string): Promise<void> {
        await this.taskRepo.delete(id, userId);
    }
}




