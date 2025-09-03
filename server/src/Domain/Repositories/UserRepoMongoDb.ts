import type { User } from "../Entities/User_Entities";
import type { UserRep } from "./UserRepository";
import { Collection, Db } from "mongodb"

export class UserRepoMongo implements UserRep {
    private collection: Collection<User>
    constructor(db: Db) {
        this.collection = db.collection<User>("users")
    }
    async create(user: User): Promise<void> {
        await this.collection.insertOne(user)
    }
    async findByEmail(email: string): Promise<User | null> {
        return this.collection.findOne({ email })
    }
  
}
