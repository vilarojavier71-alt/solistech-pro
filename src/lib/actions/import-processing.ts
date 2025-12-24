'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import {
    validateCustomFields,
    // sanitizeCSVInjection, // Not used in Prisma version
    // validateSpanishNIF, // Not used in Prisma version
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
        // Cast to any to avoid "Property 'errors' does not exist" if Zod versions mismatch or type inference fails
        (parseResult.error as any).errors.forEach((err: any) => {
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
    try {
        const user = await getCurrentUserWithRole()
        if (!user?.id) throw new Error('No autenticado')

        const userId = user.id
        // user already has organizationId, but let's be safe and verify via DB if needed, 
        // or just use user.organizationId if we trust the session (we should).
        // But for consistency with original logic, let's just use the ID.
        // Wait, original logic fetched from DB. 
        // And user.organizationId is what we want.

        let organizationId = user.organizationId
        if (!organizationId) {
            const userDb = await prisma.user.findUnique({
                where: { id: userId },
                select: { organization_id: true }
            })
            organizationId = userDb?.organization_id || null
        }

        if (!organizationId) throw new Error('Organización no encontrada')

        // SECURITY CHECK: Rate limiting
        const recentJobsCount = await prisma.importJob.count({
            where: {
                created_by: userId,
                created_at: {
                    gte: new Date(Date.now() - IMPORT_LIMITS.RATE_LIMIT_WINDOW)
                }
            }
        })

        const rateLimitCheck = await checkImportRateLimit(userId, recentJobsCount)
        if (!rateLimitCheck.allowed) {
            throw new Error(rateLimitCheck.error)
        }

        // ✅ SECURITY: Parsear con opciones seguras
        const XLSX = await import('xlsx')
        const workbook = XLSX.read(fileBuffer, {
            type: 'array',
            cellDates: false,
            cellNF: false,
            cellStyles: false,
            sheetStubs: false
        })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(sheet, {
            defval: null,
            raw: false
        }) as Record<string, any>[]

        // Create import job
        const job = await prisma.importJob.create({
            data: {
                organization_id: organizationId,
                entity_type: options.entityType,
                file_name: 'import.xlsx',
                total_rows: Array.isArray(data) ? data.length : 0,
                status: 'processing',
                column_mapping: options.columnMapping as any, // Json
                created_by: userId,
                // created_at defaults to now
            }
        })

        if (!Array.isArray(data)) {
            await prisma.importJob.update({
                where: { id: job.id },
                data: {
                    status: 'failed',
                    errors: [{ row: 0, field: 'file', message: 'Datos corruptos', value: null }] as any
                }
            })
            throw new Error('El archivo no contiene un formato válido')
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

            // PHASE 1: Validate ALL rows in batch first
            for (let j = 0; j < batch.length; j++) {
                const row = batch[j]
                if (!row) continue

                const rowNumber = (batchIndex * batchSize) + j + 2

                const validated = validateAndTransformRow(
                    row,
                    rowNumber,
                    options.columnMapping,
                    options.entityType
                )

                processedRows++

                if (validated.errors && validated.errors.length > 0) {
                    failedRows++
                    validated.errors.forEach(err => {
                        allErrors.push({
                            row: rowNumber,
                            field: err.field,
                            message: err.message,
                            value: row[Object.keys(options.columnMapping).find(k => options.columnMapping[k] === err.field) || '']
                        })
                    })
                    continue
                }

                // Prepare record
                // Merge import_metadata into custom_attributes to verify persistence
                const importMeta = {
                    imported_at: new Date().toISOString(),
                    import_job_id: job.id,
                    source_row: rowNumber
                }

                const finalCustomAttributes = {
                    ...validated.customFields,
                    import_metadata: importMeta
                }

                const record: any = {
                    ...validated.standardFields,
                    organization_id: organizationId,
                    custom_attributes: finalCustomAttributes,
                    updated_at: new Date()
                }

                if (!record.created_at) record.created_at = new Date()

                // DUPLICATE CHECK
                if (options.skipDuplicates || options.updateExisting) {
                    let existing = null
                    const modelDelegate = getDelegate(options.entityType)

                    if (modelDelegate) {
                        try {
                            // Type-safe(r) duplicate checking
                            if (options.entityType === 'customers') {
                                if (record.email) existing = await prisma.customer.findFirst({ where: { organization_id: organizationId, email: record.email }, select: { id: true } })
                                else if (record.name) existing = await prisma.customer.findFirst({ where: { organization_id: organizationId, name: record.name }, select: { id: true } }) // name is mandatory
                            } else if (options.entityType === 'projects') {
                                if (record.name) existing = await prisma.project.findFirst({ where: { organization_id: organizationId, name: record.name }, select: { id: true } })
                            } else if (options.entityType === 'sales') {
                                if (record.customer_name && record.sale_date) {
                                    existing = await prisma.sale.findFirst({
                                        where: {
                                            organization_id: organizationId,
                                            customer_name: record.customer_name,
                                            sale_date: record.sale_date
                                        },
                                        select: { id: true }
                                    })
                                }
                            } else if (options.entityType === 'visits') {
                                if (record.customer_name && record.start_time) {
                                    existing = await prisma.appointment.findFirst({ // Assuming visits map to appointments
                                        where: {
                                            organization_id: organizationId,
                                            customer_name: record.customer_name,
                                            start_time: record.start_time
                                        },
                                        select: { id: true }
                                    })
                                }
                            } else if (options.entityType === 'stock') {
                                if (record.product_name) {
                                    existing = await prisma.inventoryItem.findFirst({ // Assuming stock maps to inventory_items
                                        where: { organization_id: organizationId, name: record.product_name },
                                        select: { id: true }
                                    })
                                } else if (record.sku) {
                                    existing = await prisma.inventoryItem.findFirst({
                                        where: { organization_id: organizationId, sku: record.sku },
                                        select: { id: true }
                                    })
                                }
                            }
                        } catch (dupErr) {
                            console.error('Duplicate check error:', dupErr)
                        }
                    }

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

            // PHASE 2: INSERT
            if (recordsToInsert.length > 0) {
                // Use switch to select Prisma model delegate
                // We have to iterate or use createMany. createMany cannot return IDs easily but we don't strictly need them here.
                // But validation errors inside DB (e.g. constraints) will fail the whole batch in createMany?
                // createMany is transaction-safe but if one fails, all fail? Yes.
                // Let's try createMany for speed, fallback to individual if error?
                // Or just individual.

                // Using strict switch for type safety
                try {
                    const modelDelegate = getDelegate(options.entityType)
                    if (modelDelegate) {
                        // Batch insert using createMany
                        await modelDelegate.createMany({ data: recordsToInsert })
                        successfulRows += recordsToInsert.length
                    } else {
                        throw new Error(`Model delegate not found for ${options.entityType}`)
                    }
                } catch (err: any) {
                    // Fallback: one by one
                    const modelDelegate = getDelegate(options.entityType)
                    if (modelDelegate) {
                        for (const rec of recordsToInsert) {
                            try {
                                await modelDelegate.create({ data: rec })
                                successfulRows++
                            } catch (singleErr: any) {
                                failedRows++
                                allErrors.push({
                                    row: rec.custom_attributes?.import_metadata?.source_row || 0,
                                    field: 'db_insert',
                                    message: singleErr.message,
                                    value: null
                                })
                            }
                        }
                    }
                }
            }

            // PHASE 3: UPDATE
            const modelDelegate = getDelegate(options.entityType)
            if (modelDelegate) {
                for (const { id, record } of recordsToUpdate) {
                    try {
                        const { created_at, ...updateData } = record // proper clean
                        await modelDelegate.update({
                            where: { id },
                            data: updateData
                        })
                        successfulRows++
                    } catch (updateErr: any) {
                        failedRows++
                        allErrors.push({
                            row: record.custom_attributes?.import_metadata?.source_row || 0,
                            field: 'db_update',
                            message: updateErr.message,
                            value: null
                        })
                    }
                }
            }

            // Progress update
            await prisma.importJob.update({
                where: { id: job.id },
                data: {
                    processed_rows: processedRows,
                    successful_rows: successfulRows,
                    failed_rows: failedRows,
                    skipped_rows: skippedRows
                }
            })

            // Delay
            if (batchIndex < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100))
            }
        }

        // Complete
        await prisma.importJob.update({
            where: { id: job.id },
            data: {
                status: failedRows === data.length ? 'failed' : 'completed',
                completed_at: new Date(),
                errors: allErrors as any
            }
        })

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

// Helper to get Prisma delegate
function getDelegate(entityType: string): any {
    switch (entityType) {
        case 'customers': return prisma.customer
        case 'projects': return prisma.project
        case 'sales': return prisma.sale
        case 'visits': return prisma.appointment // Mapping 'visits' to 'appointments'? Check schema.
        case 'calculations': return prisma.calculation
        case 'stock': return prisma.inventoryItem // Assuming mapping
        default: return (prisma as any)[entityType] // Fallback
    }
}

// ============================================
// GET IMPORT JOB STATUS
// ============================================

export async function getImportJobStatus(jobId: string) {
    try {
        const job = await prisma.importJob.findUnique({
            where: { id: jobId }
        })

        if (!job) throw new Error('Job not found')

        return { success: true, data: job }
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
    try {
        const session = await getCurrentUserWithRole()
        if (!session?.id) throw new Error('No autenticado')
        const userId = session.id

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { organization_id: true }
        })
        if (!user?.organization_id) throw new Error('User org not found')

        const jobs = await prisma.importJob.findMany({
            where: {
                organization_id: user.organization_id,
                ...(entityType ? { entity_type: entityType } : {})
            },
            orderBy: { created_at: 'desc' },
            take: limit
        })

        return { success: true, data: jobs }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error getting import history:', error)
        return { success: false, error: errorMessage }
    }
}
