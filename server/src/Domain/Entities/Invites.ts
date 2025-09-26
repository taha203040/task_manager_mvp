export class TeamInvite {
    id: string;
    team_id: string;
    invited_user_email: string;
    role: string;
    invited_by: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: Date;

    constructor(data: Partial<TeamInvite> = {}) {
        this.id = data.id || '';
        this.team_id = data.team_id || '';
        this.invited_user_email = data.invited_user_email || '';
        this.role = data.role || '';
        this.invited_by = data.invited_by || '';
        this.status = data.status || 'pending';
        this.created_at = data.created_at || new Date();
    }
}