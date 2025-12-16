/**
 * SAFE UTILITIES: INDESTRUCTIBLE ITERATORS & ACCESSORS
 * Defensive Programming Patterns for the Import Engine
 */

/**
 * Safely iterates over any input, guaranteeing no crashes for null/undefined/non-array inputs.
 * @param input The potential array to iterate
 * @param callback Function to execute for each item
 */
export function safeForEach<T>(input: T[] | null | undefined, callback: (item: T, index: number) => void): void {
    if (!Array.isArray(input)) return;
    try {
        input.forEach(callback);
    } catch (e) {
        console.error("Critical Safety Catch in safeForEach:", e);
    }
}

/**
 * Safely maps any input, returning an empty array if input is invalid.
 * @param input The potential array to map
 * @param callback Transform function
 */
export function safeMap<T, U>(input: T[] | null | undefined, callback: (item: T, index: number) => U): U[] {
    if (!Array.isArray(input)) return [];
    try {
        return input.map(callback);
    } catch (e) {
        console.error("Critical Safety Catch in safeMap:", e);
        return [];
    }
}

/**
 * Safely filters any input.
 */
export function safeFilter<T>(input: T[] | null | undefined, predicate: (item: T, index: number) => boolean): T[] {
    if (!Array.isArray(input)) return [];
    try {
        return input.filter(predicate);
    } catch (e) {
        console.error("Critical Safety Catch in safeFilter:", e);
        return [];
    }
}

/**
 * Safely accesses a property path in a potential object.
 * Returns default value if path doesn't exist or object is null.
 */
export function safeGet<T>(obj: any, path: string, defaultValue: T): T {
    if (!obj || typeof obj !== 'object') return defaultValue;

    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return (value !== undefined && value !== null) ? value : defaultValue;
}

/**
 * Checks if a value is effectively empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
}
