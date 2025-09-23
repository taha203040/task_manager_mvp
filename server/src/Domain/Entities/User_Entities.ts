export class User {
  constructor(
    public email: string,
    public password: string,
    public username: string,
    public role: string,
    public readonly id?: string,
  ) { }
}