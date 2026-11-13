import bcrypt from "bcrypt";
import { User } from "../../../Domain/Entities/User_Entities";
import type { UserRep } from "../../../Application/Repositories/UserRepository";
import {
    LoginUser,
    computeThrottleDelayMs,
    THROTTLE_BASE_DELAY_MS,
    THROTTLE_FREE_ATTEMPTS,
    THROTTLE_MAX_DELAY_MS,
} from "../../../Application/use-cases/User-usecases/LoginUser";
import { UnauthorizedError } from "../../../Domain/Errors/AppError";

const USER_ID = "22222222-2222-4222-8222-222222222222";
const EMAIL = "alice@example.io";
const PASSWORD = "Passw0rd!2345";

let passwordHash: string;

beforeAll(async () => {
    // One real hash (same cost factor as production) so the "correct password" branch is genuine.
    passwordHash = await bcrypt.hash(PASSWORD, 10);
}, 20000);

function makeUserRepo(): jest.Mocked<UserRep> {
    return {
        create: jest.fn(),
        findByEmail: jest.fn(),
        findById: jest.fn(),
        existsByUsername: jest.fn(),
        updateProfile: jest.fn(),
        recordFailedLogin: jest.fn(),
        resetFailedLogins: jest.fn(),
    } as unknown as jest.Mocked<UserRep>;
}

function makeUser(failedLoginCount = 0, lastFailedLoginAt: Date | null = null): User {
    return new User(EMAIL, passwordHash, "alice", "USER", USER_ID, null, null, failedLoginCount, lastFailedLoginAt);
}

describe("computeThrottleDelayMs (TM-02 progressive delay)", () => {
    it("does not delay the first attempts", () => {
        for (let attempts = 0; attempts < THROTTLE_FREE_ATTEMPTS; attempts += 1) {
            expect(computeThrottleDelayMs(attempts)).toBe(0);
        }
    });

    it("grows exponentially once the free attempts are exhausted", () => {
        expect(computeThrottleDelayMs(THROTTLE_FREE_ATTEMPTS)).toBe(THROTTLE_BASE_DELAY_MS);
        expect(computeThrottleDelayMs(THROTTLE_FREE_ATTEMPTS + 1)).toBe(THROTTLE_BASE_DELAY_MS * 2);
        expect(computeThrottleDelayMs(THROTTLE_FREE_ATTEMPTS + 2)).toBe(THROTTLE_BASE_DELAY_MS * 4);
    });

    it("is capped so the throttle never becomes a permanent lockout", () => {
        expect(computeThrottleDelayMs(50)).toBe(THROTTLE_MAX_DELAY_MS);
        expect(computeThrottleDelayMs(Number.MAX_SAFE_INTEGER)).toBe(THROTTLE_MAX_DELAY_MS);
    });
});

describe("LoginUser (TM-02 per-account throttling)", () => {
    it("rejects an unknown account without touching the streak", async () => {
        const repo = makeUserRepo();
        repo.findByEmail.mockResolvedValue(null);

        await expect(new LoginUser(repo).execute(EMAIL, PASSWORD)).rejects.toBeInstanceOf(UnauthorizedError);
        expect(repo.recordFailedLogin).not.toHaveBeenCalled();
        expect(repo.resetFailedLogins).not.toHaveBeenCalled();
    });

    it("records a failed attempt for a wrong password", async () => {
        const repo = makeUserRepo();
        repo.findByEmail.mockResolvedValue(makeUser());

        await expect(new LoginUser(repo).execute(EMAIL, "wrong-password")).rejects.toBeInstanceOf(UnauthorizedError);
        expect(repo.recordFailedLogin).toHaveBeenCalledWith(USER_ID);
        expect(repo.resetFailedLogins).not.toHaveBeenCalled();
    });

    it("clears the streak and returns the user on a correct password", async () => {
        const repo = makeUserRepo();
        repo.findByEmail.mockResolvedValue(makeUser(2, new Date()));

        await expect(new LoginUser(repo).execute(EMAIL, PASSWORD)).resolves.toEqual({
            id: USER_ID,
            email: EMAIL,
            username: "alice",
        });
        expect(repo.resetFailedLogins).toHaveBeenCalledWith(USER_ID);
        expect(repo.recordFailedLogin).not.toHaveBeenCalled();
    });

    it("rejects even a CORRECT password while throttled, proving the gate precedes the password check", async () => {
        const repo = makeUserRepo();
        // 6 failures -> 2 minute delay; the last failure was one second ago.
        repo.findByEmail.mockResolvedValue(makeUser(6, new Date(Date.now() - 1000)));

        await expect(new LoginUser(repo).execute(EMAIL, PASSWORD)).rejects.toBeInstanceOf(UnauthorizedError);
        expect(repo.resetFailedLogins).not.toHaveBeenCalled();
        expect(repo.recordFailedLogin).not.toHaveBeenCalled();
    });

    it("accepts the correct password again once the delay has elapsed", async () => {
        const repo = makeUserRepo();
        // 6 failures -> 2 minute delay; the last failure was ten minutes ago.
        repo.findByEmail.mockResolvedValue(makeUser(6, new Date(Date.now() - 10 * 60_000)));

        await expect(new LoginUser(repo).execute(EMAIL, PASSWORD)).resolves.toMatchObject({ id: USER_ID });
        expect(repo.resetFailedLogins).toHaveBeenCalledWith(USER_ID);
    });

    it("does not reveal throttling state differently from a bad password", async () => {
        const repo = makeUserRepo();
        repo.findByEmail.mockResolvedValue(makeUser(9, new Date()));

        const throttled = await new LoginUser(repo).execute(EMAIL, PASSWORD).catch((error: unknown) => error);
        const wrongPassword = await new LoginUser(repo).execute(EMAIL, "wrong-password").catch((error: unknown) => error);

        expect(throttled).toBeInstanceOf(UnauthorizedError);
        expect(wrongPassword).toBeInstanceOf(UnauthorizedError);
        expect((throttled as UnauthorizedError).statusCode).toBe((wrongPassword as UnauthorizedError).statusCode);
        expect((throttled as UnauthorizedError).message).toBe((wrongPassword as UnauthorizedError).message);
    });
});
