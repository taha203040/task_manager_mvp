import { Pool } from "pg";
import { ProfileUpdate, User } from "../../../Domain/Entities/User_Entities";
import { UserRep } from "../../../Application/Repositories/UserRepository";
import { ConflictError } from "../../../Domain/Errors/AppError";

function mapRow(row: any): User {
    return new User(
        row.email,
        row.password,
        row.username,
        row.role,
        row.id,
        row.bio ?? null,
        row.avatar ?? null,
    );
}

export class UserRepoPostgress implements UserRep {
    constructor(private pool: Pool) {
    }

    async create(user: User) {
        await this.pool.query("INSERT INTO users (email , password , role , username ) VALUES ($1 , $2 , $3 , $4)", [user.email, user.password, user.role, user.username])
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query("SELECT * FROM users WHERE email = $1", [email])
        return result.rows[0] ? mapRow(result.rows[0]) : null
    }

    async findById(id: string): Promise<User | null> {
        const result = await this.pool.query("SELECT * FROM users WHERE id = $1", [id])
        return result.rows[0] ? mapRow(result.rows[0]) : null
    }

    async existsByUsername(username: string, excludeUserId?: string): Promise<boolean> {
        const result = await this.pool.query(
            `SELECT 1 FROM users
             WHERE username = $1
               AND ($2::uuid IS NULL OR id <> $2::uuid)`,
            [username, excludeUserId ?? null],
        );
        return result.rows.length > 0;
    }

    async updateProfile(userId: string, update: ProfileUpdate): Promise<User | null> {
        const assignments: string[] = [];
        const params: unknown[] = [];

        // Explicit allowlist: only these three columns can ever be written.
        if (update.username !== undefined) {
            params.push(update.username);
            assignments.push(`username = $${params.length}`);
        }
        if (update.bio !== undefined) {
            params.push(update.bio);
            assignments.push(`bio = $${params.length}`);
        }
        if (update.avatar !== undefined) {
            params.push(update.avatar);
            assignments.push(`avatar = $${params.length}`);
        }
        if (assignments.length === 0) {
            return null;
        }

        params.push(userId);
        try {
            const result = await this.pool.query(
                `UPDATE users SET ${assignments.join(", ")} WHERE id = $${params.length} RETURNING *`,
                params,
            );
            return result.rows[0] ? mapRow(result.rows[0]) : null;
        } catch (error) {
            if ((error as { code?: string }).code === "23505") {
                throw new ConflictError("Username is already taken");
            }
            throw error;
        }
    }
}
