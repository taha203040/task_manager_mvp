import { routeParam } from "../utils/params";
import { Request, Response } from "express";
import {
    CreateTask,
    GetTasksByUser,
    GetTaskById,
    UpdateTask,
    DeleteTask,
} from '../../../Application/use-cases/Task_usecases/Task_usecases'
import {
    AddTaskAttachment,
    AddTaskComment,
    DeleteTaskAttachment,
    GetTaskAttachments,
    GetTaskComments,
} from '../../../Application/use-cases/Task_usecases/TaskCollaboration.usecase'
import { TaskAssigneePolicy } from "../../../Application/use-cases/Task_usecases/TaskAssigneePolicy";
import { TaskRepoPostGress } from "../../../Infrastructure/Repositories/Sql/TaskPostgress";
import { ProjectRepoPostgress } from "../../../Infrastructure/Repositories/Sql/ProjectPostgress";
import { SqlMemberRepository } from "../../../Infrastructure/Repositories/Sql/Member";
import { CommentRepoPostgress } from "../../../Infrastructure/Repositories/Sql/CommentPostgress";
import { AttachmentRepoPostgress } from "../../../Infrastructure/Repositories/Sql/AttachmentPostgress";
import { ActivityRepoPostgress } from "../../../Infrastructure/Repositories/Sql/ActivityPostgress";
import pool from "../../../Config/db";
import { Task, TaskPriority, TaskStatus } from "../../../Domain/Entities/Task";
import { sendError, sendUnauthorized } from "../middlewares/errorHandler";
import { NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";

const taskrepo = new TaskRepoPostGress(pool);
const projectRepo = new ProjectRepoPostgress(pool);
const memberRepo = new SqlMemberRepository(pool);
const commentRepo = new CommentRepoPostgress(pool);
const attachmentRepo = new AttachmentRepoPostgress(pool);
const activityRepo = new ActivityRepoPostgress(pool);
const assigneePolicy = new TaskAssigneePolicy(projectRepo, memberRepo);

const TITLE_MAX = 200;
const DESCRIPTION_MAX = 5000;
const LABELS_MAX_ITEMS = 20;
const LABEL_MAX = 40;

function parseStatus(value: unknown, fallback: TaskStatus): TaskStatus {
    if (value === undefined || value === null || value === "") return fallback;
    if (!Object.values(TaskStatus).includes(value as TaskStatus)) {
        throw new ValidationError("status must be one of TODO, IN_PROGRESS, IN_REVIEW, COMPLETED");
    }
    return value as TaskStatus;
}

function parsePriority(value: unknown, fallback: TaskPriority): TaskPriority {
    if (value === undefined || value === null || value === "") return fallback;
    if (!Object.values(TaskPriority).includes(value as TaskPriority)) {
        throw new ValidationError("priority must be one of LOW, MEDIUM, HIGH, CRITICAL");
    }
    return value as TaskPriority;
}

function parseTitle(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new ValidationError("Title is required");
    }
    const title = value.trim();
    if (title.length > TITLE_MAX) {
        throw new ValidationError(`Title must be at most ${TITLE_MAX} characters`);
    }
    return title;
}

function parseDescription(value: unknown): string | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") {
        throw new ValidationError("Description must be a string");
    }
    if (value.length > DESCRIPTION_MAX) {
        throw new ValidationError(`Description must be at most ${DESCRIPTION_MAX} characters`);
    }
    return value;
}

function parseDueDate(value: unknown): Date | null {
    if (value === undefined || value === null || value === "") return null;
    const date = new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new ValidationError("due_date must be a valid date");
    }
    return date;
}

function parseLabels(value: unknown): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
        throw new ValidationError("labels must be an array of strings");
    }
    if (value.length > LABELS_MAX_ITEMS) {
        throw new ValidationError(`labels must contain at most ${LABELS_MAX_ITEMS} items`);
    }
    return value.map((label) => {
        if (typeof label !== "string" || label.trim().length === 0) {
            throw new ValidationError("labels must contain non-empty strings");
        }
        if (label.trim().length > LABEL_MAX) {
            throw new ValidationError(`each label must be at most ${LABEL_MAX} characters`);
        }
        return label.trim();
    });
}

/**
 * Assignments are accepted under either spelling: `assignee_id` (native) or `assigneeId`
 * (camelCase adapters). Returning undefined means "field not provided" so an update keeps the
 * current assignee; null/"" clears it. Without this a camelCase client silently saved nothing.
 */
function readAssigneeInput(body: unknown): unknown {
    if (body === null || typeof body !== "object") return undefined;
    const record = body as Record<string, unknown>;
    if (record["assignee_id"] !== undefined) return record["assignee_id"];
    if (record["assigneeId"] !== undefined) return record["assigneeId"];
    return undefined;
}

