import { ImportConfigDefinition, ImportFieldDefinition, DuplicateStrategy } from "./types"
import { z } from "zod"

export interface ProcessResult<T> {
    success: boolean
    processedRows: number
    validRows: number
    invalidRows: number
    errors: Array<{
        row: number
        field: string
        message: string
        value: any
    }>
    data: T[]
}

/**
 * GENERIC PROCESSING ENGINE
 * The Core of the "Ironclad" Import System
 */
export async function processGenericImport<T = any>(
    rawData: any[],
    config: ImportConfigDefinition
): Promise<ProcessResult<T>> {

    // 1. DEFENSIVE INITIALIZATION
    if (!Array.isArray(rawData) || rawData.length === 0) {
        return {
            success: false,
            processedRows: 0,
            validRows: 0,
            invalidRows: 0,
            errors: [{ row: 0, field: 'general', message: 'Datos de entrada vacíos o inválidos', value: null }],
            data: []
        }
    }

    const result: ProcessResult<T> = {
        success: true,
        processedRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [],
        data: []
    }

    // 2. ITERATE SAFELY
    for (let i = 0; i < rawData.length; i++) {
        const rawRow = rawData[i]
        const rowNumber = i + 1 // 1-based index for users

        if (!rawRow || typeof rawRow !== 'object') {
            result.errors.push({
                row: rowNumber,
                field: 'general',
                message: 'Fila corrupta o vacía',
                value: null
            })
            result.invalidRows++
            continue
        }

        result.processedRows++
        const processedRow: any = {}
        let isRowValid = true

        // 3. MAP AND VALIDATE FIELDS (Config-Driven)
        for (const field of config.fields) {
            let value = findValueInRow(rawRow, field)

            // TRANSFORM
            if (field.transform && value !== undefined && value !== null) {
                try {
                    value = field.transform(value)
                } catch (e) {
                    result.errors.push({
                        row: rowNumber,
                        field: field.key,
                        message: 'Error en transformación de datos',
                        value: value
                    })
                    isRowValid = false
                }
            }

            // DEFAULT VALUE
            if ((value === undefined || value === null || value === '') && field.defaultValue !== undefined) {
                value = field.defaultValue
            }

            // REQUIRED CHECK
            if (field.required && (value === undefined || value === null || value === '')) {
                result.errors.push({
                    row: rowNumber,
                    field: field.key,
                    message: `Campo requerido '${field.label}' vacío`,
                    value: null
                })
                isRowValid = false
                continue
            }

            // SCHEMA VALIDATION (ZOD)
            if (field.validation && value !== undefined && value !== null && value !== '') {
                const validation = field.validation.safeParse(value)
                if (!validation.success) {
                    result.errors.push({
                        row: rowNumber,
                        field: field.key,
                        message: validation.error.errors[0]?.message || 'Valor inválido',
                        value: value
                    })
                    isRowValid = false
                }
            }

            if (isRowValid) {
                processedRow[field.key] = value
            }
        }

        // 4. ADD TO VALID SET
        if (isRowValid) {
            result.validRows++
            result.data.push(processedRow as T)
        } else {
            result.invalidRows++
        }
    }

    // 5. FINAL RESULT
    result.success = result.invalidRows === 0
    return result
}

/**
 * Helper to find value using aliases
 */
function findValueInRow(row: any, field: ImportFieldDefinition): any {
    // 1. Direct match
    if (row[field.key] !== undefined) return row[field.key]

    // 2. Case insensitive match for key
    const lowKey = field.key.toLowerCase()
    const rowKeys = Object.keys(row)
    const directMatch = rowKeys.find(k => k.toLowerCase() === lowKey)
    if (directMatch) return row[directMatch]

    // 3. Aliases match
    if (field.aliases) {
        for (const alias of field.aliases) {
            const aliasMatch = rowKeys.find(k => k.toLowerCase() === alias.toLowerCase())
            if (aliasMatch) return row[aliasMatch]
        }
    }

    return undefined
}
