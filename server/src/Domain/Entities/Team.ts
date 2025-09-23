export class Team {
  constructor(
    public readonly id: string,
    public name: string = '',
    public created_by: string,
    public description?: string | null,
    public readonly created_at?: Date | null,
  ) { }
}