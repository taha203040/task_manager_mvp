import { User } from '../Entities/User_Entities'
export interface UserRep {
    create(user: User): Promise<void>
    findByEmail(email: string): Promise<User | null>
}