import { Request, Response } from "express";
import { CreateTask, GetTasksByUser, GetTaskById, UpdateTask, DeleteTask } from '../../../Application/use-cases/Task_usecases/Task_usecases'
import { TaskRepoPostGress } from "../../../Infrastructure/Repositories/Sql/TaskPostgress";
import pool from "../../../Config/db";
import { Task, TaskPriority, TaskStatus } from "../../../Domain/Entities/Task";
const taskrepo = new TaskRepoPostGress(pool);

export class TaskController {
    static async createTask(req: Request, res: Response) {
        try {
            const { title, description, status, project_id, priority, due_date, } = req.body;
            //@ts-ignore
            const user_id = req.user?.user_id || null
            //@ts-ignore
            console.log('ussr id', user_id)
            // console.log('title :', title)

            if (!user_id) {
                return res.status(400).json({ error: "  userId  required" });
            }
            if (!title) {
                return res.status(400).json({ error: "Title  required" });
            }
            const task: Task = new Task(
                title,
                description || null,
                priority || TaskPriority.MEDIUM,
                due_date ? new Date(due_date) : null,
                (status as TaskStatus) || TaskStatus.TODO,
                user_id,
                project_id || null,
                crypto.randomUUID(),
                new Date(),
            );
            const createTaskUseCase = new CreateTask(taskrepo);
            await createTaskUseCase.execute(task);
            res.status(201).json({ message: "Task created successfully" });
        } catch (err) {
            console.error(err);
            console.log(err);

            res.status(500).json({ error: "Server error" });
        }
    }

    static async getTasksByUser(req: Request, res: Response) {
        try {
            //@ts-ignore
            const user_id = req.user?.user_id || null

            if (!user_id) {
                return res.status(400).json({ error: "User ID is required" });
            }

            const getTasksUseCase = new GetTasksByUser(taskrepo);
            const tasks = await getTasksUseCase.execute(user_id);

            res.status(200).json({ tasks });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async getTaskById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            //@ts-ignore
            const { user_id } = req.user
            if (!id || !user_id) {
                return res.status(400).json({ error: "Task ID is required" });
            }

            const getTaskUseCase = new GetTaskById(taskrepo);
            const task = await getTaskUseCase.execute(id, user_id);

            if (!task) {
                return res.status(404).json({ error: "Task not found" });
            }

            res.status(200).json({ task });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async updateTask(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { title, description, status, userId, teamId } = req.body;

            if (!id) {
                return res.status(400).json({ error: "Task ID is required" });
            }

            // First get the existing task to merge with updates
            const getTaskUseCase = new GetTaskById(taskrepo);
            const existingTask = await getTaskUseCase.execute(id, userId);

            if (!existingTask) {
                return res.status(404).json({ error: "Task not found" });
            }

            const updatedTask = {
                ...existingTask,
                title: title || existingTask.title,
                content: description !== undefined ? description : existingTask.description,
                status: status || existingTask.status,
                userId: userId || existingTask.user_id,
                updatedAt: new Date()
            };

            const updateTaskUseCase = new UpdateTask(taskrepo);
            await updateTaskUseCase.execute(updatedTask, userId);

            res.status(200).json({ message: "Task updated successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }

    static async deleteTask(req: Request, res: Response) {
        try {
            const { id, user_id } = req.params;

            if (!id || !user_id) {
                return res.status(400).json({ error: "Task ID is required" });
            }

            const deleteTaskUseCase = new DeleteTask(taskrepo);
            await deleteTaskUseCase.execute(id, user_id);

            res.status(200).json({ message: "Task deleted successfully" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: "Server error" });
        }
    }
}