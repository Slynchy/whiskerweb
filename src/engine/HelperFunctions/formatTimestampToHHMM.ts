import { formatDateAsDDMMYYYY, padTwoDigits } from "./timeFormatting";

/**
 * Formats a timestamp as local wall-clock time on the 24-hour clock, "HH:MM"
 * (or "DD/MM/YYYY HH:MM" with `includeDate`).
 * This is a point in time; to format a duration, use `HelperFunctions.formatTimeToMMSS` / `formatTimeToHHMMSS`.
 * @param timestamp Milliseconds since the epoch
 * @param includeDate Optional: prefix the local date as "DD/MM/YYYY "
 */
export function formatTimestampToHHMM(
    timestamp: number,
    includeDate: boolean = false
): string {
    const date = new Date(timestamp);
    const time = `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}`;
    return includeDate ? `${formatDateAsDDMMYYYY(date)} ${time}` : time;
}
