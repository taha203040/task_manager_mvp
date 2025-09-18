import { TaskRepo } from "../../Repositories/Task_Repo";
export class UpdateTaskPriority {
    constructor(private taskRepo: TaskRepo) { }

    async execute(id: string, priority: string): Promise<void> {
        await this.taskRepo.updatePriority(id, priority);
    }
}
export class UpdateTaskStatus {
    constructor(private taskRepo: TaskRepo) { }

    async execute(id: string, state: string,): Promise<void> {
        await this.taskRepo.updateState(id, state);
    }
}
