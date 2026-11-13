import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import config from "./envs";
import { isUuid } from "../Shared/utils/validation";

/**
 * Single place where access tokens are signed and verified (TM-01).
 * The key comes from validated config only - there is no literal fallback, and a
 * missing/short key fails closed instead of silently signing with a known value.
 */
const ALGORITHM: jwt.Algorithm = "HS256";
const ISSUER = "tasky-api";
const AUDIENCE = "tasky-web";
const MIN_SECRET_LENGTH = 32;

export interface AccessTokenInput {
    user_id: string;
    email: string;
    username: string;
}

export interface AccessTokenClaims extends JwtPayload {
    user_id: string;
    email: string;
    username: string;
}

function getSecret(): string {
    const secret = config.jwt.secret;
    if (typeof secret !== "string" || secret.length < MIN_SECRET_LENGTH) {
        throw new Error("JWT_SECRET is missing or shorter than 32 characters");
    }
    return secret;
}

export function signAccessToken(claims: AccessTokenInput): string {
    if (!isUuid(claims.user_id)) {
        throw new Error("Refusing to sign a token for a subject that is not a UUID");
    }
    const options: SignOptions = {
        algorithm: ALGORITHM,
        // NonNullable because exactOptionalPropertyTypes rejects an `undefined` union here;
        // envs.ts always supplies a value ("1h" by default).
        expiresIn: config.jwt.expiresIn as NonNullable<SignOptions["expiresIn"]>,
        issuer: ISSUER,
        audience: AUDIENCE,
    };
    return jwt.sign(
        { user_id: claims.user_id, email: claims.email, username: claims.username },
        getSecret(),
        options,
    );
}

/**
 * Throws on any invalid token. Callers must translate this into a generic 401 and
 * never echo the underlying error: it distinguishes "expired" from "bad signature",
 * which is useful to an attacker.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
    const decoded = jwt.verify(token, getSecret(), {
        algorithms: [ALGORITHM], // pinned: rejects alg switching and "none"
        issuer: ISSUER,
        audience: AUDIENCE,
    });

    if (typeof decoded !== "object" || decoded === null) {
        throw new Error("Token payload is not an object");
    }

    const claims = decoded as AccessTokenClaims;
    if (typeof claims.user_id !== "string" || !isUuid(claims.user_id)) {
        throw new Error("Token subject is not a valid user id");
    }
    if (typeof claims.email !== "string" || typeof claims.username !== "string") {
        throw new Error("Token payload is incomplete");
    }
    return claims;
}
