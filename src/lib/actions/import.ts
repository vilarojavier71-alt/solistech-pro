'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import type {
    CustomerImportRow,
    LeadImportRow,
    VisitImportRow,
    SaleImportRow,
    StockImportRow
} from '@/lib/types/import-types'

interface ImportResult {
    success: number
    errors: string[]
}

// HELPER: Robust Context Retrieval
async function getImportContext() {
    // 1. Get Session User
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado (Sesión inválida)')

    // 2. Get Admin Client (bypasses RLS for bulk inserts)
    const supabase = createAdminClient()

    // 3. Verify Organization (DB Source of Truth)
    const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) throw new Error('Usuario sin organización asignada en BD.')

    return {
        supabase,
        user,
        organizationId: profile.organization_id
    }
}

// Import customers from parsed CSV data
export async function importCustomers(data: CustomerImportRow[]): Promise<ImportResult> {
    const { supabase, user, organizationId } = await getImportContext()

    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            if (!row.name && !row.Nombre && !row.nombre) {
                errors.push(`Fila sin nombre: ${JSON.stringify(row)}`)
                continue
            }
            // ... insert logic ...
            const customerData = {
                organization_id: organizationId,
                name: row.name || row.Nombre || row.nombre,
                email: row.email || row.Email || null,
                phone: row.phone || row.telefono || row.Teléfono || row.Telefono || null,
                company: row.company || row.empresa || row.Empresa || null,
                tax_id: row.tax_id || row.cif || row.CIF || row.nif || row.NIF || null,
                address: {
                    street: row.street || row.calle || row.Calle || null,
                    city: row.city || row.ciudad || row.Ciudad || null,
                    postal_code: row.postal_code || row.cp || row.CP || null,
                    state: row.state || row.provincia || row.Provincia || null,
                    country: row.country || row.pais || row.País || 'España'
                },
                created_by: user.id
            }

            const { error } = await supabase.from('customers').insert(customerData)

            if (error) {
                errors.push(`Error insertando ${customerData.name}: ${error.message}`)
            } else {
                success++
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            errors.push(`Excepción en fila: ${errorMessage}`)
        }
    }
    revalidatePath('/dashboard/customers')
    return { success, errors }
}

// Import leads from parsed CSV data
export async function importLeads(data: LeadImportRow[]): Promise<ImportResult> {
    const { supabase, user, organizationId } = await getImportContext()

    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            if (!row.name && !row.Nombre && !row.nombre) {
                errors.push(`Lead sin nombre: ${JSON.stringify(row)}`)
                continue
            }
            // ... insert logic ...
            const leadData = {
                organization_id: organizationId,
                name: row.name || row.Nombre || row.nombre,
                email: row.email || row.Email || null,
                phone: row.phone || row.telefono || row.Teléfono || row.Telefono || null,
                company: row.company || row.empresa || row.Empresa || null,
                source: parseSource(row.source || row.origen || row.Origen),
                status: parseStatus(row.status || row.estado || row.Estado),
                estimated_value: parseFloat(String(row.estimated_value || row.valor || row.Valor || '0')),
                notes: row.notes || row.notas || row.Notas || null,
                created_by: user.id,
                assigned_to: user.id
            }
            const { error } = await supabase.from('leads').insert(leadData)
            if (error) {
                errors.push(`Error insertando lead ${leadData.name}: ${error.message}`)
            } else {
                success++
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            errors.push(`Excepción en lead: ${errorMessage}`)
        }
    }
    revalidatePath('/dashboard/leads')
    return { success, errors }
}

// ... helper functions ...
function parseSource(value: string | undefined): string {
    if (!value) return 'other'
    const val = value.toLowerCase()
    if (val.includes('web')) return 'web'
    if (val.includes('referencia') || val.includes('referral')) return 'referral'
    if (val.includes('llamada') || val.includes('cold')) return 'cold_call'
    if (val.includes('social') || val.includes('redes')) return 'social_media'
    return 'other'
}

