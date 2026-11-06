export class User {
  constructor(
    public email: string,
    public password: string,
    public username: string,
    public role?: string,
    public readonly id?: string,
    public bio: string | null = null,
    public avatar: string | null = null,
  ) { }
}

/** Public projection of a user: never exposes password hashes or internal fields. */
export interface PublicProfile {
  user_id: string;
  username: string;
  email: string;
  bio: string | null;
  avatar: string | null;
}

/** Minimal, non-sensitive user projection returned by member search. */
export interface MemberSearchResult {
  user_id: string;
  username: string;
  email: string;
  avatar: string | null;
}

export interface ProfileUpdate {
  username?: string;
  bio?: string | null;
  avatar?: string | null;
}