// Shared pieces of the time/date formatting helpers

/**
 * Pads a number to at least two digits with a leading zero: 5 -> "05", 12 -> "12", 125 -> "125".
 */
export function padTwoDigits(_num: number): string {
    return _num < 10 ? "0" + _num : String(_num);
}

/**
 * Converts an hour of the 24-hour clock (0-23) to the 12-hour clock:
 * 0 -> 12 am, 9 -> 9 am, 12 -> 12 pm, 13 -> 1 pm.
 */
export function to12HourClock(_hours24: number): { hours: number; isPm: boolean } {
    return {
        hours: (_hours24 % 12) || 12,
        isPm: _hours24 >= 12,
    };
}

/**
 * Formats the local date as "DD/MM/YYYY".
 */
export function formatDateAsDDMMYYYY(_date: Date): string {
    return `${padTwoDigits(_date.getDate())}/${padTwoDigits(_date.getMonth() + 1)}/${_date.getFullYear()}`;
}
