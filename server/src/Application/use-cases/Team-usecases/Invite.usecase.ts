import { TeamInvite } from "../../../Domain/Entities/Invites";
import { ITeamInviteRepository } from "../../Repositories/Team_invites";
// import { TeamInvite } from "../../../Domain/Entities/Invites";
// import { ITeamInviteRepository } from "../../Repositories/Team_invites";
import { InviteStatus } from "../../Repositories/Team_invites";

export class CreateInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}

    async execute(inviteData: {
        teamId: string;
        invitedUserId: string;
        role: string;
        invitedBy: string;
    }): Promise<TeamInvite> {
        const existingInvite = await this.inviteRepository.findPendingInvite(
            inviteData.teamId, 
            inviteData.invitedUserId
        );

        if (existingInvite) {
            throw new Error('A pending invite already exists for this user and team');
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
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(id: string): Promise<TeamInvite | null> {
        return await this.inviteRepository.findById(id);
    }
}

export class GetInvitesByTeamIdUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(teamId: string): Promise<TeamInvite[]> {
        return await this.inviteRepository.findByTeamId(teamId);
    }
}

export class GetInvitesByUserIdUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(userId: string): Promise<TeamInvite[]> {
        return await this.inviteRepository.findByUserId(userId);
    }
}

export class AcceptInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(inviteId: string): Promise<TeamInvite | null> {
        const invite = await this.inviteRepository.findById(inviteId);
        
        if (!invite) {
            throw new Error('Invite not found');
        }

        if (invite.status !== 'pending') {
            throw new Error('Invite is no longer pending');
        }

        return await this.inviteRepository.updateStatus(inviteId, InviteStatus.ACCEPTED);
    }
}

export class RejectInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(inviteId: string): Promise<TeamInvite | null> {
        const invite = await this.inviteRepository.findById(inviteId);
        
        if (!invite) {
            throw new Error('Invite not found');
        }

        if (invite.status !== 'pending') {
            throw new Error('Invite is no longer pending');
        }

        return await this.inviteRepository.updateStatus(inviteId, InviteStatus.REJECTED);
    }
}

export class DeleteInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(inviteId: string): Promise<boolean> {
        return await this.inviteRepository.delete(inviteId);
    }
}

export class GetPendingInviteUseCase {
    constructor(private readonly inviteRepository: ITeamInviteRepository) {}
    async execute(teamId: string, userId: string): Promise<TeamInvite | null> {
        return await this.inviteRepository.findPendingInvite(teamId, userId);
    }
}