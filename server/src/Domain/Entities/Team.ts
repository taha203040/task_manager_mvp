/**
 * Authoritative team role set. Lowercase, matching the team_members.role CHECK constraint.
 * Single definition shared by Application and Infrastructure (no capitalised variants anywhere).
 */
export type TeamRole = 'owner' | 'admin' | 'member';

export const TEAM_ROLES: readonly TeamRole[] = ['owner', 'admin', 'member'];

/** Roles allowed to manage a team: members, invitations, projects. */
export const TEAM_MANAGER_ROLES: readonly TeamRole[] = ['owner', 'admin'];

export function isTeamRole(value: unknown): value is TeamRole {
  return typeof value === 'string' && (TEAM_ROLES as readonly string[]).includes(value);
}

export class Team {
  constructor(
    public name: string = '',
    public created_by: string,
    public description?: string | null,
    public readonly id?: string,
    public readonly created_at?: Date | null,
  ) { }
}

export class TeamMember {
  constructor(
    public username: string | null,
    public readonly team_id: string,
    public readonly user_id: string,
    public role: TeamRole = 'member',
    public readonly joined_at?: Date | null,
  ) { }
}
