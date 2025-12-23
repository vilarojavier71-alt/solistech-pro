'use server'

// ✅ SECURITY: Usar parser seguro con validación estricta
// Aislamiento de vulnerabilidad xlsx (CVE GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9)
import * as XLSX from 'xlsx'
import { getCurrentUserWithRole } from '@/lib/session'
import {
    validateImportFile,
    validateRowCount,
    sanitizeImportData,
    IMPORT_LIMITS,
    checkImportRateLimit
} from '@/lib/security/import-security'

// ============================================
// TYPES AND INTERFACES
// ============================================

export interface DetectedColumn {
    originalName: string
    normalizedName: string
    sampleValues: (string | number | null)[]
    dataType: 'text' | 'number' | 'date' | 'email' | 'phone' | 'boolean'
    confidence: number
    nullCount: number
}

export interface MappingSuggestion {
    sourceColumn: string
    targetField: string
    confidence: number
    reason: string
    isCustomField: boolean
}

export interface ImportPreview {
    columns: DetectedColumn[]
    totalRows: number
    previewRows: Record<string, any>[]
    suggestions: MappingSuggestion[]
    warnings?: string[]
}

// ============================================
// FIELD ALIASES FOR SMART MAPPING
// ============================================

const FIELD_ALIASES: Record<string, string[]> = {
    // Customer fields
    full_name: ['nombre', 'nom', 'name', 'cliente', 'client', 'razon_social', 'empresa'],
    email: ['correo', 'mail', 'e_mail', 'email', 'correo_electronico'],
    phone: ['telefono', 'tlf', 'tel', 'movil', 'celular', 'phone', 'telf'],
    address: ['direccion', 'dir', 'calle', 'domicilio', 'address', 'direcció'],
    city: ['ciudad', 'localidad', 'municipio', 'city', 'poblacion'],
    postal_code: ['cp', 'codigo_postal', 'zip', 'postal', 'cod_postal'],
    province: ['provincia', 'prov', 'province'],
    nif: ['dni', 'cif', 'nif', 'documento', 'id', 'identificacion'],

    // Project fields
    name: ['proyecto', 'nombre_proyecto', 'project', 'obra'],
    status: ['estado', 'status', 'situacion'],
    start_date: ['fecha_inicio', 'inicio', 'start', 'fecha_comienzo'],
    end_date: ['fecha_fin', 'fin', 'end', 'fecha_finalizacion'],
    budget: ['presupuesto', 'coste', 'precio', 'importe', 'budget'],

    // Calculation fields
    system_size_kwp: ['potencia', 'kwp', 'kw', 'sistema', 'tamaño'],
    annual_consumption_kwh: ['consumo', 'kwh', 'consumo_anual'],
    estimated_production_kwh: ['produccion', 'generacion', 'production'],

    // Sales fields
    customer_name: ['cliente', 'nombre_cliente', 'customer', 'comprador', 'client_name'],
    amount: ['importe', 'total', 'precio', 'amount', 'monto', 'coste_total'],
    sale_date: ['fecha', 'date', 'fecha_venta', 'sale_date', 'fecha_compra'],
    payment_status: ['estado', 'status', 'pagado', 'paid', 'estado_pago', 'payment'],
    customer_phone: ['telefono', 'tlf', 'tel', 'phone', 'telefono_cliente'],
    customer_email: ['email', 'correo', 'mail', 'email_cliente'],

    // Visits fields
    start_time: ['hora', 'fecha', 'visita', 'cita', 'hora_visita', 'start', 'programada'],
    assigned_to_name: ['comercial', 'asignado', 'assigned', 'vendedor', 'responsable'],
    description: ['notas', 'detalles', 'descripcion', 'notes', 'observaciones'],

    // Stock/Inventory fields
    product_name: ['producto', 'product', 'articulo', 'item', 'nombre_producto'],
    quantity: ['cantidad', 'stock', 'unidades', 'qty', 'existencias'],
    price: ['precio', 'price', 'coste', 'valor', 'precio_unitario'],
    supplier: ['proveedor', 'supplier', 'fabricante', 'distribuidor'],
    sku: ['codigo', 'sku', 'referencia', 'ref', 'code']
}

// ============================================
// COLUMN DETECTION WITH SECURITY
// ============================================

/**
 * Detects columns from an uploaded Excel/CSV file
 * SECURED: File validation, row limits, CSV injection protection
 */
