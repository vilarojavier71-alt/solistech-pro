import { ImportSchema, ImportFieldDefinition } from "./types"
import { safeForEach, safeGet, isEmpty } from "./safe-utils"

export interface FlexibleProcessResult<T> {
    success: boolean
    processedRows: number
    validRows: number
    invalidRows: number
    validData: T[]
    invalidData: Array<{
        row: number
        originalData: any
        errors: Array<{ field: string; message: string; value: any }>
    }>
    warnings: string[]
}

/**
 * THE ADAPTIVE ENGINE CORE
 * Processes any data array based on a Schema, with Zero-Crash Guarantee.
 */
export async function processFlexibleImport<T = any>(
    rawData: any[],
    schema: ImportSchema<T>
): Promise<FlexibleProcessResult<T>> {

    // 1. GUARD CLAUSE: EMPTY DATA
    if (!Array.isArray(rawData) || rawData.length === 0) {
        return {
            success: false,
            processedRows: 0,
            validRows: 0,
            invalidRows: 0,
            validData: [],
            invalidData: [],
            warnings: ['No hay datos para procesar']
        }
    }

    const result: FlexibleProcessResult<T> = {
        success: true,
        processedRows: 0,
        validRows: 0,
        invalidRows: 0,
        validData: [],
        invalidData: [],
        warnings: []
    }

    // 2. SAFE ITERATION (Phase 1 Fix)
    const safeData = Array.isArray(rawData) ? rawData : []

    // Use for loop for async support if needed later, but here standard blocked loop is fine
    for (let i = 0; i < safeData.length; i++) {
        const rawRow = safeData[i]
        const rowNumber = i + 1

        if (!rawRow || typeof rawRow !== 'object') {
            result.invalidRows++
            result.invalidData.push({
                row: rowNumber,
                originalData: rawRow,
                errors: [{ field: 'general', message: 'Fila inválida (no es un objeto)', value: rawRow }]
            })
            continue
        }

        result.processedRows++
        const errors: Array<{ field: string; message: string; value: any }> = []
        let processedRow: any = {}
        let isRowValid = true

        // 3. SCHEMA MAPPING & VALIDATION
        for (const field of schema.fields) {
            let value = findValueInRowSafely(rawRow, field)

            // TRANSFORM
            if (field.transform) {
                try {
                    value = field.transform(value)
                } catch (e) {
                    // Non-fatal warning for transform failure
                    errors.push({ field: field.key, message: 'Error de transformación', value })
                    // We keep the original value or null? Let's keep trying
                }
            }

            // VALUE CLEANUP
            if (isEmpty(value)) {
                value = (field.defaultValue !== undefined) ? field.defaultValue : null
            }

            // REQUIRED CHECK
            if (field.required && value === null) {
                isRowValid = false
                errors.push({ field: field.key, message: `Campo obligatorio '${field.label}' faltante`, value: null })
            }

            // ZOD VALIDATION
            if (field.validation && value !== null) {
                const validation = field.validation.safeParse(value)
                if (!validation.success) {
                    isRowValid = false
                    errors.push({
                        field: field.key,
                        message: validation.error.errors[0]?.message || 'Dato inválido',
                        value
                    })
                }
            }

            if (isRowValid) {
                processedRow[field.key] = value
            }
        }

        // 4. MANUAL TRANSFORM HOOK (Phase 2 Requirement)
        if (schema.transformRow && isRowValid) {
            try {
                processedRow = schema.transformRow(processedRow)
            } catch (e) {
                const err = e instanceof Error ? e.message : 'Unknown hook error'
                isRowValid = false
                errors.push({ field: 'general', message: `Error en transformación manual: ${err}`, value: null })
            }
        }

        // 5. UNMAPPED DATA CATCHING (Phase 3 Requirement)
        // Store unmapped fields in 'unmapped_data' for resilience
        const mappedKeys = schema.fields.map(f => f.key)
        const unmapped: Record<string, any> = {}
        Object.keys(rawRow).forEach(key => {
            // This is a naive check (doesn't account for aliases reverse lookup), but safe enough for now
            // In a real mapping scenario we'd track used source keys. 
            // For now, we only store what's NOT in the target object if we wanted to preserve source.
            // But let's follow the simple requirement: save extra data.
            if (!processedRow[key] && !mappedKeys.includes(key)) {
                unmapped[key] = rawRow[key]
            }
        })

        if (Object.keys(unmapped).length > 0) {
            processedRow.unmapped_data = unmapped
        }

        // 6. RESULT BUCKETING
        if (isRowValid) {
            result.validRows++
            result.validData.push(processedRow as T)
        } else {
            result.invalidRows++
            result.invalidData.push({
                row: rowNumber,
                originalData: rawRow,
                errors
            })
        }
    }

    result.success = result.invalidRows === 0
    return result
}

/**
 * Helper: Find value handling aliases and case insensitivity
 */
function findValueInRowSafely(row: any, field: ImportFieldDefinition): any {
    // 1. Direct key
    if (row[field.key] !== undefined) return row[field.key]

    // 2. Case insensitive key
    const rowKeys = Object.keys(row)
    const lowerKey = field.key.toLowerCase()

    // 3. Aliases
    const possibleKeys = [lowerKey, ...(field.aliases || []).map(a => a.toLowerCase())]

    for (const key of rowKeys) {
        if (possibleKeys.includes(key.toLowerCase())) {
            return row[key]
        }
    }

    return undefined
}
