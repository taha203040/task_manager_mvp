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
    public readonly team_id: string,
    public readonly user_id: string,
    public role: 'owner' | 'admin' | 'member' = 'member',
    public readonly joined_at?: Date | null,
  ) { }
}