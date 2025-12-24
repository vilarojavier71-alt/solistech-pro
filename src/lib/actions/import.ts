'use server'

import { prisma } from '@/lib/db'
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

async function getImportContext() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado')

    const profile = await prisma.user.findUnique({
        where: { id: user.id },
        select: { organization_id: true }
    })

    if (!profile?.organization_id) throw new Error('Usuario sin organización asignada')

    return { user, organizationId: profile.organization_id }
}

export async function importCustomers(data: CustomerImportRow[]): Promise<ImportResult> {
    const { user, organizationId } = await getImportContext()
    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            const name = row.name || row.Nombre || row.nombre
            if (!name) {
                errors.push(`Fila sin nombre: ${JSON.stringify(row)}`)
                continue
            }

            await prisma.customer.create({
                data: {
                    organization_id: organizationId,
                    name,
                    email: row.email || row.Email || null,
                    phone: row.phone || row.telefono || row.Teléfono || row.Telefono || null,
                    company: row.company || row.empresa || row.Empresa || null,
                    tax_id: row.tax_id || row.cif || row.CIF || row.nif || row.NIF || null,
                    address: {
                        street: row.street || row.calle || null,
                        city: row.city || row.ciudad || null,
                        postal_code: row.postal_code || row.cp || null,
                        country: row.country || row.pais || 'España'
                    },
                    created_by: user.id
                }
            })
            success++
        } catch (error: any) {
            errors.push(`Error insertando: ${error.message}`)
        }
    }
    revalidatePath('/dashboard/customers')
    return { success, errors }
}

export async function importLeads(data: LeadImportRow[]): Promise<ImportResult> {
    const { user, organizationId } = await getImportContext()
    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            const name = row.name || row.Nombre || row.nombre
            if (!name) {
                errors.push(`Lead sin nombre`)
                continue
            }

            await prisma.lead.create({
                data: {
                    organization_id: organizationId,
                    name,
                    email: row.email || row.Email || null,
                    phone: row.phone || row.telefono || null,
                    company: row.company || row.empresa || null,
                    source: parseSource(row.source || row.origen),
                    status: parseStatus(row.status || row.estado),
                    estimated_value: parseFloat(String(row.estimated_value || row.valor || '0')),
                    notes: row.notes || row.notas || null,
                    created_by: user.id,
                    assigned_to: user.id
                }
            })
            success++
        } catch (error: any) {
            errors.push(`Error en lead: ${error.message}`)
        }
    }
    revalidatePath('/dashboard/leads')
    return { success, errors }
}

function parseSource(value: string | undefined): string {
    if (!value) return 'other'
    const val = value.toLowerCase()
    if (val.includes('web')) return 'web'
    if (val.includes('referencia') || val.includes('referral')) return 'referral'
    if (val.includes('llamada') || val.includes('cold')) return 'cold_call'
    return 'other'
}

function parseStatus(value: string | undefined): string {
    if (!value) return 'new'
    const val = value.toLowerCase()
    if (val.includes('nuevo') || val.includes('new')) return 'new'
    if (val.includes('contactado')) return 'contacted'
    if (val.includes('cualificado')) return 'qualified'
    if (val.includes('propuesta')) return 'proposal'
    if (val.includes('ganado') || val.includes('won')) return 'won'
    if (val.includes('perdido') || val.includes('lost')) return 'lost'
    return 'new'
}

export async function importVisits(data: VisitImportRow[]): Promise<ImportResult> {
    const { user, organizationId } = await getImportContext()
    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            const clientName = row['customer_name'] || row['Cliente_Nombre'] || row['Nombre']
            if (!clientName) {
                errors.push(`Visita sin cliente`)
                continue
            }

            let visitDate = new Date()
            const visitTimeStr = row['start_time'] || row['Hora_Visita_Programada']
            if (visitTimeStr && typeof visitTimeStr === 'string' && visitTimeStr.includes(':')) {
                const [hours, minutes] = visitTimeStr.split(':').map(Number)
                visitDate.setHours(hours || 9, minutes || 0, 0, 0)
            }

            // Find or create customer
            let customer = await prisma.customer.findFirst({
                where: { organization_id: organizationId, name: clientName }
            })

            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        organization_id: organizationId,
                        name: clientName,
                        phone: row['customer_phone'] || null,
                        created_by: user.id
                    }
                })
            }

            await prisma.appointment.create({
                data: {
                    organization_id: organizationId,
                    title: `Visita: ${clientName}`,
                    description: row['description'] || `Visita comercial con ${clientName}`,
                    start_time: visitDate,
                    end_time: new Date(visitDate.getTime() + 60 * 60 * 1000),
                    customer_id: customer.id,
                    status: mapVisitStatus(row['status'] || 'scheduled'),
                    created_by: user.id
                }
            })
            success++
        } catch (error: any) {
            errors.push(`Error en visita: ${error.message}`)
        }
    }
    revalidatePath('/dashboard/calendar')
    return { success, errors }
}

