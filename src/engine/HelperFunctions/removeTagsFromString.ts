export function removeTagsFromString(str: string): string {
    // Remove all HTML/XML tags from the input string using a regular expression
    const text = str.replace(/<[^>]*>/g, '');

    // Return the text content without any HTML tags
    return text;
}