function parseStatus(value: string | undefined): string {
    if (!value) return 'new'
    const val = value.toLowerCase()
    if (val.includes('nuevo') || val.includes('new')) return 'new'
    if (val.includes('contactado') || val.includes('contacted')) return 'contacted'
    if (val.includes('cualificado') || val.includes('qualified')) return 'qualified'
    if (val.includes('propuesta') || val.includes('proposal')) return 'proposal'
    if (val.includes('ganado') || val.includes('won')) return 'won'
    if (val.includes('perdido') || val.includes('lost')) return 'lost'
    return 'new'
}

// Import visits (appointments) with flexible metadata
export async function importVisits(data: VisitImportRow[]): Promise<ImportResult> {
    const { supabase, user, organizationId } = await getImportContext()

    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            // standardized lookups
            const clientName = row['customer_name'] || row['Cliente_Nombre'] || row['cliente_nombre'] || row['Nombre'] || row['name']
            const phone = row['customer_phone'] || row['Cliente_Telefono'] || row['cliente_telefono'] || row['Telefono'] || row['phone']
            const visitTimeStr = row['start_time'] || row['Hora_Visita_Programada'] || row['hora_visita'] || row['Hora']
            const statusRaw = row['status'] || row['Estado_Visita'] || row['estado'] || 'scheduled'
            const descriptionRaw = row['description'] || row['Detalle_Lead'] || row['notas'] || null


            if (!clientName) {
                errors.push(`Visita sin nombre de cliente: ${JSON.stringify(row)}`)
                continue
            }

            let visitDate = new Date()
            if (row['Timestamp_Envio_WA']) {
                visitDate = new Date(row['Timestamp_Envio_WA'])
            }
            if (visitTimeStr && typeof visitTimeStr === 'string' && visitTimeStr.includes(':')) {
                const [hours, minutes] = visitTimeStr.includes(':') ? visitTimeStr.split(':').map(Number) : [9, 0]
                visitDate.setHours(hours || 9, minutes || 0, 0, 0)
            }

            const metadata = { ...row }

            let customerId = null
            if (clientName) {
                let query = supabase.from('customers').select('id').eq('organization_id', organizationId)
                if (phone) query = query.eq('phone', phone)
                else query = query.eq('name', clientName)

                const { data: existingCustomer } = await query.maybeSingle()

                if (existingCustomer) {
                    customerId = existingCustomer.id
                } else {
                    const { data: newCustomer, error: createError } = await supabase
                        .from('customers')
                        .insert({
                            organization_id: organizationId,
                            name: clientName,
                            phone: phone,
                            created_by: user.id
                        })
                        .select()
                        .single()
                    if (!createError && newCustomer) customerId = newCustomer.id
                }
            }

            const appointmentData = {
                organization_id: organizationId,
                title: `Visita: ${clientName}`,
                description: descriptionRaw || `Visita comercial con ${clientName}`,
                start_time: visitDate.toISOString(),
                end_time: new Date(visitDate.getTime() + 60 * 60 * 1000).toISOString(),
                customer_id: customerId,
                status: mapStatus(statusRaw),
                metadata: metadata,
                created_by: user.id
            }

            let { error } = await supabase.from('appointments').insert(appointmentData)

            // Fallback: If metadata column missing, try inserting without it
            if (error && error.message.includes('metadata')) {
                console.warn('Metadata column missing, retrying without metadata')
                const { metadata, ...dataWithoutMetadata } = appointmentData
                const retry = await supabase.from('appointments').insert(dataWithoutMetadata)
                error = retry.error
                if (!error) {
                    errors.push(`Advertencia: Visita ${clientName} importada PERO sin datos extra (falta columna metadata en BD)`)
                }
            }

            if (error) {
                errors.push(`Error creando visita ${clientName}: ${error.message}`)
            } else {
                if (!error) success++ // Increment success unless we already pushed a warning error
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            errors.push(`Excepción en visita: ${errorMessage}`)
        }
    }
    revalidatePath('/dashboard/calendar')
    revalidatePath('/dashboard/calendar')
    return { success, errors }
}

