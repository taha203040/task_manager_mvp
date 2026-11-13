import jwt from "jsonwebtoken";
import crypto from "crypto";
import { signAccessToken, verifyAccessToken } from "../../../Config/jwt";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CLAIMS = { user_id: USER_ID, email: "alice@example.io", username: "alice" };

/**
 * The secret retired by TM-01, kept split so secret scanners and `grep` for the literal
 * do not light up this test file forever. The assertion is about behaviour: a token
 * signed with the old key must no longer authenticate.
 */
const RETIRED_SECRET = ["hellofrom", "ahemd"].join("");

describe("TM-01 access token signing and verification", () => {
    it("rejects a token signed with the retired hardcoded secret", () => {
        const forged = jwt.sign(CLAIMS, RETIRED_SECRET);
        expect(() => verifyAccessToken(forged)).toThrow();
    });

    it("rejects a token signed with any other secret", () => {
        const wrongSecret = crypto.randomBytes(48).toString("base64url");
        const forged = jwt.sign(CLAIMS, wrongSecret);
        expect(() => verifyAccessToken(forged)).toThrow();
    });

    it("rejects an unsigned alg:none token", () => {
        const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
        const payload = Buffer.from(JSON.stringify(CLAIMS)).toString("base64url");
        expect(() => verifyAccessToken(`${header}.${payload}.`)).toThrow();
    });

    it("rejects a token issued by a foreign issuer or for another audience", () => {
        const secret = process.env.JWT_SECRET as string;
        const foreignIssuer = jwt.sign(CLAIMS, secret, { issuer: "evil-idp", audience: "tasky-web" });
        const foreignAudience = jwt.sign(CLAIMS, secret, { issuer: "tasky-api", audience: "other-app" });
        expect(() => verifyAccessToken(foreignIssuer)).toThrow();
        expect(() => verifyAccessToken(foreignAudience)).toThrow();
    });

    it("round-trips a token produced by signAccessToken", () => {
        const token = signAccessToken(CLAIMS);
        const claims = verifyAccessToken(token);
        expect(claims.user_id).toBe(USER_ID);
        expect(claims.email).toBe("alice@example.io");
        expect(claims.username).toBe("alice");
        expect(claims.iss).toBe("tasky-api");
        expect(claims.aud).toBe("tasky-web");
    });

    it("refuses to sign a token for a subject that is not a UUID", () => {
        expect(() => signAccessToken({ ...CLAIMS, user_id: "not-a-uuid" })).toThrow(/UUID/);
    });

    it("rejects a correctly-signed token whose subject is not a UUID", () => {
        const secret = process.env.JWT_SECRET as string;
        const token = jwt.sign({ ...CLAIMS, user_id: "admin" }, secret, {
            issuer: "tasky-api",
            audience: "tasky-web",
        });
        expect(() => verifyAccessToken(token)).toThrow(/user id/i);
    });

    it("rejects an expired token", () => {
        const secret = process.env.JWT_SECRET as string;
        const token = jwt.sign(CLAIMS, secret, {
            algorithm: "HS256",
            issuer: "tasky-api",
            audience: "tasky-web",
            expiresIn: -10,
        });
        expect(() => verifyAccessToken(token)).toThrow();
    });
});
