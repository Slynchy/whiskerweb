import { PlayerDataSingleton } from "../PlayerDataSingleton";

export function formatCurrentTime(): string {
    const date = new Date(Date.now());
    let hours = date.getHours();
    const minutes = date.getMinutes();
    let period = "am";

    if (hours >= 12) {
        period = "pm";
        if (hours > 12) {
            hours -= 12;
        }
    } else if (hours === 0) {
        hours = 12;
    }

    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

    return `${hours}:${formattedMinutes}${period}`;
}