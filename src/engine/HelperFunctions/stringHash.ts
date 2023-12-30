export function stringHash(str: string): number {
    let hash: number = 0;
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        // eslint-disable-next-line no-bitwise
        hash = (hash << 5) - hash + charCode;
        // eslint-disable-next-line no-bitwise
        hash |= 0; // Convert to a 32-bit integer
    }
    return hash;
}