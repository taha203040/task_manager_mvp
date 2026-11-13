import type { Activity } from "./workspace-model";

export function normalizeActivity(data: unknown): Activity[] {
  const envelope = data as { activity?: unknown; activities?: unknown } | null;
  const entries = Array.isArray(data) ? data : envelope?.activity ?? envelope?.activities;
  if (!Array.isArray(entries)) throw new Error("The activity response must contain an activity list.");

  return entries.map((entry) => {
    const row = entry as Record<string, unknown>;
    const id = row.activity_id ?? row.id;
    const text = row.text ?? row.message;
    const date = row.date ?? row.created_at;
    if (id == null || typeof text !== "string" || typeof date !== "string" || Number.isNaN(Date.parse(date))) {
      throw new Error("The activity response contains an invalid update.");
    }
    const read = row.read ?? row.is_read;
    return {
      id: String(id),
      text,
      date,
      projectId: row.project_id == null && row.projectId == null ? undefined : String(row.project_id ?? row.projectId),
      read: read === true || read === 1,
    };
  });
}