import type { ProfileUpdate, User } from "../../Domain/Entities/User_Entities";
import type { UserRep } from "./UserRepository";
import { Collection, Db, ObjectId } from "mongodb"

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
    async findById(id: string): Promise<User | null> {
        const objectId = UserRepoMongo.toObjectId(id)
        if (!objectId) return null
        return this.collection.findOne({ _id: objectId } as any)
    }
    async existsByUsername(username: string, excludeUserId?: string): Promise<boolean> {
        const filter: Record<string, unknown> = { username }
        const objectId = excludeUserId ? UserRepoMongo.toObjectId(excludeUserId) : null
        if (objectId) {
            filter["_id"] = { $ne: objectId }
        }
        const found = await this.collection.findOne(filter as any)
        return found !== null
    }
    async updateProfile(userId: string, update: ProfileUpdate): Promise<User | null> {
        const objectId = UserRepoMongo.toObjectId(userId)
        if (!objectId) return null
        const set: Record<string, unknown> = {}
        if (update.username !== undefined) set["username"] = update.username
        if (update.bio !== undefined) set["bio"] = update.bio
        if (update.avatar !== undefined) set["avatar"] = update.avatar
        if (Object.keys(set).length === 0) return null
        return this.collection.findOneAndUpdate(
            { _id: objectId } as any,
            { $set: set },
            { returnDocument: "after" },
        )
    }
    async recordFailedLogin(userId: string): Promise<void> {
        const objectId = UserRepoMongo.toObjectId(userId)
        if (!objectId) return
        await this.collection.updateOne(
            { _id: objectId } as any,
            { $inc: { failedLoginCount: 1 }, $set: { lastFailedLoginAt: new Date() } } as any,
        )
    }
    async resetFailedLogins(userId: string): Promise<void> {
        const objectId = UserRepoMongo.toObjectId(userId)
        if (!objectId) return
        await this.collection.updateOne(
            { _id: objectId } as any,
            { $set: { failedLoginCount: 0, lastFailedLoginAt: null } } as any,
        )
    }
    private static toObjectId(id: string): ObjectId | null {
        try {
            return new ObjectId(id)
        } catch {
            return null
        }
    }
}
