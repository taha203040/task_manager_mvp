import { TeamMemberRepo } from "../../Repositories/TeamRepo";
import { TEAM_MANAGER_ROLES, TeamRole, isTeamRole } from "../../../Domain/Entities/Team";
import { ForbiddenError } from "../../../Domain/Errors/AppError";

/**
 * Single source of truth for team-level authorization.
 * Every use case that touches team resources goes through this guard so the rules
 * cannot drift between modules (members, invitations, project creation).
 */
export class TeamAuthorization {
    constructor(private readonly memberRepo: TeamMemberRepo) { }

    /** Resolved role, or null when the user has no access to the team. */
    async getRole(teamId: string, userId: string): Promise<TeamRole | null> {
        const role = await this.memberRepo.getRole(teamId, userId);
        return isTeamRole(role) ? role : null;
    }

    /** Any team member (owner, admin or member). Viewing rights. */
    async assertMember(teamId: string, userId: string): Promise<TeamRole> {
        const role = await this.getRole(teamId, userId);
        if (role === null) {
            throw new ForbiddenError("You are not a member of this team");
        }
        return role;
    }

    /** Owner or admin. Management rights (members, invitations). */
    async assertManager(teamId: string, userId: string): Promise<TeamRole> {
        const role = await this.assertMember(teamId, userId);
        if (!TEAM_MANAGER_ROLES.includes(role)) {
            throw new ForbiddenError("Only team owners or admins can manage this team");
        }
        return role;
    }

    /** Owner only (destructive or ownership-changing actions). */
    async assertOwner(teamId: string, userId: string): Promise<TeamRole> {
        const role = await this.assertMember(teamId, userId);
        if (role !== "owner") {
            throw new ForbiddenError("Only the team owner can perform this action");
        }
        return role;
    }
}
