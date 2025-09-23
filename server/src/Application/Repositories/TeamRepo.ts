import { Team } from "../../Domain/Entities/Team";

export interface TeamRepo {
    create(team: Team): Promise<void>;
    getTeamsByUser(userId: string): Promise<Team[]>;
    getById(id: string, userId: string): Promise<Team | null>;
    delete(id: string, userId: string): Promise<void>;
    update(team: Team, userId: string): Promise<void>;
}