function mapVisitStatus(status: string): string {
    const s = status.toLowerCase()
    if (s.includes('confirmada') || s.includes('ok')) return 'scheduled'
    if (s.includes('cancel')) return 'cancelled'
    if (s.includes('realizada') || s.includes('done')) return 'completed'
    return 'scheduled'
}

export async function importSales(data: SaleImportRow[]): Promise<ImportResult> {
    const { user, organizationId } = await getImportContext()
    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            const clientName = row['customer_name'] || row['Cliente_Nombre'] || row['Nombre']
            if (!clientName) {
                errors.push(`Venta sin cliente`)
                continue
            }

            const amountStr = row['amount'] || row['Importe'] || row['Total'] || '0'
            const totalAmount = parseFloat(String(amountStr).replace(/[^0-9.-]+/g, '')) || 0

            let customer = await prisma.customer.findFirst({
                where: { organization_id: organizationId, name: clientName }
            })

            if (!customer) {
                customer = await prisma.customer.create({
                    data: {
                        organization_id: organizationId,
                        name: clientName,
                        phone: row['customer_phone'] || null,
                        created_by: user.id
                    }
                })
            }

            await prisma.sale.create({
                data: {
                    organization_id: organizationId,
                    customer_id: customer.id,
                    payment_status: mapSaleStatus(row['payment_status'] || row['Estado'] || 'pending'),
                    amount: totalAmount,
                    customer_name: clientName,
                    customer_phone: row['customer_phone'] || '',
                    customer_email: row['customer_email'] || `no-email-${Date.now()}@placeholder.com`,
                    dni: row['dni'] || row['DNI'] || `PENDING-${Date.now().toString().slice(-6)}`,
                    sale_number: row['Expediente'] || `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                    access_code: Math.random().toString(36).substring(2, 8).toUpperCase(),
                    sale_date: new Date(),
                    created_by: user.id
                }
            })
            success++
        } catch (error: any) {
            errors.push(`Error en venta: ${error.message}`)
        }
    }
    revalidatePath('/dashboard/sales')
    return { success, errors }
}

function mapSaleStatus(status: string): string {
    const s = status.toLowerCase()
    if (s.includes('pagad') || s.includes('paid') || s.includes('confirm')) return 'confirmed'
    if (s.includes('pend') || s.includes('draft')) return 'pending'
    if (s.includes('cancel') || s.includes('reject')) return 'rejected'
    return 'pending'
}

export async function importStock(data: StockImportRow[]): Promise<ImportResult> {
    const { organizationId } = await getImportContext()
    let success = 0
    let errors: string[] = []

    for (const row of data) {
        try {
            const model = row['model'] || row['Modelo'] || row['Nombre']
            if (!model) {
                errors.push(`Item sin modelo`)
                continue
            }

            const manufacturer = row['manufacturer'] || row['Fabricante'] || 'Generic'
            const priceStr = row['price'] || row['Precio'] || '0'
            const stockStr = row['stock_quantity'] || row['Stock'] || '0'
            const price = parseFloat(String(priceStr).replace(/[^0-9.-]+/g, '')) || 0
            const stock = parseInt(String(stockStr).replace(/[^0-9-]+/g, '')) || 0

            const type = mapComponentType(row['type'] || row['Tipo'] || 'other')

            const existing = await prisma.components.findFirst({
                where: { organization_id: organizationId, model }
            })

            if (existing) {
                await prisma.components.update({
                    where: { id: existing.id },
                    data: { manufacturer, price, stock_quantity: stock, type }
                })
            } else {
                await prisma.components.create({
                    data: {
                        organization_id: organizationId,
                        manufacturer,
                        model,
                        type,
                        price,
                        stock_quantity: stock,
                        is_active: true
                    }
                })
            }
            success++
        } catch (error: any) {
            errors.push(`Error en stock: ${error.message}`)
        }
    }
    revalidatePath('/dashboard/inventory')
    return { success, errors }
}

function mapComponentType(typeRaw: string): string {
    const t = typeRaw.toLowerCase()
    if (t.includes('panel') || t.includes('modulo')) return 'panel'
    if (t.includes('inversor') || t.includes('inverter')) return 'inverter'
    if (t.includes('bateria') || t.includes('battery')) return 'battery'
    if (t.includes('estructura') || t.includes('mounting')) return 'mounting'
    if (t.includes('optimi')) return 'optimizer'
    return 'other'
}

