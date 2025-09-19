// import { Task } from "../../../Domain/Entities/Task";
// import { TaskRepo } from "../../Repositories/Task_Repo";

// export class Createtask {
//     constructor(private taskrepo: TaskRepo) {
//     }
//     async execute(task: Task) {
//         await this.taskrepo.create(task)
//     }
// }

// export class GetTasksByUser {
//     constructor(private taskrepo: TaskRepo) {
//     }
//     async execute(userId: string): Promise<Task[]> {
//         return await this.taskrepo.getTasksByUser(userId);
//     }
// }

// export class GetTaskById {
//     constructor(private taskrepo: TaskRepo) {
//     }
//     async execute(id: string): Promise<Task | null> {
//         return await this.taskrepo.getById(id);
//     }
// }

// export class UpdateTask {
//     constructor(private taskrepo: TaskRepo) {
//     }
//     async execute(task: Task) {
//         await this.taskrepo.update(task);
//     }
// }

// export class DeleteTask {
//     constructor(private taskrepo: TaskRepo) {
//     }
//     async execute(id: string) {
//         await this.taskrepo.delete(id);
//     }
// }