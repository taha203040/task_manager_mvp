export const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "Paused",
  "Completed",
  "Canceled",
  "Active",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    typeof value === "string" &&
    (PROJECT_STATUSES as readonly string[]).includes(value)
  );
}

export class Project {
  constructor(
    public name: string,
    public readonly team_id: string | null,
    public description: string | null = null,
    public status: ProjectStatus = "Planning",
    public start_date: Date | null = null,
    public due_date: Date | null = null,
    public readonly id?: string,
    public readonly created_at: Date = new Date(),
    public updated_at: Date = new Date(),
  ) {}
}

export interface ProjectMemberDTO {
  user_id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  created_at: Date | null;
}

export interface ProjectWithMembers extends Project {
  members: ProjectMemberDTO[];
}
