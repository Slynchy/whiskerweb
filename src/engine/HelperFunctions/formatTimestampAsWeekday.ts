
const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export function formatTimestampAsWeekday(_timestamp: number | Date): string {
    const date = typeof _timestamp === "number" ? new Date(_timestamp) : _timestamp;
    return weekday[date.getDay()];
}