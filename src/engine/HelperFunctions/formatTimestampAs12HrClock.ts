import { formatDateAsDDMMYYYY, padTwoDigits, to12HourClock } from "./timeFormatting";

/**
 * Formats a timestamp as local wall-clock time on the 12-hour clock, with a zero-padded hour and
 * uppercase AM/PM, e.g. "03:05 PM" (or "07/10/2026 03:05 PM" with `includeDate`).
 * For the compact "3:05pm" style of the current time, use `formatCurrentTime`.
 * @param timestamp Milliseconds since the epoch
 * @param includeDate Optional: prefix the local date as "DD/MM/YYYY "
 */
export function formatTimestampAs12HrClock(
    timestamp: number,
    includeDate: boolean = false
): string {
    const date = new Date(timestamp);
    const { hours, isPm } = to12HourClock(date.getHours());
    const time = `${padTwoDigits(hours)}:${padTwoDigits(date.getMinutes())} ${isPm ? "PM" : "AM"}`;
    return includeDate ? `${formatDateAsDDMMYYYY(date)} ${time}` : time;
}
