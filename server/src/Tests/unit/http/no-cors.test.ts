import type { Server } from "http";
import type { AddressInfo } from "net";
import app from "../../../app";

/**
 * The app is deployed single-origin (the client and /api/v1 share an origin, and the
 * Vite dev proxy forwards /api), so no CORS middleware exists. A cross-origin browser
 * request must therefore receive no `Access-Control-Allow-Origin` header at all: the
 * browser then blocks the response, which is the intended behaviour.
 */
describe("cross-origin requests are not granted access", () => {
    let server: Server;
    let baseUrl: string;

    beforeAll(async () => {
        server = app.listen(0, "127.0.0.1");
        await new Promise<void>((resolve) => server.once("listening", () => resolve()));
        const { port } = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${port}`;
    });

    afterAll(async () => {
        await new Promise<void>((resolve) => server.close(() => resolve()));
    });

    it("does not answer an OPTIONS preflight with Access-Control-Allow-Origin", async () => {
        const res = await fetch(`${baseUrl}/api/v1/tasks/`, {
            method: "OPTIONS",
            headers: {
                Origin: "https://evil.example",
                "Access-Control-Request-Method": "GET",
            },
        });

        expect(res.headers.get("access-control-allow-origin")).toBeNull();
        expect(res.headers.get("access-control-allow-credentials")).toBeNull();
        expect(res.headers.get("access-control-allow-methods")).toBeNull();
    });

    it("does not answer a simple cross-origin GET with Access-Control-Allow-Origin", async () => {
        const res = await fetch(`${baseUrl}/`, {
            headers: { Origin: "https://evil.example" },
        });

        expect(res.headers.get("access-control-allow-origin")).toBeNull();
    });
});
