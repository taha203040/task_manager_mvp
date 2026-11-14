import { loadConfig } from "../../../Config/envs";

const VALID_ENV = {
    JWT_SECRET: "a".repeat(32),
    DATABASE_URL: "postgres://user:pass@localhost:5432/task",
};

describe("TM-06 configuration fails closed at boot", () => {
    it("throws when DATABASE_URL is missing", () => {
        expect(() => loadConfig({ ...VALID_ENV, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
    });

    it("throws when JWT_SECRET is missing", () => {
        expect(() => loadConfig({ ...VALID_ENV, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
    });

    it("throws when a required value is blank rather than absent", () => {
        expect(() => loadConfig({ ...VALID_ENV, DATABASE_URL: "   " })).toThrow(/DATABASE_URL/);
    });

    it("throws when JWT_SECRET is shorter than 32 characters", () => {
        expect(() => loadConfig({ ...VALID_ENV, JWT_SECRET: "a".repeat(31) })).toThrow(/32/);
    });

    it("rejects a non-integer or out-of-range proxy hop count", () => {
        expect(() => loadConfig({ ...VALID_ENV, TRUST_PROXY_HOPS: "abc" })).toThrow(/TRUST_PROXY_HOPS/);
        expect(() => loadConfig({ ...VALID_ENV, TRUST_PROXY_HOPS: "9" })).toThrow(/TRUST_PROXY_HOPS/);
    });

    it("loads without any CORS configuration", () => {
        // The deployment is single-origin, so no CORS variable is part of the contract.
        expect(() => loadConfig({ ...VALID_ENV })).not.toThrow();
    });

    it("applies documented defaults for optional values", () => {
        const config = loadConfig({ ...VALID_ENV });
        expect(config.app.port).toBe(4000);
        expect(config.app.trustProxyHops).toBe(1);
        expect(config.jwt.expiresIn).toBe("1h");
        expect(config.db.ssl).toBe(false);
    });

    it("parses explicit overrides", () => {
        const config = loadConfig({
            ...VALID_ENV,
            PORT: "3000",
            TRUST_PROXY_HOPS: "0",
            DATABASE_SSL: "true",
        });
        expect(config.app.port).toBe(3000);
        expect(config.app.trustProxyHops).toBe(0);
        expect(config.db.ssl).toBe(true);
    });
});
