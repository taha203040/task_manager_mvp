import { Pool } from "pg";
import { User } from "../../../Domain/Entities/User_Entities";
import { UserRep } from "../../../Domain/Repositories/UserRepository";
import { FileRepo } from "../../../Domain/Repositories/UploadFileRepo";
import { File } from "../../../Domain/Entities/File_Entities";

export class UserRepoPostgress implements UserRep {
    constructor(private pool: Pool) {
    }
    async create(user: User) {
        await this.pool.query("INSERT INTO users (email , password) VALUES ($1,$2)", [user.email, user.password])
    }
    async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query("SELECT * FROM users WHERE email = $1", [email])
        return result.rows[0] || null
    }
}
export class FileRepoPostgres implements FileRepo {
    constructor(private pool: Pool) { }
    async upload(file: File): Promise<void> {
        await this.pool.query('INSERT INTO files (id , name , mime_type , size , owner_id , created_at , updated_at  ) VALUES ($1, $2, $3, $4, $5, $6, $7) ', [
            file.id,
            file.name,
            file.mimeType,
            file.size,
            file.ownerId,
            file.created_at,
            file.updated_at

        ])
    }
    async getFile(file: string): Promise<File | null> {
        const res = await this.pool.query(`SELECT * FROM files WHERE id = $1`, [file]);
        if (res.rows.length === 0) return null;

        const row = res.rows[0];
        return new File(
            row.id,
            row.name,
            row.mime_type,
            row.size,
            row.owner_id,
            row.created_at,
            row.updated_at
        );
    }
    async getFiles(): Promise<{ id: string; name: string }[]> {
        const res = await this.pool.query(`SELECT id , name FROM files`)
        return res.rows.map((row: { id: string; name: string }) => ({
            id: row.id,
            name: row.name
        }));
    }
}



