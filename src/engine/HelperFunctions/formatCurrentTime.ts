import { padTwoDigits, to12HourClock } from "./timeFormatting";

/**
 * Formats the current local wall-clock time on the 12-hour clock, compactly:
 * unpadded hour, lowercase am/pm and no space, e.g. "3:05pm" or "12:30am".
 * For a given timestamp, or the "03:05 PM" style, use `formatTimestampAs12HrClock`.
 */
export function formatCurrentTime(): string {
    const date = new Date(Date.now());
    const { hours, isPm } = to12HourClock(date.getHours());
    return `${hours}:${padTwoDigits(date.getMinutes())}${isPm ? "pm" : "am"}`;
}
