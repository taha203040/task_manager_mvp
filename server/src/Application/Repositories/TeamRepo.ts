import { InvitationWithTeamDTO } from "../../Domain/Entities/Invites";
import { Team, TeamMember } from "../../Domain/Entities/Team";
import { MemberSearchResult } from "../../Domain/Entities/User_Entities";

export interface TeamRepo {
    /**
     * Creates the team AND registers its creator as OWNER in team_members,
     * both inside one transaction. Returns the stored team (database-generated id).
     * The owner is taken from team.created_by, never from a separate client value.
     */
    create(team: Team): Promise<Team>;
    /** Teams created by the user plus teams where the user has a real membership (deduplicated). */
    getTeamsByUser(userId: string): Promise<Team[]>;
    /** Team readable by its creator or an actual member; null otherwise. */
    getById(id: string, userId: string): Promise<Team | null>;
    /** Ownership anchor (teams.created_by); null when the team does not exist. */
    getCreatedBy(id: string): Promise<string | null>;
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
    /**
     * Role of the user inside the team: 'owner' | 'admin' | 'member'.
     * TEMPORARY COMPATIBILITY SHIM: a team creator still resolves to 'owner' when their
     * membership row is missing. Migration 007_team_ownership.sql backfills those rows,
     * after which this fallback can be removed.
     */
    getRole(teamId: string, userId: string): Promise<string | null>;
    /** Number of explicit 'owner' memberships (used to protect the last owner). */
    countOwners(teamId: string): Promise<number>;
    getByUserIdWithTeam(userId: string): Promise<InvitationWithTeamDTO[]>;
    searchUsers(searchTerm: string, limit: number): Promise<MemberSearchResult[]>
}
