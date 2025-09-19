import { Pool } from "pg";
import { User } from "../../../Domain/Entities/User_Entities";
import { UserRep } from "../../../Application/Repositories/UserRepository";

import { TaskRepo } from "../../../Application/Repositories/Task_Repo";
import { Task } from "../../../Domain/Entities/Task";
export class UserRepoPostgress implements UserRep {
    constructor(private pool: Pool) {
    }
    async create(user: User) {
        await this.pool.query("INSERT INTO users (email , password , roles) VALUES ($1,$2)", [user.email, user.password, user.role])
    }
    async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query("SELECT * FROM users WHERE email = $1", [email])
        return result.rows[0] || null
    }
}
