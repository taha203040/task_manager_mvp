import { ProfileUpdate, User } from '../../Domain/Entities/User_Entities'
export interface UserRep {
    create(user: User): Promise<void>
    findByEmail(email: string): Promise<User | null>
    findById(id: string): Promise<User | null>
    existsByUsername(username: string, excludeUserId?: string): Promise<boolean>
    /** Updates only the provided fields of one user; returns the refreshed row. */
    updateProfile(userId: string, update: ProfileUpdate): Promise<User | null>
}
export type { ProfileUpdate, PublicProfile } from '../../Domain/Entities/User_Entities'
