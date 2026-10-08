/**
 * Compares two arrays, returns true if they contain the same contents in any order.
 * Duplicates count: [1, 1, 2] and [1, 2, 2] are not equal. Elements are compared with SameValueZero (like `Set`).
 * @param arr1
 * @param arr2
 */
export function compareArrays<T>(arr1: Array<T>, arr2: Array<T>): boolean {
    if (arr1.length !== arr2.length) {
        return false;
    }

    // Count each element in arr1, then remove arr2's elements from the counts
    const counts = new Map<T, number>();
    for (let i = 0; i < arr1.length; i++) {
        counts.set(arr1[i], (counts.get(arr1[i]) || 0) + 1);
    }

    for (let i = 0; i < arr2.length; i++) {
        const count = counts.get(arr2[i]);
        if (!count) {
            return false;
        }
        counts.set(arr2[i], count - 1);
    }

    return true;
}