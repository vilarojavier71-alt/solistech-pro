/**
 * Security utilities for import system
 * Implements Tiger Team audit recommendations
 */

// ============================================
// CONSTANTS
// ============================================

export const IMPORT_LIMITS = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    MAX_ROWS: 10000,
    MAX_CUSTOM_FIELDS: 20,
    MAX_FIELD_SIZE: 1000, // caracteres
    IMPORT_RATE_LIMIT: 5, // importaciones por hora
    RATE_LIMIT_WINDOW: 3600000 // 1 hora en ms
}

// ============================================
// CSV INJECTION PROTECTION
// ============================================

/**
 * Sanitizes values to prevent CSV Injection attacks
 * Protects against formula execution in Excel/Sheets
 */
export function sanitizeCSVInjection(value: any): any {
    if (value === null || value === undefined) return value
    if (typeof value !== 'string') return value

    // Dangerous characters that start formulas
    const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n']
    const firstChar = value.charAt(0)

    // If starts with dangerous char, prefix with single quote
    if (dangerousChars.includes(firstChar)) {
        return "'" + value
    }

    // Also check for pipe commands (cmd injection)
    if (value.includes('|!') || value.includes('cmd')) {
        return "'" + value
    }

    return value
}

/**
 * Sanitizes an entire object recursively
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value)
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(v =>
                typeof v === 'object' ? sanitizeObject(v) : sanitizeCSVInjection(v)
            )
        } else {
            sanitized[key] = sanitizeCSVInjection(value)
        }
    }

    return sanitized
}

// ============================================
// FILE VALIDATION
// ============================================

export interface FileValidationResult {
    valid: boolean
    error?: string
    warnings?: string[]
}

/**
 * Validates uploaded file before processing
 */
export function validateImportFile(file: File): FileValidationResult {
    const warnings: string[] = []

    // Check file size
    if (file.size > IMPORT_LIMITS.MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `Archivo demasiado grande. Máximo ${IMPORT_LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB`
        }
    }

    // Check file type
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExtension) {
        return {
            valid: false,
            error: 'Formato de archivo no válido. Use .xlsx, .xls o .csv'
        }
    }

    // Warn if file is large
    if (file.size > 5 * 1024 * 1024) {
        warnings.push('Archivo grande detectado. La importación puede tardar varios minutos.')
    }

    return { valid: true, warnings }
}

/**
 * Validates row count after parsing
 */
export function validateRowCount(rowCount: number): FileValidationResult {
    if (rowCount > IMPORT_LIMITS.MAX_ROWS) {
        return {
            valid: false,
            error: `Demasiadas filas. Máximo ${IMPORT_LIMITS.MAX_ROWS} filas por importación. Divide el archivo en partes más pequeñas.`
        }
    }

    if (rowCount === 0) {
        return {
            valid: false,
            error: 'El archivo está vacío'
        }
    }

    return { valid: true }
}

// ============================================
// CUSTOM FIELDS VALIDATION
// ============================================

/**
 * Validates and limits custom fields to prevent JSONB bloat
 */
export function validateCustomFields(
    customFields: Record<string, any>
): { valid: boolean; sanitized: Record<string, any>; error?: string } {
    const fieldCount = Object.keys(customFields).length

    // Check field count limit
    if (fieldCount > IMPORT_LIMITS.MAX_CUSTOM_FIELDS) {
        return {
            valid: false,
            sanitized: {},
            error: `Demasiados campos personalizados (${fieldCount}). Máximo ${IMPORT_LIMITS.MAX_CUSTOM_FIELDS} permitidos.`
        }
    }

    // Sanitize and truncate field values
    const sanitized: Record<string, any> = {}

    for (const [key, value] of Object.entries(customFields)) {
        let sanitizedValue = sanitizeCSVInjection(value)

        // Truncate if too long
        if (typeof sanitizedValue === 'string' && sanitizedValue.length > IMPORT_LIMITS.MAX_FIELD_SIZE) {
            sanitizedValue = sanitizedValue.substring(0, IMPORT_LIMITS.MAX_FIELD_SIZE) + '...'
        }

        sanitized[key] = sanitizedValue
    }

    return { valid: true, sanitized }
}

// ============================================
// RATE LIMITING
// ============================================

export interface RateLimitCheck {
    allowed: boolean
    remaining: number
    resetAt: Date
    error?: string
}

/**
 * Checks if user has exceeded import rate limit
 */
