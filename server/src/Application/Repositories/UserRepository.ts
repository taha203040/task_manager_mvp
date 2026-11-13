import { ProfileUpdate, User } from '../../Domain/Entities/User_Entities'
export interface UserRep {
    create(user: User): Promise<void>
    findByEmail(email: string): Promise<User | null>
    findById(id: string): Promise<User | null>
    existsByUsername(username: string, excludeUserId?: string): Promise<boolean>
    /** Updates only the provided fields of one user; returns the refreshed row. */
    updateProfile(userId: string, update: ProfileUpdate): Promise<User | null>
    /** Increments the failed-login streak and stamps the time of the last failure. */
    recordFailedLogin(userId: string): Promise<void>
    /** Clears the failed-login streak after a successful authentication. */
    resetFailedLogins(userId: string): Promise<void>
}
export type { ProfileUpdate, PublicProfile } from '../../Domain/Entities/User_Entities'
