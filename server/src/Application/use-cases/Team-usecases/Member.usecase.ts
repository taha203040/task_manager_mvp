import { Team, TeamMember, TeamRole, isTeamRole } from "../../../Domain/Entities/Team";
import { TeamMemberRepo, TeamRepo } from "../../Repositories/TeamRepo";
import { MemberSearchResult } from "../../../Domain/Entities/User_Entities";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../../Domain/Errors/AppError";
import { TeamAuthorization } from "./TeamAuthorization";

export class CreateTeamMemberUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(teamId: string, userId: string, role: string): Promise<void> {
        return this.teamMemberRepo.create(teamId, userId, role);
    }
}
export class SearchUsersUsecase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    /**
     * Case-insensitive directory search over username/email.
     * An empty query returns nothing (no directory dump); the result set is capped.
     */
    async execute(searchTerm: unknown, limit: number = 20): Promise<MemberSearchResult[]> {
        if (searchTerm === undefined || searchTerm === null) {
            return [];
        }
        if (typeof searchTerm !== "string") {
            throw new ValidationError("q must be a single string");
        }
        const term = searchTerm.trim();
        if (term.length === 0) {
            return [];
        }
        if (term.length > 100) {
            throw new ValidationError("q must be at most 100 characters");
        }
        const cappedLimit = Math.min(Math.max(limit, 1), 20);
        return this.teamMemberRepo.searchUsers(term, cappedLimit);
    }
}

/** One team's members. Bounded query; never fetch members for a list of teams. */
export class GetTeamMembersByTeamIdUseCase {
    private readonly auth: TeamAuthorization;

    constructor(private teamMemberRepo: TeamMemberRepo) {
        this.auth = new TeamAuthorization(teamMemberRepo);
    }

    async execute(teamId: string, actorId: string): Promise<TeamMember[]> {
        await this.auth.assertMember(teamId, actorId);
        return this.teamMemberRepo.getByTeamId(teamId);
    }
}

export class GetTeamMembersByUserIdUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    /** A user may only read their own memberships (no BOLA on another user's teams). */
    async execute(userId: string, actorId: string): Promise<TeamMember[]> {
        if (userId !== actorId) {
            throw new ForbiddenError("You can only view your own team memberships");
        }
        return this.teamMemberRepo.getByUserId(userId);
    }
}

export class UpdateTeamMemberRoleUseCase {
    private readonly auth: TeamAuthorization;

    constructor(private teamMemberRepo: TeamMemberRepo, private teamRepo: TeamRepo) {
        this.auth = new TeamAuthorization(teamMemberRepo);
    }

    async execute(teamId: string, targetUserId: string, role: unknown, actorId: string): Promise<void> {
        const actorRole = await this.auth.assertManager(teamId, actorId);

        if (!isTeamRole(role)) {
            throw new ValidationError("role must be one of: owner, admin, member");
        }

        const currentRole = await this.auth.getRole(teamId, targetUserId);
        if (currentRole === null) {
            throw new NotFoundError("Team member not found");
        }

        // Self-service role changes are never allowed (blocks self escalation).
        if (targetUserId === actorId) {
            throw new ForbiddenError("You cannot change your own role");
        }

        const creatorId = await this.teamRepo.getCreatedBy(teamId);
        if (creatorId === null) {
            throw new NotFoundError("Team not found");
        }
        // Ownership is anchored on teams.created_by, so the creator's row is immutable.
        if (creatorId === targetUserId) {
            throw new ValidationError("The team creator's role cannot be changed");
        }

        if (actorRole === "admin") {
            if (role === "owner") {
                throw new ForbiddenError("Only an owner can grant the owner role");
            }
            if (currentRole === "owner") {
                throw new ForbiddenError("Only an owner can change another owner's role");
            }
        }

        if (currentRole === "owner" && role !== "owner") {
            const owners = await this.teamMemberRepo.countOwners(teamId);
            if (owners <= 1) {
                throw new ConflictError("A team must keep at least one owner");
            }
        }

        if (currentRole === role) {
            return; // already in the requested state
        }
        await this.teamMemberRepo.updateRole(teamId, targetUserId, role);
    }
}

export class DeleteTeamMemberUseCase {
    private readonly auth: TeamAuthorization;

    constructor(private teamMemberRepo: TeamMemberRepo, private teamRepo: TeamRepo) {
        this.auth = new TeamAuthorization(teamMemberRepo);
    }

    async execute(teamId: string, targetUserId: string, actorId: string): Promise<void> {
        // Managers can remove others; a member may always leave the team themselves.
        let actorRole: TeamRole | null = null;
        if (targetUserId !== actorId) {
            actorRole = await this.auth.assertManager(teamId, actorId);
        }

        const currentRole = await this.auth.getRole(teamId, targetUserId);
        if (currentRole === null) {
            throw new NotFoundError("Team member not found");
        }

        const creatorId = await this.teamRepo.getCreatedBy(teamId);
        if (creatorId === null) {
            throw new NotFoundError("Team not found");
        }
        if (creatorId === targetUserId) {
            throw new ConflictError("The team creator cannot be removed from the team");
        }

        if (currentRole === "owner") {
            if (actorRole === "admin") {
                throw new ForbiddenError("Only an owner can remove another owner");
            }
            const owners = await this.teamMemberRepo.countOwners(teamId);
            if (owners <= 1) {
                throw new ConflictError("A team must keep at least one owner");
            }
        }

        await this.teamMemberRepo.delete(teamId, targetUserId);
    }
}

export class CheckTeamMembershipUseCase {
    private readonly auth: TeamAuthorization;

    constructor(private teamMemberRepo: TeamMemberRepo) {
        this.auth = new TeamAuthorization(teamMemberRepo);
    }

    async execute(teamId: string, userId: string, actorId: string): Promise<boolean> {
        if (userId !== actorId) {
            await this.auth.assertMember(teamId, actorId);
        }
        return (await this.auth.getRole(teamId, userId)) !== null;
    }
}