export async function detectColumnsSecure(
    fileBuffer: ArrayBuffer,
    fileName: string,
    fileSize: number
): Promise<ImportPreview> {
    try {
        // SECURITY CHECK 1: File size validation
        if (fileSize > IMPORT_LIMITS.MAX_FILE_SIZE) {
            throw new Error(`Archivo demasiado grande. Máximo ${IMPORT_LIMITS.MAX_FILE_SIZE / 1024 / 1024} MB`)
        }

        const warnings: string[] = []

        // Warn if file is large
        if (fileSize > 5 * 1024 * 1024) {
            warnings.push('Archivo grande detectado. La importación puede tardar varios minutos.')
        }

        // ✅ SECURITY: Parsear con opciones seguras para mitigar ReDoS y Prototype Pollution
        const workbook = XLSX.read(fileBuffer, { 
            type: 'array',
            cellDates: false, // Deshabilitar parsing de fechas para evitar ReDoS
            cellNF: false, // Deshabilitar formato de números para evitar ReDoS
            cellStyles: false, // Deshabilitar estilos para reducir superficie de ataque
            sheetStubs: false
        })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]

        // Convert to JSON con opciones seguras
        let data = XLSX.utils.sheet_to_json(sheet, { 
            defval: null,
            raw: false // Convertir todo a string para evitar tipos complejos
        }) as Record<string, any>[]

        // SECURITY: Defensive check for data array
        if (!Array.isArray(data)) {
            throw new Error('El formato del archivo no es válido (No se pudo leer como lista)')
        }

        // SECURITY CHECK 2: Row count validation
        const rowValidation = validateRowCount(data.length)
        if (!rowValidation.valid) {
            throw new Error(rowValidation.error)
        }

        // SECURITY CHECK 3: Sanitize all data to prevent CSV injection
        // Ensure data is still array after sanitization (though sanitization usually maps)
        const sanitized = sanitizeImportData(data)
        if (!Array.isArray(sanitized)) {
            throw new Error('Error interno en sanitización de datos')
        }
        data = sanitized

        if (data.length === 0) {
            throw new Error('El archivo está vacío')
        }

        // Get column names from first row
        // Defensive: Check if firstRow actually exists and is object
        const firstRow = data[0]
        if (!firstRow || typeof firstRow !== 'object') {
            throw new Error('No se pudieron detectar columnas (Fila 1 inválida)')
        }
        const columnNames = Object.keys(firstRow)

        // Analyze each column
        const detectedColumns: DetectedColumn[] = []

        for (const colName of columnNames) {
            const samples = data.slice(0, 10).map(row => row[colName])
            const allValues = data.map(row => row[colName])

            const detected: DetectedColumn = {
                originalName: colName,
                normalizedName: normalizeColumnName(colName),
                sampleValues: samples,
                dataType: inferDataType(samples),
                confidence: calculateTypeConfidence(samples),
                nullCount: allValues.filter(v => v === null || v === undefined || v === '').length
            }

            detectedColumns.push(detected)
        }

        // Generate mapping suggestions
        const suggestions = suggestMapping(detectedColumns)

        // Preview rows (first 5, already sanitized)
        const previewRows = data.slice(0, 5)

        return {
            columns: detectedColumns,
            totalRows: data.length,
            previewRows,
            suggestions,
            warnings: warnings.length > 0 ? warnings : undefined
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error detecting columns:', error)
        throw new Error(`Error al analizar el archivo: ${errorMessage}`)
    }
}

// Backward compatibility
export const detectColumns = detectColumnsSecure

// ============================================
// COLUMN NAME NORMALIZATION
// ============================================

function normalizeColumnName(name: string): string {
    return name
        .toLowerCase()
        .trim()
        // Remove accents
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace special characters with underscore
        .replace(/[^a-z0-9]/g, '_')
        // Remove multiple underscores
        .replace(/_+/g, '_')
        // Remove leading/trailing underscores
        .replace(/^_|_$/g, '')
}

// ============================================
// DATA TYPE INFERENCE
// ============================================

function inferDataType(samples: any[]): DetectedColumn['dataType'] {
    const nonNullSamples = samples.filter(s => s !== null && s !== undefined && s !== '')

    if (nonNullSamples.length === 0) return 'text'

    // Check for email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (nonNullSamples.every(s => typeof s === 'string' && emailPattern.test(s))) {
        return 'email'
    }

    // Check for phone
    const phonePattern = /^[\d\s\+\-\(\)]{9,}$/
    if (nonNullSamples.every(s => typeof s === 'string' && phonePattern.test(s))) {
        return 'phone'
    }

    // Check for number
    if (nonNullSamples.every(s => !isNaN(Number(s)))) {
        return 'number'
    }

    // Check for date
    if (nonNullSamples.every(s => !isNaN(Date.parse(String(s))))) {
        return 'date'
    }

    // Check for boolean
    const boolValues = ['true', 'false', 'yes', 'no', 'si', 'no', '1', '0']
    if (nonNullSamples.every(s => boolValues.includes(String(s).toLowerCase()))) {
        return 'boolean'
    }

    return 'text'
}

