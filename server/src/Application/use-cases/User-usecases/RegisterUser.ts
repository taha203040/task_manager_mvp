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
        // Self-registration always creates a plain USER: the `Role` argument comes
        // from the request body, so honouring it would let anyone register as ADMIN.
        const user: User = new User(email, hashed, username, "USER")
        await this.userrepo.create(user)
    }
}

