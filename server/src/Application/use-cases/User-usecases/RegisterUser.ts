import { User } from "../../../Domain/Entities/User_Entities";
import type { UserRep } from "../../Repositories/UserRepository";
import bcrypt from "bcrypt";

export class RegistserUser {
    constructor(private userrepo: UserRep) {
    }
    async execute(email: string, password: string, username: string, Role: string) {
        const existing = await this.userrepo.findByEmail(email)
        if (existing) {
            throw new Error('User already Exists')
        }
        const hashed = await bcrypt.hash(password, 10)
        const user: User = new User(email, hashed, username, Role)
        await this.userrepo.create(user)
    }
}