function calculateTypeConfidence(samples: any[]): number {
    const nonNullSamples = samples.filter(s => s !== null && s !== undefined && s !== '')
    if (nonNullSamples.length === 0) return 0

    const dataType = inferDataType(samples)
    let matches = 0

    for (const sample of nonNullSamples) {
        switch (dataType) {
            case 'email':
                if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(sample))) matches++
                break
            case 'phone':
                if (/^[\d\s\+\-\(\)]{9,}$/.test(String(sample))) matches++
                break
            case 'number':
                if (!isNaN(Number(sample))) matches++
                break
            case 'date':
                if (!isNaN(Date.parse(String(sample)))) matches++
                break
            default:
                matches++
        }
    }

    return matches / nonNullSamples.length
}

// ============================================
// SMART MAPPING WITH CACHE
// ============================================

// Cache for Levenshtein calculations
const levenshteinCache = new Map<string, number>()

function suggestMapping(columns: DetectedColumn[]): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = []

    for (const col of columns) {
        let bestMatch: MappingSuggestion | null = null
        let bestScore = 0

        // Try to match with standard fields
        for (const [fieldName, aliases] of Object.entries(FIELD_ALIASES)) {
            const score = calculateSimilarity(col.normalizedName, aliases)

            if (score > bestScore && score > 0.6) {
                bestScore = score
                bestMatch = {
                    sourceColumn: col.originalName,
                    targetField: fieldName,
                    confidence: score,
                    reason: `Similitud con "${aliases[0]}"`,
                    isCustomField: false
                }
            }
        }

        if (bestMatch) {
            suggestions.push(bestMatch)
        } else {
            // No match found - suggest custom field
            suggestions.push({
                sourceColumn: col.originalName,
                targetField: `custom_attributes.${col.normalizedName}`,
                confidence: 1.0,
                reason: 'Campo personalizado',
                isCustomField: true
            })
        }
    }

    return suggestions
}

// ============================================
// OPTIMIZED LEVENSHTEIN WITH CACHE
// ============================================

function calculateSimilarity(text: string, aliases: string[]): number {
    let maxSimilarity = 0

    for (const alias of aliases) {
        const distance = levenshteinDistanceOptimized(text, alias)
        const maxLength = Math.max(text.length, alias.length)
        const similarity = 1 - (distance / maxLength)

        maxSimilarity = Math.max(maxSimilarity, similarity)
    }

    return maxSimilarity
}

function levenshteinDistanceOptimized(str1: string, str2: string): number {
    const key = `${str1}:${str2}`
    if (levenshteinCache.has(key)) return levenshteinCache.get(key)!

    // Early exit if difference in length is too large
    if (Math.abs(str1.length - str2.length) > 5) {
        levenshteinCache.set(key, 999)
        return 999
    }

    // Optimized algorithm using only 2 arrays instead of full matrix
    let prev = Array.from({ length: str2.length + 1 }, (_, i) => i)
    let curr = Array(str2.length + 1)

    for (let i = 1; i <= str1.length; i++) {
        curr[0] = i
        for (let j = 1; j <= str2.length; j++) {
            curr[j] = str1[i - 1] === str2[j - 1]
                ? prev[j - 1]
                : Math.min(prev[j - 1], prev[j], curr[j - 1]) + 1
        }
        [prev, curr] = [curr, prev]
    }

    const result = prev[str2.length]
    levenshteinCache.set(key, result)
    return result
}

// ============================================
// SAVE IMPORT TEMPLATE
// ============================================

export async function saveImportTemplate(
    name: string,
    description: string,
    entityType: 'customers' | 'projects' | 'calculations',
    columnMapping: Record<string, string>,
    importConfig: Record<string, any>
) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!userData) throw new Error('Usuario no encontrado')

        const { data, error } = await supabase
            .from('import_templates')
            .insert({
                organization_id: userData.organization_id,
                name,
                description,
                entity_type: entityType,
                column_mapping: columnMapping,
                import_config: importConfig,
                created_by: user.id
            })
            .select()
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error saving template:', error)
        return { success: false, error: errorMessage }
    }
}

// ============================================
// GET IMPORT TEMPLATES
// ============================================

export async function getImportTemplates(entityType?: string) {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('No autenticado')

        const { data: userData } = await supabase
            .from('users')
            .select('organization_id')
            .eq('id', user.id)
            .single()

        if (!userData) throw new Error('Usuario no encontrado')

        let query = supabase
            .from('import_templates')
            .select('*')
            .eq('organization_id', userData.organization_id)
            .order('last_used_at', { ascending: false, nullsFirst: false })

        if (entityType) {
            query = query.eq('entity_type', entityType)
        }

        const { data, error } = await query

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error getting templates:', error)
        return { success: false, error: errorMessage }
    }
}

