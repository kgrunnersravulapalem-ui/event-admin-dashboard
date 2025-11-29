/**
 * Utility Functions
 */

/**
 * Converts a string to kebab-case
 * Example: "Hello World" -> "hello-world"
 */
export function kebabCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/\s+/g, '-')
        .split('-')
        .map((word, index) => index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word)
        .join('-');
}
