export class TeamInvite {
    id: string;
    team_id: string;
    invited_user_id: string;
    role: string;
    invited_by: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;
    expires_at: Date | null;

    constructor(data: Partial<TeamInvite> = {}) {
        this.id = data.id || '';
        this.team_id = data.team_id || '';
        this.invited_user_id = data.invited_user_id || '';
        this.role = data.role || '';
        this.invited_by = data.invited_by || '';
        this.status = data.status || 'pending';
        this.created_at = data.created_at || new Date();
        this.expires_at = data.expires_at ?? null;
    }

    isExpired(now: Date = new Date()): boolean {
        if (!this.expires_at) return false;
        return new Date(this.expires_at).getTime() <= now.getTime();
    }
}

export interface InvitationWithTeamDTO {
    id: string;
    role: string;
    status: string;
    invited_by: string;
    team: {
        id: string;
        name: string;
    };
}
