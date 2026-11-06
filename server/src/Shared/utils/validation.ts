/** Small, dependency-free input validation helpers shared by use cases. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_RE.test(value);
}

export function requireUuid(value: unknown, field: string): string {
    if (!isUuid(value)) {
        throw new Error(`${field} must be a valid id`);
    }
    return value;
}

export function requireNonEmptyString(value: unknown, field: string, maxLength = 255): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`${field} is required`);
    }
    const trimmed = value.trim();
    if (trimmed.length > maxLength) {
        throw new Error(`${field} must be at most ${maxLength} characters`);
    }
    return trimmed;
}

/** undefined -> undefined (field untouched), null -> null (cleared), string -> trimmed value. */
export function optionalString(value: unknown, field: string, maxLength = 255): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== "string") {
        throw new Error(`${field} must be a string`);
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length > maxLength) {
        throw new Error(`${field} must be at most ${maxLength} characters`);
    }
    return trimmed;
}

/** undefined -> undefined (field untouched), null/"" -> null, otherwise a Date. */
export function optionalDate(value: unknown, field: string): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
        throw new Error(`${field} must be a valid date`);
    }
    return date;
}

export function requireStringArray(value: unknown, field: string, maxItems = 100): string[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
        throw new Error(`${field} must be an array`);
    }
    if (value.length > maxItems) {
        throw new Error(`${field} must contain at most ${maxItems} items`);
    }
    const out: string[] = [];
    for (const item of value) {
        if (typeof item !== "string" || item.trim().length === 0) {
            throw new Error(`${field} must contain non-empty strings`);
        }
        out.push(item.trim());
    }
    return out;
}

export function uniqueValues(values: string[]): string[] {
    return Array.from(new Set(values));
}