function mapStatus(status: string): string {
    const s = status ? status.toLowerCase() : ''
    if (s.includes('confirmada') || s.includes('ok')) return 'scheduled'
    if (s.includes('cancel')) return 'cancelled'
    if (s.includes('realizada') || s.includes('done')) return 'completed'
    return 'scheduled'
}

// Import sales with flexible metadata
export async function importSales(data: SaleImportRow[]): Promise<ImportResult> {
    const { supabase, user, organizationId } = await getImportContext()

    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            // 1. Identify Core Fields
            // 1. Identify Core Fields (Prioritizing mapped internal keys)
            const clientName = row['customer_name'] || row['Cliente_Nombre'] || row['cliente_nombre'] || row['Nombre'] || row['name']
            const phone = row['customer_phone'] || row['Cliente_Telefono'] || row['Telefono'] || row['phone']
            const dateStr = row['sale_date'] || row['Fecha_Venta'] || row['Fecha'] || row['date'] || row['created_at']
            const amountStr = row['amount'] || row['Importe'] || row['Total'] || row['Precio'] || '0'
            const statusRaw = row['payment_status'] || row['Estado_Venta'] || row['Estado'] || row['status'] || 'draft'
            const emailStr = row['customer_email'] || row['Email'] || row['Correo'] || null
            const dniStr = row['dni'] || row['DNI'] || row['NIF'] || null

            if (!clientName) {
                errors.push(`Venta sin cliente: ${JSON.stringify(row)}`)
                continue
            }

            // 2. Parse Date
            let saleDate = new Date()
            if (dateStr) {
                const parsed = new Date(dateStr)
                if (!isNaN(parsed.getTime())) saleDate = parsed
            }

            // 3. Parse Amount
            const totalAmount = parseFloat(String(amountStr).replace(/[^0-9.-]+/g, '')) || 0

            // 4. Metadata
            const metadata = { ...row }

            // 5. Find/Create Customer
            let customerId = null
            let customerDni = null
            let customerEmail = null
            if (clientName) {
                let query = supabase.from('customers').select('id, tax_id, email').eq('organization_id', organizationId)
                if (phone) query = query.eq('phone', phone)
                else query = query.eq('name', clientName)

                const { data: existing } = await query.maybeSingle()

                if (existing) {
                    customerId = existing.id
                    customerDni = existing.tax_id
                    customerEmail = existing.email
                } else {
                    const { data: newCust, error: createError } = await supabase
                        .from('customers')
                        .insert({
                            organization_id: organizationId,
                            name: clientName,
                            phone: phone,
                            created_by: user.id
                        })
                        .select()
                        .single()
                    if (newCust) customerId = newCust.id
                }
            }

            // 6. Create Sale
            // 6. Create Sale
            // Priority: CSV DNI > Customer Saved DNI > Placeholder
            const finalDni = dniStr || customerDni || `PENDING-${Date.now().toString().slice(-6)}`

            // Priority: CSV Email > Customer Saved Email > Placeholder
            const finalEmail = emailStr || customerEmail || `no-email-${Date.now()}@placeholder.com`

            const saleData = {
                organization_id: organizationId,
                customer_id: customerId,
                payment_status: mapSaleStatus(statusRaw),
                amount: totalAmount,
                // Denormalized fields often required:
                customer_name: clientName,
                customer_phone: phone || '',
                customer_email: finalEmail,
                dni: finalDni,

                sale_number: row['Expediente'] || row['sale_number'] || `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                access_code: Math.random().toString(36).substring(2, 8).toUpperCase(), // Generate random access code
                sale_date: saleDate.toISOString(),
                metadata: metadata,
                created_by: user.id
            }

            let { error } = await supabase.from('sales').insert(saleData)

            // Fallback: If metadata column missing, try inserting without it
            if (error && error.message.includes('metadata')) {
                console.warn('Metadata column missing in sales, retrying without metadata')
                const { metadata, ...dataWithoutMetadata } = saleData
                const retry = await supabase.from('sales').insert(dataWithoutMetadata)
                error = retry.error
                if (!error) {
                    errors.push(`Advertencia: Venta de ${clientName} importada PERO sin datos extra (falta columna metadata en BD)`)
                }
            }

            if (error) {
                errors.push(`Error creando venta ${clientName}: ${error.message}`)
            } else {
                if (!error) success++
            }

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
            errors.push(`Excepción en venta: ${errorMessage}`)
        }
    }

    revalidatePath('/dashboard/sales')
    return { success, errors }
}


function mapSaleStatus(status: string): string {
    const s = status ? status.toLowerCase() : ''
    if (s.includes('pagad') || s.includes('paid') || s.includes('confirm')) return 'confirmed'
    if (s.includes('pend') || s.includes('draft')) return 'pending'
    if (s.includes('cancel') || s.includes('reject')) return 'rejected'
    return 'pending'
}

// Import Inventory / Stock
export async function importStock(data: StockImportRow[]): Promise<ImportResult> {
    const { supabase, organizationId } = await getImportContext()

    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            // Standardized Lookups
            const manufacturer = row['manufacturer'] || row['Fabricante'] || row['fabricante'] || row['Marca'] || 'Generic'
            const model = row['model'] || row['Modelo'] || row['modelo'] || row['Nombre'] || row['name']
            const typeRaw = row['type'] || row['Tipo'] || row['Categoria'] || row['category'] || 'other'

            // Numeric fields
            const priceStr = row['price'] || row['Precio'] || row['Coste'] || row['cost_price'] || '0'
            const stockStr = row['stock_quantity'] || row['Stock'] || row['Cantidad'] || row['quantity'] || '0'

            const price = parseFloat(String(priceStr).replace(/[^0-9.-]+/g, '')) || 0
            const stock = parseInt(String(stockStr).replace(/[^0-9-]+/g, '')) || 0

            if (!model) {
                errors.push(`Item sin modelo/nombre: ${JSON.stringify(row)}`)
                continue
            }

            // Map type to allowed enum values
            let type = 'other'
            const t = typeRaw.toLowerCase()
            if (t.includes('panel') || t.includes('modulo')) type = 'panel'
            else if (t.includes('inversor') || t.includes('inverter')) type = 'inverter'
            else if (t.includes('bateria') || t.includes('battery')) type = 'battery'
            else if (t.includes('estructura') || t.includes('mounting')) type = 'mounting'
            else if (t.includes('optimi')) type = 'optimizer'

            // Check if exists
            const { data: existing } = await supabase
                .from('components')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('model', model)
                .maybeSingle()

            const metadata = { ...row }

            let error = null

            if (existing) {
                // Update existing
                const { error: updateError } = await supabase
                    .from('components')
                    .update({
                        manufacturer,
                        price,
                        stock_quantity: stock, // Overwrite stock or add? Usually overwrite in full imports, or dangerous. Let's overwrite for now as it is "Import".
                        type,
                        metadata,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                error = updateError
            } else {
                // Insert new
                const { error: insertError } = await supabase
                    .from('components')
                    .insert({
                        organization_id: organizationId,
                        manufacturer,
                        model,
                        type,
                        price,
                        stock_quantity: stock,
                        metadata,
                        is_active: true
                    })
                error = insertError
            }

            if (error) {
                // Fallback if metadata fails
                if (error.message.includes('metadata')) {
                    console.warn(`Retry stock ${model} without metadata`)
                    const cleanData = {
                        organization_id: organizationId,
                        manufacturer,
                        model,
                        type,
                        price,
                        stock_quantity: stock,
                        is_active: true
                    }
                    // simple retry for insert only (simplified logic)
                    const { error: retryError } = await supabase.from('components').upsert(cleanData, { onConflict: 'organization_id, model' as any }).select() // upsert might fail if no unique constraint.
                    // Actually, just try insert again if it was new, or update if existing.
                    // Complexity reduced: just log warning.
                    errors.push(`Error metadata en ${model}: ${error.message}`)
                } else {
                    errors.push(`Error guardando ${model}: ${error.message}`)
                }
            } else {
                success++
            }

        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : 'Error desconocido'
            errors.push(`Excepción en ${JSON.stringify(row)}: ${errorMessage}`)
        }
    }

    revalidatePath('/dashboard/inventory')
    return { success, errors }
}


