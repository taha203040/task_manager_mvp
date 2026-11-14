/**
 * Express types a route parameter as `string | string[]`: a repeated path
 * segment can arrive as an array. Every route in this application declares a
 * single dynamic segment, so collapse that case to its first element instead of
 * handing a non-string to code that expects an id.
 *
 * Taking the union here (rather than casting at ~25 call sites) keeps the
 * narrowing honest: an unexpected array never becomes `"a,b"` via String().
 */
export function routeParam(value: string | string[] | undefined | null): string {
    if (Array.isArray(value)) {
        const first = value[0];
        return typeof first === "string" ? first : "";
    }
    return typeof value === "string" ? value : "";
}
