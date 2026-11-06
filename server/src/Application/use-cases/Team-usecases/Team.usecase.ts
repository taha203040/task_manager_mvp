import { InvitationWithTeamDTO } from "../../../Domain/Entities/Invites";
import { Team } from "../../../Domain/Entities/Team";
import { TeamMemberRepo, TeamRepo } from "../../Repositories/TeamRepo";
import { ValidationError } from "../../../Domain/Errors/AppError";
import { optionalString, requireNonEmptyString } from "../../../Shared/utils/validation";

const NAME_MAX = 100;
const DESCRIPTION_MAX = 2000;

export class CreateTeam {
    constructor(private teamRepo: TeamRepo) { }

    /**
     * The creator always comes from the authenticated session (never the request body).
     * owner membership is written by the repository inside the same transaction.
     */
    async execute(team: Team): Promise<Team> {
        if (!team.created_by) {
            throw new ValidationError("Team creator is required");
        }

        let name: string;
        let description: string | null;
        try {
            name = requireNonEmptyString(team.name, "name", NAME_MAX);
            description = optionalString(team.description ?? null, "description", DESCRIPTION_MAX) ?? null;
        } catch (error) {
            throw new ValidationError((error as Error).message);
        }

        const toCreate = new Team(name, team.created_by, description, team.id, team.created_at);
        return this.teamRepo.create(toCreate);
    }
}

export class GetTeamsByUser {
    constructor(private teamRepo: TeamRepo) { }
    async execute(userId: string): Promise<Team[]> {
        if (!userId) {
            throw new ValidationError("User ID is required");
        }
        return await this.teamRepo.getTeamsByUser(userId);
    }
}
export class GetInvitesByUserIdUseCase {
    constructor(private invitationRepository: TeamMemberRepo) { }

    async execute(userId: string): Promise<InvitationWithTeamDTO[]> {
        if (!userId) {
            throw new ValidationError("User ID is required");
        }

        return await this.invitationRepository.getByUserIdWithTeam(userId);
    }
}
export class GetTeamById {
    constructor(private teamRepo: TeamRepo) { }
    /** Creator or member may read the team; anyone else gets null (HTTP 404 policy preserved). */
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
