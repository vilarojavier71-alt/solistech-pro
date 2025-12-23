'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import {
    validateCustomFields,
    sanitizeCSVInjection,
    validateSpanishNIF,
    checkImportRateLimit,
    createBatches,
    IMPORT_LIMITS
} from '@/lib/security/import-security'

// ============================================
// TYPES
// ============================================

export interface ImportRow {
    rowNumber: number
    standardFields: Record<string, any>
    customFields: Record<string, any>
    errors: Array<{ field: string; message: string }>
    warnings: Array<{ field: string; message: string }>
}

export interface ProcessImportOptions {
    entityType: 'customers' | 'projects' | 'calculations' | 'sales' | 'visits' | 'stock'
    columnMapping: Record<string, string>
    skipDuplicates: boolean
    updateExisting: boolean
    batchSize?: number
}

export interface ImportResult {
    jobId: string
    totalRows: number
    processedRows: number
    successfulRows: number
    failedRows: number
    skippedRows: number
    errors: Array<{ row: number; field: string; message: string; value: any }>
}

// ============================================
// ENHANCED FIELD VALIDATORS
// ============================================

import { SCHEMA_MAP } from '@/lib/schemas/import-validation'

// ... (previous imports)

// ============================================
// VALIDATE AND TRANSFORM ROW (ZOD POWERED)
// ============================================

function validateAndTransformRow(
    row: Record<string, any>,
    rowNumber: number,
    mapping: Record<string, string>,
    entityType: string
): ImportRow {
    const result: ImportRow = {
        rowNumber,
        standardFields: {},
        customFields: {},
        errors: [],
        warnings: []
    }

    const candidateObj: Record<string, any> = {}

    // 1. Map columns to Schema Keys
    for (const [sourceCol, targetField] of Object.entries(mapping)) {
        const value = row[sourceCol]
        if (value === undefined || value === null || value === '') continue // Skip empty for now

        if (targetField.startsWith('custom_attributes.')) {
            const fieldName = targetField.replace('custom_attributes.', '')
            result.customFields[fieldName] = value
        } else {
            // Basic basic transformation before Zod (e.g. trim strings)
            candidateObj[targetField] = typeof value === 'string' ? value.trim() : value
        }
    }

    // 2. Schema Validation (The Ironclad Shield)
    // @ts-ignore - dynamic key access
    const Schema = SCHEMA_MAP[entityType as keyof typeof SCHEMA_MAP]

    if (!Schema) {
        // Fallback for entities without strict schema yet
        result.standardFields = candidateObj
        result.warnings.push({ field: 'general', message: 'Validación estricta no disponible para este tipo' })
        return result
    }

    const parseResult = Schema.safeParse(candidateObj)

    if (parseResult.success) {
        result.standardFields = parseResult.data
    } else {
        // Map Zod errors
        parseResult.error.errors.forEach((err: any) => {
            result.errors.push({
                field: err.path.join('.'),
                message: err.message
            })
        })
    }

    // 3. Custom Fields Security
    if (Object.keys(result.customFields).length > 0) {
        const customValidation = validateCustomFields(result.customFields)
        if (!customValidation.valid) {
            result.errors.push({
                field: 'custom_attributes',
                message: customValidation.error || 'Meta-datos inválidos'
            })
        } else {
            result.customFields = customValidation.sanitized
        }
    }

    return result
}


// ============================================
// PROCESS IMPORT WITH SECURITY
// ============================================

