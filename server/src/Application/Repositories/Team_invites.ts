import { TeamInvite } from "../../Domain/Entities/Invites";
export enum InviteStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
}

export interface ITeamInviteRepository {
    create(invite: TeamInvite): Promise<TeamInvite>;
    findById(id: string): Promise<TeamInvite | null>;
    findByTeamId(teamId: string): Promise<TeamInvite[]>;
    findByUserId(user_id: string): Promise<TeamInvite[]>;
    findPendingInvite(teamId: string, userId: string): Promise<TeamInvite | null>;
    updateStatus(id: string, status: InviteStatus): Promise<TeamInvite | null>;
    delete(id: string): Promise<boolean>;
    /**
     * Atomically accepts an invite for its invitee: inserts the team membership
     * (idempotently) and flips the invite status inside one transaction.
     * Returns null when the invite no longer exists.
     */
    acceptAsInvitee(inviteId: string, inviteeId: string): Promise<TeamInvite | null>;
}