export async function checkImportRateLimit(
    userId: string,
    recentImportsCount: number
): Promise<RateLimitCheck> {
    const now = Date.now()
    const resetAt = new Date(now + IMPORT_LIMITS.RATE_LIMIT_WINDOW)

    if (recentImportsCount >= IMPORT_LIMITS.IMPORT_RATE_LIMIT) {
        return {
            allowed: false,
            remaining: 0,
            resetAt,
            error: `Límite de ${IMPORT_LIMITS.IMPORT_RATE_LIMIT} importaciones por hora alcanzado. Inténtalo de nuevo en 1 hora.`
        }
    }

    return {
        allowed: true,
        remaining: IMPORT_LIMITS.IMPORT_RATE_LIMIT - recentImportsCount,
        resetAt
    }
}

// ============================================
// MEMORY-SAFE FILE PROCESSING
// ============================================

/**
 * Determines if file should be processed in background
 */
export function shouldUseBackgroundProcessing(fileSize: number): boolean {
    const BACKGROUND_THRESHOLD = 5 * 1024 * 1024 // 5 MB
    return fileSize > BACKGROUND_THRESHOLD
}

/**
 * Estimates memory usage for file processing
 */
export function estimateMemoryUsage(fileSize: number, rowCount: number): {
    estimatedMB: number
    safe: boolean
    recommendation: string
} {
    // Rough estimation: file + workbook + JSON = ~8x file size
    const estimatedBytes = fileSize * 8
    const estimatedMB = estimatedBytes / 1024 / 1024

    const SAFE_LIMIT_MB = 100 // Conservative limit
    const safe = estimatedMB < SAFE_LIMIT_MB

    let recommendation = ''
    if (!safe) {
        recommendation = 'Archivo muy grande. Se procesará en segundo plano.'
    } else if (estimatedMB > 50) {
        recommendation = 'Archivo grande. El procesamiento puede tardar 1-2 minutos.'
    }

    return { estimatedMB, safe, recommendation }
}

// ============================================
// INPUT SANITIZATION
// ============================================

/**
 * Comprehensive input sanitization for all import data
 */
export function sanitizeImportData(data: Record<string, any>[]): Record<string, any>[] {
    return data.map(row => sanitizeObject(row))
}

/**
 * Validates Spanish NIF/CIF with algorithm
 */
export function validateSpanishNIF(nif: string): boolean {
    const cleanNIF = nif.toUpperCase().replace(/[\s\-]/g, '')

    // DNI: 8 digits + letter
    const dniRegex = /^(\d{8})([A-Z])$/
    const dniMatch = cleanNIF.match(dniRegex)

    if (dniMatch) {
        const number = parseInt(dniMatch[1], 10)
        const letter = dniMatch[2]
        const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE'
        const expectedLetter = validLetters[number % 23]
        return letter === expectedLetter
    }

    // CIF: Letter + 7 digits + letter/digit
    const cifRegex = /^([ABCDEFGHJNPQRSUVW])(\d{7})([A-J0-9])$/
    const cifMatch = cleanNIF.match(cifRegex)

    if (cifMatch) {
        // CIF validation is complex, basic format check for now
        return true
    }

    // NIE: X/Y/Z + 7 digits + letter
    const nieRegex = /^([XYZ])(\d{7})([A-Z])$/
    const nieMatch = cleanNIF.match(nieRegex)

    if (nieMatch) {
        const prefix = nieMatch[1]
        const number = parseInt(nieMatch[2], 10)
        const letter = nieMatch[3]

        // Replace prefix with number
        const prefixMap: Record<string, number> = { X: 0, Y: 1, Z: 2 }
        const fullNumber = prefixMap[prefix] * 10000000 + number

        const validLetters = 'TRWAGMYFPDXBNJZSQVHLCKE'
        const expectedLetter = validLetters[fullNumber % 23]
        return letter === expectedLetter
    }

    return false
}

// ============================================
// BATCH PROCESSING HELPERS
// ============================================

/**
 * Splits array into batches for memory-safe processing
 */
export function createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []

    for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize))
    }

    return batches
}

/**
 * Processes batches with delay to prevent overwhelming the server
 */
export async function processBatchesWithDelay<T, R>(
    batches: T[][],
    processor: (batch: T[]) => Promise<R>,
    delayMs: number = 100
): Promise<R[]> {
    const results: R[] = []

    for (let i = 0; i < batches.length; i++) {
        const result = await processor(batches[i])
        results.push(result)

        // Small delay between batches to prevent server overload
        if (i < batches.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs))
        }
    }

    return results
}
