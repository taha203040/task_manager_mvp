import { JwtPayloadEntity } from "../Entities/Jwt";

// Jwt.ts
export interface JwtRepo {
    generate(payload: JwtPayloadEntity, expiresIn?: string): Promise<string>;
    validate(token: string): Promise<Record<string, unknown> | null>;
    sign(payload: JwtPayloadEntity, secret: string): Promise<string | null> // متزامنة
    decode(token: string): Promise<Record<string, unknown> | null>;
    invalidate(token: string): Promise<boolean>;
}
