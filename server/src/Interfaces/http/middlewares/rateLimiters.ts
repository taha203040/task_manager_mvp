import { rateLimit, type RateLimitRequestHandler } from "express-rate-limit";

/**
 * Factory functions rather than shared singletons so tests can create an isolated
 * instance without inheriting hit counts from another suite (TM-02).
 */
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const GLOBAL_RATE_LIMIT = 300;
export const AUTH_RATE_LIMIT = 10;

/** Broad per-IP ceiling applied to every route. */
export function createGlobalLimiter(): RateLimitRequestHandler {
    return rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        limit: GLOBAL_RATE_LIMIT,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: "Too many requests, please try again later." },
    });
}

/**
 * Strict per-IP ceiling for the credential endpoints. `skipSuccessfulRequests` keeps
 * normal logins from consuming the budget; failures (4xx/5xx) still count.
 */
export function createAuthLimiter(): RateLimitRequestHandler {
    return rateLimit({
        windowMs: RATE_LIMIT_WINDOW_MS,
        limit: AUTH_RATE_LIMIT,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        message: { error: "Too many authentication attempts, please try again later." },
    });
}
