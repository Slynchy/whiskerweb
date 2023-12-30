export function formatDateForCookie(timestamp: number) {
    const date = new Date(timestamp);
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // Add 1 to adjust for zero-indexed months
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();
    const formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second} UTC`;
    return formattedDate;
}