import axios from "axios";
import type { Member, Task } from "./workspace-model";

export type ApiTask = {
  id?: string; task_id?: string; project_id?: string | null; user_id?: string;
  title: string; description?: string; assignee_id?: string | null;
  assignee?: { user_id: string; username: string; avatar?: string | null } | null;
  status?: string; priority?: string; due_date?: string | null;
  labels?: string[]; created_at?: string; comments?: Task["comments"]; attachments?: Task["attachments"];
};
export function normalizeTask(t: ApiTask): Task {
  return {
    id: String(t.task_id ?? t.id ?? ""), projectId: t.project_id ?? "", creatorId: t.user_id,
    title: t.title, description: t.description ?? "", assigneeId: t.assignee_id ?? "",
    assignee: t.assignee ? { id: t.assignee.user_id, name: t.assignee.username, avatar: t.assignee.avatar ?? undefined } : null,
    status: ({ TODO: "Todo", IN_PROGRESS: "In Progress", IN_REVIEW: "In Review", COMPLETED: "Done", DONE: "Done" } as Record<string, Task["status"]>)[t.status ?? ""] ?? "Todo",
    priority: ({ LOW: "Low", MEDIUM: "Medium", HIGH: "High", CRITICAL: "Urgent", URGENT: "Urgent" } as Record<string, Task["priority"]>)[t.priority ?? ""] ?? "Medium",
    dueDate: t.due_date?.slice(0, 10) ?? "", labels: t.labels ?? [], createdAt: t.created_at ?? "",
    comments: t.comments ?? [], attachments: t.attachments ?? [],
  };
}
export function taskPayload(task: Task, previous?: Task) {
  return {
    title: task.title, description: task.description, project_id: task.projectId || null,
    status: task.status === "Done" ? "COMPLETED" : task.status.toUpperCase().replaceAll(" ", "_"),
    priority: task.priority === "Urgent" ? "CRITICAL" : task.priority.toUpperCase(),
    due_date: task.dueDate || null, labels: task.labels,
    ...(!previous || previous.assigneeId !== task.assigneeId ? { assignee_id: task.assigneeId || null } : {}),
  };
}
export function normalizeMembers(data: unknown): Member[] {
  const source = data as { members?: unknown[] } | null;
  const rows = Array.isArray(data) ? data : source?.members ?? [];
  return rows.flatMap((row) => {
    const m = row as { user_id?: string; username?: string; email?: string; role?: string | null };
    if (!m.user_id) return [];
    return [{ id: String(m.user_id), name: m.username ?? m.email ?? String(m.user_id), email: m.email ?? "",
      role: (m.role === "owner" ? "Owner" : m.role === "admin" ? "Admin" : "Member") as Member["role"] }];
  });
}
export function mergeMembers(...groups: Member[][]): Member[] {
  return [...new Map(groups.flat().map(m => [m.id, m])).values()];
}
export class TaskApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "TaskApiError"; }
}
export function taskApiError(error: unknown): TaskApiError {
  if (error instanceof TaskApiError) return error;
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    const message = typeof data?.message === "string" ? data.message : typeof data?.error === "string" ? data.error : error.message;
    return new TaskApiError(error.response?.status ?? 0, message);
  }
  return new TaskApiError(0, error instanceof Error ? error.message : "Could not save task. Please try again.");
}