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
    findByUserId(email: string): Promise<TeamInvite[]>;
    findPendingInvite(teamId: string, email: string): Promise<TeamInvite | null>; // optional but recommended
    updateStatus(id: string, status: InviteStatus): Promise<TeamInvite | null>;
    delete(id: string): Promise<boolean>;
}
