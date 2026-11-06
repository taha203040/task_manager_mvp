import { TeamInvite } from "../../../Domain/Entities/Invites";
import { ITeamInviteRepository } from "../../Repositories/Team_invites";
import { InviteStatus } from "../../Repositories/Team_invites";
import { TeamMemberRepo } from "../../Repositories/TeamRepo";
import { UserRep } from "../../Repositories/UserRepository";
import { isTeamRole } from "../../../Domain/Entities/Team";
import {
    ConflictError,
    ForbiddenError,
    NotFoundError,
    ValidationError,
} from "../../../Domain/Errors/AppError";
import { TeamAuthorization } from "./TeamAuthorization";

/** Roles an invite may carry. 'owner' is intentionally excluded: ownership cannot be granted by invite. */
const INVITABLE_ROLES = ["admin", "member"];

export class CreateInviteUseCase {
    private readonly auth: TeamAuthorization;

    constructor(
        private readonly inviteRepository: ITeamInviteRepository,
        private readonly memberRepo: TeamMemberRepo,
        private readonly userRepo: UserRep,
    ) {
        this.auth = new TeamAuthorization(memberRepo);
    }

    async execute(inviteData: {
        teamId: string;
        invitedUserId: string;
        role: string;
        invitedBy: string;
    }): Promise<TeamInvite> {
        if (!isTeamRole(inviteData.role) || !INVITABLE_ROLES.includes(inviteData.role)) {
            throw new ValidationError("role must be 'admin' or 'member'");
        }

        // The inviter always comes from the authenticated session, never from the request body.
        await this.auth.assertManager(inviteData.teamId, inviteData.invitedBy);

        const invitee = await this.userRepo.findById(inviteData.invitedUserId);
        if (!invitee) {
            throw new NotFoundError("Invited user not found");
        }
        // getRole (not isMember) so the legacy creator shim is honoured.
        if (await this.auth.getRole(inviteData.teamId, inviteData.invitedUserId) !== null) {
            throw new ConflictError("User is already a member of this team");
        }

        const existingInvite = await this.inviteRepository.findPendingInvite(
            inviteData.teamId,
            inviteData.invitedUserId,
        );
        if (existingInvite) {
            throw new ConflictError('A pending invite already exists for this user and team');
        }

        const invite = new TeamInvite({
            team_id: inviteData.teamId,
            invited_user_id: inviteData.invitedUserId,
            role: inviteData.role,
            invited_by: inviteData.invitedBy,
            status: 'pending',
            created_at: new Date(),
        });

        return await this.inviteRepository.create(invite);
    }
}

export class GetInviteByIdUseCase {
    private readonly auth: TeamAuthorization;

    constructor(
        private readonly inviteRepository: ITeamInviteRepository,
        memberRepo: TeamMemberRepo,
    ) {
        this.auth = new TeamAuthorization(memberRepo);
    }

    /** Visible to the invitee or to any member of the inviting team; 404 otherwise. */
    async execute(id: string, actorId: string): Promise<TeamInvite | null> {
        const invite = await this.inviteRepository.findById(id);
        if (!invite) {
            return null;
        }
        if (invite.invited_user_id !== actorId) {
            const role = await this.auth.getRole(invite.team_id, actorId);
            if (role === null) {
                throw new NotFoundError("Invite not found");
            }
        }
        return invite;
    }
}

export class GetInvitesByTeamIdUseCase {
    private readonly auth: TeamAuthorization;

    constructor(
        private readonly inviteRepository: ITeamInviteRepository,
        memberRepo: TeamMemberRepo,
    ) {
        this.auth = new TeamAuthorization(memberRepo);
    }

    async execute(teamId: string, actorId: string): Promise<TeamInvite[]> {
        await this.auth.assertMember(teamId, actorId);
        return await this.inviteRepository.findByTeamId(teamId);
    }
}

export class GetInvitesByUserIdUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) { }
    async execute(user_id: string): Promise<TeamInvite[]> {
        return await this.inviteRepository.findByUserId(user_id);
    }
}

export class AcceptInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) { }

    /**
     * Only the intended invitee may accept; the team comes from the invite record.
     * Membership insert and status update happen in one transaction inside the repository.
     * Re-accepting an already accepted invite is idempotent.
     */
    async execute(inviteId: string, actorId: string): Promise<TeamInvite> {
        const invite = await this.inviteRepository.findById(inviteId);
        if (!invite) {
            throw new NotFoundError('Invite not found');
        }
        if (invite.invited_user_id !== actorId) {
            throw new ForbiddenError('This invitation does not belong to you');
        }
        if (invite.status === InviteStatus.ACCEPTED) {
            return invite;
        }
        if (invite.status !== InviteStatus.PENDING) {
            throw new ConflictError('Invite is no longer pending');
        }
        if (invite.isExpired()) {
            throw new ConflictError('Invite has expired');
        }

        const updated = await this.inviteRepository.acceptAsInvitee(inviteId, actorId);
        if (!updated) {
            throw new NotFoundError('Invite not found');
        }
        return updated;
    }
}

export class RejectInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) { }

    async execute(inviteId: string, actorId: string): Promise<TeamInvite> {
        const invite = await this.inviteRepository.findById(inviteId);
        if (!invite) {
            throw new NotFoundError('Invite not found');
        }
        if (invite.invited_user_id !== actorId) {
            throw new ForbiddenError('This invitation does not belong to you');
        }
        if (invite.status === InviteStatus.REJECTED) {
            return invite;
        }
        if (invite.status !== InviteStatus.PENDING) {
            throw new ConflictError('Invite is no longer pending');
        }

        const updated = await this.inviteRepository.updateStatus(inviteId, InviteStatus.REJECTED);
        if (!updated) {
            throw new NotFoundError('Invite not found');
        }
        return updated;
    }
}

export class DeleteInviteUseCase {
    private readonly auth: TeamAuthorization;

    constructor(
        private readonly inviteRepository: ITeamInviteRepository,
        memberRepo: TeamMemberRepo,
    ) {
        this.auth = new TeamAuthorization(memberRepo);
    }

    /** The invitee may withdraw their invite; team owners/admins may revoke it. */
    async execute(inviteId: string, actorId: string): Promise<boolean> {
        const invite = await this.inviteRepository.findById(inviteId);
        if (!invite) {
            return false;
        }
        if (invite.invited_user_id !== actorId) {
            await this.auth.assertManager(invite.team_id, actorId);
        }
        return await this.inviteRepository.delete(inviteId);
    }
}

export class GetPendingInviteUseCase {
    private readonly auth: TeamAuthorization;

    constructor(
        private readonly inviteRepository: ITeamInviteRepository,
        memberRepo: TeamMemberRepo,
    ) {
        this.auth = new TeamAuthorization(memberRepo);
    }

    async execute(teamId: string, userId: string, actorId: string): Promise<TeamInvite | null> {
        if (userId !== actorId) {
            await this.auth.assertMember(teamId, actorId);
        }
        return await this.inviteRepository.findPendingInvite(teamId, userId);
    }
}
