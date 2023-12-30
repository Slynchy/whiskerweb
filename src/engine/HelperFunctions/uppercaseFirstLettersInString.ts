export function uppercaseFirstLettersInString(e: string): string {
    return (e || "")
        .split(" ")
        .map((_e) => !_e[0] ? "" : _e[0].toUpperCase() + _e.slice(1))
        .join(" ");
}