export async function processImport(
    fileBuffer: ArrayBuffer,
    options: ProcessImportOptions
): Promise<ImportResult> {
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

        // SECURITY CHECK: Rate limiting
        const { data: recentImports } = await supabase
            .from('import_jobs')
            .select('id')
            .eq('created_by', user.id)
            .gte('created_at', new Date(Date.now() - IMPORT_LIMITS.RATE_LIMIT_WINDOW).toISOString())

        const rateLimitCheck = await checkImportRateLimit(user.id, recentImports?.length || 0)
        if (!rateLimitCheck.allowed) {
            throw new Error(rateLimitCheck.error)
        }

        // ✅ SECURITY: Parsear con opciones seguras para mitigar ReDoS y Prototype Pollution
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(fileBuffer, { 
            type: 'array',
            cellDates: false, // Deshabilitar parsing de fechas para evitar ReDoS
            cellNF: false, // Deshabilitar formato de números para evitar ReDoS
            cellStyles: false, // Deshabilitar estilos para reducir superficie de ataque
            sheetStubs: false
        })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(sheet, { 
            defval: null,
            raw: false // Convertir todo a string para evitar tipos complejos
        }) as Record<string, any>[]

        // Create import job
        const { data: job, error: jobError } = await supabase
            .from('import_jobs')
            .insert({
                organization_id: userData.organization_id,
                entity_type: options.entityType,
                file_name: 'import.xlsx',
                total_rows: Array.isArray(data) ? data.length : 0,
                status: 'processing',
                column_mapping: options.columnMapping,
                started_at: new Date().toISOString(),
                created_by: user.id
            })
            .select()
            .single()

        if (jobError || !job) {
            console.error("🔥 SUPABASE INSERT ERROR:", JSON.stringify(jobError, null, 2));
            throw new Error(`Error creating import job: ${jobError?.message} (${jobError?.code})`);
        }

        if (!Array.isArray(data)) {
            await supabase.from('import_jobs').update({ status: 'failed', errors: [{ row: 0, field: 'file', message: 'Datos ilegibles o corruptos (No array)', value: null }] }).eq('id', job.id)
            throw new Error('El archivo no contiene un formato de lista válido')
        }

        // OPTIMIZATION: Process in batches
        const batchSize = options.batchSize || 100
        const batches = createBatches(data || [], batchSize)

        let processedRows = 0
        let successfulRows = 0
        let failedRows = 0
        let skippedRows = 0
        const allErrors: ImportResult['errors'] = []

        const safeBatches = Array.isArray(batches) ? batches : []

        for (let batchIndex = 0; batchIndex < safeBatches.length; batchIndex++) {
            const batch = safeBatches[batchIndex]
            if (!Array.isArray(batch)) continue

            const recordsToInsert: any[] = []
            const recordsToUpdate: Array<{ id: string; record: any }> = []

            // PHASE 1: Validate ALL rows in batch first (atomic)
            for (let j = 0; j < batch.length; j++) {
                const row = batch[j]
                if (!row) continue

                const rowNumber = (batchIndex * batchSize) + j + 2 // +2 for Excel (1-indexed + header)

                // Validate and transform
                const validated = validateAndTransformRow(
                    row,
                    rowNumber,
                    options.columnMapping,
                    options.entityType
                )

                processedRows++

                // Skip if errors
                if (validated.errors && validated.errors.length > 0) {
                    failedRows++
                    // Defensive check on errors array
                    if (Array.isArray(validated.errors)) {
                        validated.errors.forEach(err => {
                            allErrors.push({
                                row: rowNumber,
                                field: err?.field || 'unknown',
                                message: err?.message || 'Error desconocido',
                                value: row[Object.keys(options.columnMapping).find(k => options.columnMapping[k] === err.field) || '']
                            })
                        })
                    }
                    continue
                }

                // ... (rest of phase 1)


                // Prepare record
                const record = {
                    ...validated.standardFields,
                    organization_id: userData.organization_id,
                    custom_attributes: validated.customFields,
                    import_metadata: {
                        imported_at: new Date().toISOString(),
                        import_job_id: job.id,
                        source_row: rowNumber
                    }
                }

                // Check for duplicates (flexible per entity type)
                if (options.skipDuplicates || options.updateExisting) {
                    let duplicateQuery = supabase
                        .from(options.entityType)
                        .select('id')
                        .eq('organization_id', userData.organization_id)

                    // Build duplicate detection based on entity type
                    const standardFields = validated.standardFields as Record<string, any>

                    switch (options.entityType) {
                        case 'customers':
                            if (standardFields.email) {
                                duplicateQuery = duplicateQuery.eq('email', standardFields.email)
                            } else if (standardFields.full_name) {
                                duplicateQuery = duplicateQuery.eq('full_name', standardFields.full_name)
                            }
                            break
                        case 'projects':
                            if (standardFields.name) {
                                duplicateQuery = duplicateQuery.eq('name', standardFields.name)
                            }
                            break
                        case 'sales':
                            if (standardFields.customer_name && standardFields.sale_date) {
                                duplicateQuery = duplicateQuery
                                    .eq('customer_name', standardFields.customer_name)
                                    .eq('sale_date', standardFields.sale_date)
                            }
                            break
                        case 'visits':
                            if (standardFields.customer_name && standardFields.start_time) {
                                duplicateQuery = duplicateQuery
                                    .eq('customer_name', standardFields.customer_name)
                                    .eq('start_time', standardFields.start_time)
                            }
                            break
                        case 'stock':
                            if (standardFields.product_name) {
                                duplicateQuery = duplicateQuery.eq('product_name', standardFields.product_name)
                            } else if (standardFields.sku) {
                                duplicateQuery = duplicateQuery.eq('sku', standardFields.sku)
                            }
                            break
                        default:
                            // For calculations and others, skip duplicate check
                            break
                    }

                    const { data: existing } = await duplicateQuery.limit(1).maybeSingle()

                    if (existing) {
                        if (options.skipDuplicates) {
                            skippedRows++
                            continue
                        } else if (options.updateExisting) {
                            recordsToUpdate.push({ id: existing.id, record })
                            continue
                        }
                    }
                }

                recordsToInsert.push(record)
            }

            // PHASE 2: Insert all valid records in batch (more atomic)
            if (recordsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from(options.entityType)
                    .insert(recordsToInsert)

                if (insertError) {
                    // Batch insert failed, try one by one
                    for (const record of recordsToInsert) {
                        const { error: singleError } = await supabase
                            .from(options.entityType)
                            .insert(record)

                        if (singleError) {
                            failedRows++
                            allErrors.push({
                                row: record.import_metadata.source_row,
                                field: 'general',
                                message: singleError.message,
                                value: null
                            })
                        } else {
                            successfulRows++
                        }
                    }
                } else {
                    successfulRows += recordsToInsert.length
                }
            }

            // PHASE 3: Update existing records
            for (const { id, record } of recordsToUpdate) {
                const { error: updateError } = await supabase
                    .from(options.entityType)
                    .update(record)
                    .eq('id', id)

                if (updateError) {
                    failedRows++
                    allErrors.push({
                        row: record.import_metadata.source_row,
                        field: 'general',
                        message: updateError.message,
                        value: null
                    })
                } else {
                    successfulRows++
                }
            }

            // Update job progress after each batch
            await supabase
                .from('import_jobs')
                .update({
                    processed_rows: processedRows,
                    successful_rows: successfulRows,
                    failed_rows: failedRows,
                    skipped_rows: skippedRows
                })
                .eq('id', job.id)

            // Small delay between batches to prevent server overload
            if (batchIndex < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        }

        // Complete job
        await supabase
            .from('import_jobs')
            .update({
                status: failedRows === data.length ? 'failed' : 'completed',
                completed_at: new Date().toISOString(),
                errors: allErrors
            })
            .eq('id', job.id)

        return {
            jobId: job.id,
            totalRows: data.length,
            processedRows,
            successfulRows,
            failedRows,
            skippedRows,
            errors: allErrors
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error processing import:', error)
        throw new Error(`Error al procesar importación: ${errorMessage}`)
    }
}

// ============================================
// GET IMPORT JOB STATUS
// ============================================

export async function getImportJobStatus(jobId: string) {
    const supabase = await createClient()

    try {
        const { data, error } = await supabase
            .from('import_jobs')
            .select('*')
            .eq('id', jobId)
            .single()

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error getting job status:', error)
        return { success: false, error: errorMessage }
    }
}

// ============================================
// GET IMPORT HISTORY
// ============================================

export async function getImportHistory(entityType?: string, limit: number = 10) {
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
            .from('import_jobs')
            .select('*')
            .eq('organization_id', userData.organization_id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (entityType) {
            query = query.eq('entity_type', entityType)
        }

        const { data, error } = await query

        if (error) throw error

        return { success: true, data }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error getting import history:', error)
        return { success: false, error: errorMessage }
    }
}

