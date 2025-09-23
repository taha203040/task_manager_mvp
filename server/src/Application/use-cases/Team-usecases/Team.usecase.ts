import { Team } from "../../../Domain/Entities/Team";
import { TeamRepo } from "../../Repositories/TeamRepo";

export class CreateTeam {
    constructor(private teamRepo: TeamRepo) { }
    async execute(team: Team): Promise<void> {
        await this.teamRepo.create(team);
    }
}

export class GetTeamsByUser {
    constructor(private teamRepo: TeamRepo) { }
    async execute(userId: string): Promise<Team[]> {
        return await this.teamRepo.getTeamsByUser(userId);
    }
}

export class GetTeamById {
    constructor(private teamRepo: TeamRepo) { }
    async execute(id: string, userId: string): Promise<Team | null> {
        return await this.teamRepo.getById(id, userId);
    }
}

export class DeleteTeam {
    constructor(private teamRepo: TeamRepo) { }
    async execute(id: string, userId: string): Promise<void> {
        await this.teamRepo.delete(id, userId);
    }
}

export class UpdateTeam {
    constructor(private teamRepo: TeamRepo) { }
    async execute(team: Team, userId: string): Promise<void> {
        await this.teamRepo.update(team, userId);
    }
}
