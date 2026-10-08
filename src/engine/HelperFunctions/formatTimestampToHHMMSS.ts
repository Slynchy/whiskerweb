import { formatDateAsDDMMYYYY, padTwoDigits } from "./timeFormatting";

/**
 * Formats a timestamp as local wall-clock time on the 24-hour clock, "HH:MM:SS"
 * (or "DD/MM/YYYY HH:MM:SS" with `includeDate`).
 * This is a point in time; to format a duration, use `HelperFunctions.formatTimeToHHMMSS`.
 * @param timestamp Milliseconds since the epoch
 * @param includeDate Optional: prefix the local date as "DD/MM/YYYY "
 */
export function formatTimestampToHHMMSS(
    timestamp: number,
    includeDate: boolean = false
): string {
    const date = new Date(timestamp);
    const time = `${padTwoDigits(date.getHours())}:${padTwoDigits(date.getMinutes())}:${padTwoDigits(date.getSeconds())}`;
    return includeDate ? `${formatDateAsDDMMYYYY(date)} ${time}` : time;
}
