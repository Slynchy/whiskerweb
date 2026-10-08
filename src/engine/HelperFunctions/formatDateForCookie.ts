/**
 * Formats a timestamp for a cookie's `expires` attribute, which must be an HTTP date
 * (e.g. "Wed, 07 Oct 2026 14:05:09 GMT").
 * @param timestamp Milliseconds since the epoch
 */
export function formatDateForCookie(timestamp: number): string {
    return new Date(timestamp).toUTCString();
}