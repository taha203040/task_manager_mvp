import { UserRep } from "../../Repositories/UserRepository";
import { UnauthorizedError } from "../../../Domain/Errors/AppError";
import bcrypt from "bcrypt";

/** Failed attempts allowed before the per-account delay starts. */
export const THROTTLE_FREE_ATTEMPTS = 5;
/** First delay once throttling engages. */
export const THROTTLE_BASE_DELAY_MS = 60_000;
/** Hard cap, so the throttle can never degrade into a permanent lockout. */
export const THROTTLE_MAX_DELAY_MS = 15 * 60_000;

/**
 * Progressive per-account delay: 0 until THROTTLE_FREE_ATTEMPTS, then
 * base * 2^(n-1), capped at THROTTLE_MAX_DELAY_MS (60s, 120s, 240s, 480s, then 900s).
 */
export function computeThrottleDelayMs(failedAttempts: number): number {
    if (!Number.isFinite(failedAttempts) || failedAttempts < THROTTLE_FREE_ATTEMPTS) {
        return 0;
    }
    const step = failedAttempts - THROTTLE_FREE_ATTEMPTS + 1;
    return Math.min(THROTTLE_BASE_DELAY_MS * Math.pow(2, step - 1), THROTTLE_MAX_DELAY_MS);
}

export class LoginUser {
    constructor(
        private userRepo: UserRep,
    ) { }

    async execute(email: string, password: string) {
        const user = await this.userRepo.findByEmail(email);

        // Unknown account: identical error and shape to a wrong password.
        if (!user || !user.id) {
            throw new UnauthorizedError("Invalid credentials");
        }

        // The throttle gate runs BEFORE the password comparison. If it ran after, a
        // throttled response would be distinguishable from a wrong password and would
        // therefore confirm that the account exists (TM-09 enumeration oracle).
        const delayMs = computeThrottleDelayMs(user.failedLoginCount);
        if (delayMs > 0 && user.lastFailedLoginAt) {
            const readyAt = user.lastFailedLoginAt.getTime() + delayMs;
            if (Date.now() < readyAt) {
                throw new UnauthorizedError("Invalid credentials");
            }
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await this.userRepo.recordFailedLogin(user.id);
            throw new UnauthorizedError("Invalid credentials");
        }

        // Successful login clears the streak so a legitimate user is never locked out.
        await this.userRepo.resetFailedLogins(user.id);

        return {
            id: user.id,
            email: user.email,
            username: user.username,
        };
    }
}
