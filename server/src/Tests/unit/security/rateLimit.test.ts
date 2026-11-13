import express from "express";
import type { AddressInfo } from "net";
import type { Server } from "http";
import { AUTH_RATE_LIMIT, createAuthLimiter } from "../../../Interfaces/http/middlewares/rateLimiters";

function listen(app: express.Express): Promise<{ server: Server; base: string }> {
    return new Promise((resolve) => {
        const server = app.listen(0, "127.0.0.1", () => {
            const { port } = server.address() as AddressInfo;
            resolve({ server, base: `http://127.0.0.1:${port}` });
        });
    });
}

function close(server: Server): Promise<void> {
    return new Promise((resolve) => {
        server.close(() => resolve());
    });
}

const SIGNIN_BODY = JSON.stringify({ email: "nobody@example.com", password: "wrong-password" });
const SIGNIN_INIT: RequestInit = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: SIGNIN_BODY,
};

describe("TM-02 authentication rate limiting", () => {
    it(`answers 429 on attempt ${AUTH_RATE_LIMIT + 1} for a standalone limiter`, async () => {
        const app = express();
        app.post("/signin", createAuthLimiter(), (_req, res) => {
            res.status(401).json({ error: "Invalid credentials" });
        });

        const { server, base } = await listen(app);
        try {
            for (let attempt = 1; attempt <= AUTH_RATE_LIMIT; attempt += 1) {
                const response = await fetch(`${base}/signin`, SIGNIN_INIT);
                expect(response.status).toBe(401);
            }

            const limited = await fetch(`${base}/signin`, SIGNIN_INIT);
            expect(limited.status).toBe(429);
            await expect(limited.json()).resolves.toEqual({
                error: "Too many authentication attempts, please try again later.",
            });
        } finally {
            await close(server);
        }
    }, 20000);

    it("mounts the limiter on the real /api/v1/users/signin route", async () => {
        const app = (await import("../../../app")).default;

        const { server, base } = await listen(app);
        // The database is unreachable in tests, so the first attempts fail rather than
        // authenticate. Failures still consume the budget, which is what we assert.
        const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            for (let attempt = 1; attempt <= AUTH_RATE_LIMIT; attempt += 1) {
                const response = await fetch(`${base}/api/v1/users/signin`, SIGNIN_INIT);
                expect([401, 500]).toContain(response.status);
            }

            const limited = await fetch(`${base}/api/v1/users/signin`, SIGNIN_INIT);
            expect(limited.status).toBe(429);
        } finally {
            errorSpy.mockRestore();
            await close(server);
        }
    }, 30000);
});
