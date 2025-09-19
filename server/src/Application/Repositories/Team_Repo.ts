import { Team } from "../../Domain/Entities/Team";

export interface TeamRepo {
    // Create a new team
    create(team: Team): Promise<void>;

    // Get all teams for a specific user (teams where user is a member)
    getTeamsByUser(userId: string): Promise<Team[]>;

    // Get team by ID
    getById(id: string): Promise<Team | null>;

    // Update team information
    update(team: Team): Promise<void>;

    // Add member to team
    addMember(teamId: string, userId: string): Promise<void>;

    // Remove member from team
    removeMember(teamId: string, userId: string): Promise<void>;

    // Delete team
    delete(id: string): Promise<void>;
}