function parseOptionalId(value: unknown, field: string): string | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value !== "string") {
        throw new ValidationError(`${field} must be a string`);
    }
    return value;
}

export class TaskController {
    static async createTask(req: Request, res: Response) {
        try {
            const { title, description, status, project_id, priority, due_date } = req.body;
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const task: Task = new Task(
                parseTitle(title),
                parseDescription(description),
                parsePriority(priority, TaskPriority.MEDIUM),
                parseDueDate(due_date),
                parseStatus(status, TaskStatus.TODO),
                userId,
                parseOptionalId(project_id, "project_id") ?? undefined,
                undefined, // id is generated by the database
                new Date(),
                new Date(),
                parseOptionalId(readAssigneeInput(req.body), "assignee_id"),
                parseLabels(req.body.labels),
            );

            const createTaskUseCase = new CreateTask(taskrepo, assigneePolicy, activityRepo);
            const created = await createTaskUseCase.execute(task, userId);
            res.status(201).json({ message: "Task created successfully", task_id: created.id, task: created });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async getTasksByUser(req: Request, res: Response) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return sendUnauthorized(res);
            }

            const getTasksUseCase = new GetTasksByUser(taskrepo);
            const tasks = await getTasksUseCase.execute(userId);

            res.status(200).json({ tasks });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async getTaskById(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const getTaskUseCase = new GetTaskById(taskrepo);
            const task = await getTaskUseCase.execute(id, userId);

            if (!task) {
                throw new NotFoundError("Task not found");
            }

            res.status(200).json({ task });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async updateTask(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const getTaskUseCase = new GetTaskById(taskrepo);
            const existingTask = await getTaskUseCase.execute(id, userId);
            if (!existingTask) {
                throw new NotFoundError("Task not found");
            }

            const body = req.body ?? {};
            const assigneeInput = readAssigneeInput(body);
            const updatedTask: Task = new Task(
                body.title === undefined ? existingTask.title : parseTitle(body.title),
                body.description === undefined ? existingTask.description : parseDescription(body.description),
                parsePriority(body.priority, existingTask.priority),
                body.due_date === undefined ? existingTask.due_date : parseDueDate(body.due_date),
                parseStatus(body.status, existingTask.status),
                existingTask.user_id,
                body.project_id === undefined
                    ? existingTask.project_id
                    : (parseOptionalId(body.project_id, "project_id") ?? undefined),
                existingTask.id,
                existingTask.created_at,
                new Date(),
                assigneeInput === undefined
                    ? existingTask.assignee_id
                    : parseOptionalId(assigneeInput, "assignee_id"),
                body.labels === undefined ? existingTask.labels : parseLabels(body.labels),
            );

            const updateTaskUseCase = new UpdateTask(taskrepo, assigneePolicy, activityRepo);
            await updateTaskUseCase.execute(updatedTask, userId, existingTask);

            res.status(200).json({ message: "Task updated successfully" });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async deleteTask(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const deleteTaskUseCase = new DeleteTask(taskrepo);
            await deleteTaskUseCase.execute(id, userId);

            res.status(200).json({ message: "Task deleted successfully" });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async getComments(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const useCase = new GetTaskComments(commentRepo, taskrepo);
            const comments = await useCase.execute(id, userId);
            res.status(200).json({ comments });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async addComment(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const useCase = new AddTaskComment(commentRepo, taskrepo, activityRepo);
            const comment = await useCase.execute(id, userId, req.body?.text);
            res.status(201).json({ comment });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async getAttachments(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const useCase = new GetTaskAttachments(attachmentRepo, taskrepo);
            const attachments = await useCase.execute(id, userId);
            res.status(200).json({ attachments });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async addAttachment(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
            const userId = req.user?.user_id;
            if (!id || !userId) {
                return sendUnauthorized(res);
            }

            const useCase = new AddTaskAttachment(attachmentRepo, taskrepo);
            const attachment = await useCase.execute(id, userId, {
                name: req.body?.name,
                url: req.body?.url,
            });
            res.status(201).json({ attachment });
        } catch (error) {
            sendError(res, error);
        }
    }

    static async deleteAttachment(req: Request, res: Response) {
        try {
            const id = routeParam(req.params.id);
const attachmentId = routeParam(req.params.attachmentId);
            const userId = req.user?.user_id;
            if (!id || !attachmentId || !userId) {
                return sendUnauthorized(res);
            }

            const useCase = new DeleteTaskAttachment(attachmentRepo, taskrepo);
            await useCase.execute(id, attachmentId, userId);
            res.status(200).json({ message: "Attachment deleted successfully" });
        } catch (error) {
            sendError(res, error);
        }
    }
}
