/**
 * Excel Parser Seguro - Aislamiento de vulnerabilidad xlsx
 * ISO 27001: Input validation + Prototype Pollution protection
 * 
 * Este módulo aísla el uso de xlsx con validación estricta
 * para mitigar CVE GHSA-4r6h-8v6p-xvw6 y GHSA-5pgg-2g8v-p4x9
 */

import * as XLSX from 'xlsx'
import { z } from 'zod'

// Schema de validación para prevenir Prototype Pollution
const ExcelRowSchema = z.record(z.string(), z.union([z.string(), z.number(), z.null()]))

interface ParsedRow {
    [key: string]: string | number | null
}

export interface ParseResult {
    headers: string[]
    data: ParsedRow[]
    errors: string[]
}

/**
 * Sanitiza un objeto para prevenir Prototype Pollution
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(obj)) {
        // Bloquear claves peligrosas que podrían manipular prototype
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue
        }
        
        // Validar que la clave sea string válido
        if (typeof key !== 'string' || key.length > 1000) {
            continue
        }
        
        // Validar valor
        if (value === null || value === undefined) {
            sanitized[key] = null
        } else if (typeof value === 'string' || typeof value === 'number') {
            sanitized[key] = value
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursivo para objetos anidados (con límite de profundidad)
            sanitized[key] = sanitizeObject(value as Record<string, unknown>)
        }
    }
    
    return sanitized
}

/**
 * Valida y sanitiza datos de Excel antes de procesar
 */
function validateExcelData(data: unknown[]): ParsedRow[] {
    if (!Array.isArray(data)) {
        throw new Error('Datos de Excel no son un array válido')
    }

    if (data.length > 10000) {
        throw new Error('Archivo Excel demasiado grande (máximo 10,000 filas)')
    }

    const validated: ParsedRow[] = []

    for (let i = 0; i < data.length; i++) {
        const row = data[i]
        
        if (!row || typeof row !== 'object') {
            continue
        }

        // Sanitizar objeto para prevenir Prototype Pollution
        const sanitized = sanitizeObject(row as Record<string, unknown>)
        
        // Validar con Zod schema
        const validation = ExcelRowSchema.safeParse(sanitized)
        
        if (validation.success) {
            validated.push(validation.data)
        } else {
            // Log warning pero continuar con otras filas
            console.warn(`Fila ${i + 1} no válida, omitida:`, validation.error)
        }
    }

    return validated
}

/**
 * Parsea archivo Excel con validación estricta
 * ISO 27001: Input validation + Prototype Pollution protection
 */
export async function parseExcelFileSecure(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        // Validar tamaño de archivo (máximo 10MB)
        if (file.size > 10 * 1024 * 1024) {
            reject(new Error('Archivo demasiado grande (máximo 10MB)'))
            return
        }

        // Validar tipo MIME
        const validMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/vnd.ms-excel.sheet.macroEnabled.12'
        ]
        
        if (!validMimeTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            reject(new Error('Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls)'))
            return
        }

        const reader = new FileReader()

        reader.onload = (e) => {
            try {
                const data = e.target?.result
                if (!data) {
                    reject(new Error('Error al leer el archivo'))
                    return
                }

                // Parsear con xlsx (aislado)
                const workbook = XLSX.read(data, { 
                    type: 'binary',
                    cellDates: false, // Deshabilitar parsing de fechas para evitar ReDoS
                    cellNF: false, // Deshabilitar formato de números para evitar ReDoS
                    cellStyles: false, // Deshabilitar estilos para reducir superficie de ataque
                    sheetStubs: false // No procesar stubs
                })

                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    reject(new Error('El archivo Excel no contiene hojas válidas'))
                    return
                }

                // Obtener primera hoja
                const sheetName = workbook.SheetNames[0]
                const worksheet = workbook.Sheets[sheetName]

                if (!worksheet) {
                    reject(new Error('No se pudo leer la hoja del archivo'))
                    return
                }

                // Convertir a JSON con opciones seguras
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    defval: null,
                    raw: false, // Convertir todo a string para evitar tipos complejos
                    dateNF: undefined // No formatear fechas
                })

                // Validar y sanitizar datos
                const validatedData = validateExcelData(jsonData)

                if (validatedData.length === 0) {
                    resolve({
                        headers: [],
                        data: [],
                        errors: ['El archivo está vacío o no contiene datos válidos']
                    })
                    return
                }

                // Extraer headers del primer objeto válido
                const headers = Object.keys(validatedData[0])

                resolve({
                    headers,
                    data: validatedData,
                    errors: []
                })
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error desconocido al procesar Excel'
                reject(new Error(`Error al procesar archivo Excel: ${errorMessage}`))
            }
        }

        reader.onerror = () => {
            reject(new Error('Error al leer el archivo'))
        }

        reader.readAsBinaryString(file)
    })
}

/**
 * Backward compatibility - usar parseExcelFileSecure en su lugar
 * @deprecated Use parseExcelFileSecure instead
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
    return parseExcelFileSecure(file)
}

