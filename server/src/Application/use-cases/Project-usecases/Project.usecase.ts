import { Project, ProjectMemberDTO, ProjectStatus, isProjectStatus } from "../../../Domain/Entities/Project";
import { ProjectRepo } from "../../Repositories/ProjectRepo";
import { TeamMemberRepo } from "../../Repositories/TeamRepo";
import { ForbiddenError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";
import {
    optionalDate,
    optionalString,
    requireNonEmptyString,
    requireStringArray,
    uniqueValues,
} from "../../../Shared/utils/validation";

const PRIVILEGED_TEAM_ROLES = ["owner", "admin"];
const NAME_MAX = 120;
const DESCRIPTION_MAX = 2000;

export interface CreateProjectInput {
    name: unknown;
    description?: unknown;
    team_id: unknown;
    status?: unknown;
    start_date?: unknown;
    due_date?: unknown;
    member_ids?: unknown;
}

export interface UpdateProjectInput {
    name?: unknown;
    description?: unknown;
    status?: unknown;
    start_date?: unknown;
    due_date?: unknown;
    member_ids?: unknown;
    team_id?: unknown;
}

function parseStatus(value: unknown, fallback: ProjectStatus | undefined): ProjectStatus | undefined {
    if (value === undefined) return fallback;
    if (!isProjectStatus(value)) {
        throw new ValidationError("status must be one of: Planning, In Progress, Paused, Completed, Canceled");
    }
    return value;
}

function assertDateOrder(start: Date | null | undefined, due: Date | null | undefined): void {
    if (start instanceof Date && due instanceof Date && start.getTime() > due.getTime()) {
        throw new ValidationError("due_date cannot be before start_date");
    }
}

export class ListProjects {
    constructor(
        private readonly projectRepo: ProjectRepo,
        private readonly memberRepo: TeamMemberRepo,
    ) { }

    async execute(userId: string, teamId?: string | null): Promise<Project[]> {
        if (teamId) {
            const role = await this.memberRepo.getRole(teamId, userId);
            if (role === null) {
                throw new ForbiddenError("You are not a member of this team");
            }
        }
        return this.projectRepo.listForUser(userId, teamId ?? null);
    }
}

export class GetProjectById {
    constructor(private readonly projectRepo: ProjectRepo) { }

    /** Returns the project plus its members; 404 when missing or not accessible (no existence leak). */
    async execute(projectId: string, userId: string): Promise<Project & { members: ProjectMemberDTO[] }> {
        const project = await this.projectRepo.getById(projectId);
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        // ProjectRepo.canAccess already covers project membership and team membership.
        if (!await this.projectRepo.canAccess(projectId, userId)) {
            throw new NotFoundError("Project not found");
        }
        const members = await this.projectRepo.listMembers(projectId);
        return Object.assign(project, { members });
    }
}

export class GetProjectMembers {
    constructor(private readonly projectRepo: ProjectRepo) { }

    /** Project members are the default assignment candidates; 404 when the project is not visible. */
    async execute(projectId: string, userId: string): Promise<ProjectMemberDTO[]> {
        const project = await this.projectRepo.getById(projectId);
        if (!project) {
            throw new NotFoundError("Project not found");
        }
        if (!await this.projectRepo.canAccess(projectId, userId)) {
            throw new NotFoundError("Project not found");
        }
        return this.projectRepo.listMembers(projectId);
    }
}

export class CreateProject {
    constructor(
        private readonly projectRepo: ProjectRepo,
        private readonly memberRepo: TeamMemberRepo,
    ) { }

    async execute(input: CreateProjectInput, actorId: string): Promise<Project> {
        const name = this.parseName(input.name);
        const description = optionalString(input.description, "description", DESCRIPTION_MAX) ?? null;
        const teamId = requireNonEmptyString(input.team_id, "team_id", 64);
        const status = parseStatus(input.status, "Planning") as ProjectStatus;
        const startDate = optionalDate(input.start_date, "start_date") ?? null;
        const dueDate = optionalDate(input.due_date, "due_date") ?? null;
        assertDateOrder(startDate, dueDate);

        const role = await this.memberRepo.getRole(teamId, actorId);
        if (role === null) {
            throw new ForbiddenError("You are not a member of this team");
        }
        if (!PRIVILEGED_TEAM_ROLES.includes(role)) {
            throw new ForbiddenError("Only team owners or admins can create projects");
        }

        const memberIds = await this.resolveTeamMembers(
            teamId,
            requireStringArray(input.member_ids, "member_ids"),
        );

        const project = new Project(name, teamId, description, status, startDate, dueDate);
        return this.projectRepo.create(project, uniqueValues([actorId, ...memberIds]));
    }

    private async resolveTeamMembers(teamId: string, memberIds: string[]): Promise<string[]> {
        const validated: string[] = [];
        for (const memberId of uniqueValues(memberIds)) {
            const role = await this.memberRepo.getRole(teamId, memberId);
            if (role === null) {
                throw new ValidationError("Every project member must belong to the project's team");
            }
            validated.push(memberId);
        }
        return validated;
    }

    private parseName(value: unknown): string {
        try {
            return requireNonEmptyString(value, "name", NAME_MAX);
        } catch (error) {
            throw new ValidationError((error as Error).message);
        }
    }
}

export class UpdateProject {
    constructor(
        private readonly projectRepo: ProjectRepo,
        private readonly memberRepo: TeamMemberRepo,
    ) { }

    async execute(projectId: string, input: UpdateProjectInput, actorId: string): Promise<Project> {
        const existing = await this.projectRepo.getById(projectId);
        if (!existing) {
            throw new NotFoundError("Project not found");
        }
        if (!existing.team_id) {
            throw new ForbiddenError("Project is not attached to a team");
        }
        const role = await this.memberRepo.getRole(existing.team_id, actorId);
        if (role === null || !PRIVILEGED_TEAM_ROLES.includes(role)) {
            throw new ForbiddenError("Only team owners or admins can update projects");
        }

        // Team is immutable: moving a project would orphan its tasks and memberships.
        if (input.team_id !== undefined && input.team_id !== existing.team_id) {
            throw new ValidationError("team_id cannot be changed");
        }

        const project = new Project(
            input.name === undefined
                ? existing.name
                : requireNonEmptyString(input.name, "name", NAME_MAX),
            existing.team_id,
            input.description === undefined
                ? existing.description
                : optionalString(input.description, "description", DESCRIPTION_MAX) ?? null,
            input.status === undefined
                ? existing.status
                : parseStatus(input.status, existing.status) as ProjectStatus,
            input.start_date === undefined
                ? existing.start_date
                : optionalDate(input.start_date, "start_date") ?? null,
            input.due_date === undefined
                ? existing.due_date
                : optionalDate(input.due_date, "due_date") ?? null,
            existing.id,
            existing.created_at,
            new Date(),
        );
        assertDateOrder(project.start_date, project.due_date);

        let memberIds: string[] | null = null;
        if (input.member_ids !== undefined) {
            const requested = uniqueValues(requireStringArray(input.member_ids, "member_ids"));
            for (const memberId of requested) {
                const memberRole = await this.memberRepo.getRole(existing.team_id, memberId);
                if (memberRole === null) {
                    throw new ValidationError("Every project member must belong to the project's team");
                }
            }
            memberIds = uniqueValues([actorId, ...requested]);
        }

        const updated = await this.projectRepo.update(project, memberIds);
        if (!updated) {
            throw new NotFoundError("Project not found");
        }
        return updated;
    }
}

export class DeleteProject {
    constructor(
        private readonly projectRepo: ProjectRepo,
        private readonly memberRepo: TeamMemberRepo,
    ) { }

    async execute(projectId: string, actorId: string): Promise<void> {
        const existing = await this.projectRepo.getById(projectId);
        if (!existing) {
            throw new NotFoundError("Project not found");
        }
        if (!existing.team_id) {
            throw new ForbiddenError("Project is not attached to a team");
        }
        const role = await this.memberRepo.getRole(existing.team_id, actorId);
        if (role === null || !PRIVILEGED_TEAM_ROLES.includes(role)) {
            throw new ForbiddenError("Only team owners or admins can delete projects");
        }
        const deleted = await this.projectRepo.delete(projectId);
        if (!deleted) {
            throw new NotFoundError("Project not found");
        }
    }
}
