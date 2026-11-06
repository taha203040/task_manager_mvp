import { Project, ProjectMemberDTO } from "../../Domain/Entities/Project";

/**
 * Project persistence contract.
 * Membership is normalized through the `project_members` table, never stored as an array.
 */
export interface ProjectRepo {
    /** Creates the project and its initial memberships inside a single transaction. */
    create(project: Project, memberIds: string[]): Promise<Project>;
    /** Updates scalar fields; when memberIds is provided the membership set is replaced transactionally. */
    update(project: Project, memberIds: string[] | null): Promise<Project | null>;
    getById(id: string): Promise<Project | null>;
    /** Projects of teams the user belongs to (optionally filtered by team), plus projects where the user is a member. */
    listForUser(userId: string, teamId: string | null): Promise<Project[]>;
    delete(id: string): Promise<boolean>;
    /** True when the user may read the project (team member or project member). */
    canAccess(projectId: string, userId: string): Promise<boolean>;
    /** True when the user is an explicit project member. */
    isMember(projectId: string, userId: string): Promise<boolean>;
    listMembers(projectId: string): Promise<ProjectMemberDTO[]>;
}
