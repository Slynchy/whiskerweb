export function formatTimestampAs12HrClock(
    timestamp: number,
    includeDate: boolean = false
): string {
    const date = new Date(timestamp);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const amPm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = ((hours % 12) || 12).toString().padStart(2, '0');

    if(includeDate) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        return `${day}/${month}/${year} ${formattedHours}:${minutes} ${amPm}`;
    } else {
        return `${formattedHours}:${minutes} ${amPm}`;
    }
}