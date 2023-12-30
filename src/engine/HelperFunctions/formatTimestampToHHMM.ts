export function formatTimestampToHHMM(
    timestamp: number,
    includeDate: boolean = false
): string {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if(includeDate) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } else {
        return `${hours}:${minutes}`;
    }
}