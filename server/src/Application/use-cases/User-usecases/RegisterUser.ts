import type { User } from "../../../Domain/Entities/User_Entities";
import type { UserRep } from "../../../Domain/Repositories/UserRepository";
import bcrypt from "bcrypt";

export class RegistserUser {
    constructor(private userrepo: UserRep) {
    }
    async execute(email: string, password: string, username: string) {
        const existing = await this.userrepo.findByEmail(email)
        if (existing) throw new Error('User already Exists')
        const hashed = await bcrypt.hash(password, 10)
        const user: User = {
            id: crypto.randomUUID(),
            password: hashed,
            email: email,
            username: username
        }
        await this.userrepo.create(user)
    }
}

