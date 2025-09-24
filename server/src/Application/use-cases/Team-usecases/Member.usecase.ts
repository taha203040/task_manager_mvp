import { TeamMember } from "../../../Domain/Entities/Team";
import { TeamMemberRepo } from "../../Repositories/TeamRepo";

export class CreateTeamMemberUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(teamId: string, userId: string, role: string): Promise<void> {
        return this.teamMemberRepo.create(teamId, userId, role);
    }
}

export class GetTeamMembersByTeamIdUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(teamId: string): Promise<TeamMember[]> {
        return this.teamMemberRepo.getByTeamId(teamId);
    }
}

export class GetTeamMembersByUserIdUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(userId: string): Promise<TeamMember[]> {
        return this.teamMemberRepo.getByUserId(userId);
    }
}

export class UpdateTeamMemberRoleUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(teamId: string, userId: string, role: string): Promise<void> {
        return this.teamMemberRepo.updateRole(teamId, userId, role);
    }
}

export class DeleteTeamMemberUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(teamId: string, userId: string): Promise<void> {
        return this.teamMemberRepo.delete(teamId, userId);
    }
}

export class CheckTeamMembershipUseCase {
    constructor(private teamMemberRepo: TeamMemberRepo) {}

    async execute(teamId: string, userId: string): Promise<boolean> {
        return this.teamMemberRepo.isMember(teamId, userId);
    }
}