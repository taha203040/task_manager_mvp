import { Team, TeamMember } from "../../Domain/Entities/Team";

export interface TeamRepo {
    create(team: Team): Promise<void>;
    getTeamsByUser(userId: string): Promise<Team[]>;
    getById(id: string, userId: string): Promise<Team | null>;
    delete(id: string, userId: string): Promise<void>;
    update(team: Team, userId: string): Promise<void>;
}
export interface TeamMemberRepo {
    create(teamId: string, userId: string, role: string): Promise<void>;
    getByTeamId(teamId: string): Promise<TeamMember[]>;
    getByUserId(userId: string): Promise<TeamMember[]>;
    updateRole(teamId: string, userId: string, role: string): Promise<void>;
    delete(teamId: string, userId: string): Promise<void>;
    isMember(teamId: string, userId: string): Promise<boolean>;
}