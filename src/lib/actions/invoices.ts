'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { createHash } from 'crypto'
import QRCode from 'qrcode'
import type { InvoiceHashInput } from '@/lib/types/import-types'
import { z } from 'zod'

// Helper para corregir codificación corrupta (Mojibake)
function fixMojibake(str: string | undefined | null): string | undefined {
    if (!str) return undefined;
    if (typeof str !== 'string') return undefined;

    // Si contiene caracteres típicos de doble codificación UTF-8 -> Latin1
    // Ã (0xC3) es el primer byte de muchos caracteres comunes en español
    if (str.includes('Ã') || str.includes('Â')) {
        try {
            return Buffer.from(str, 'binary').toString('utf-8');
        } catch (e) {
            return str;
        }
    }
    return str;
}

interface InvoiceForCleaning {
    [key: string]: unknown
}

// Helper para limpiar objetos completos (recursivo superficial para listas)
function cleanInvoiceData(invoice: InvoiceForCleaning): InvoiceForCleaning {
    if (!invoice) return invoice

    // Campos de texto directo en la factura
    if (invoice.customer_name) invoice.customer_name = fixMojibake(invoice.customer_name)
    if (invoice.customer_address) invoice.customer_address = fixMojibake(invoice.customer_address)
    if (invoice.customer_city) invoice.customer_city = fixMojibake(invoice.customer_city)
    if (invoice.customer_province) invoice.customer_province = fixMojibake(invoice.customer_province) // si existe
    if (invoice.notes) invoice.notes = fixMojibake(invoice.notes)

    // Limpiar relación customer si viene incluida
    if (invoice.customer) {
        if (invoice.customer.name) invoice.customer.name = fixMojibake(invoice.customer.name)
        if (invoice.customer.address) invoice.customer.address = fixMojibake(invoice.customer.address)
    }

    // Limpiar líneas
    if (invoice.lines && Array.isArray(invoice.lines)) {
        invoice.lines = invoice.lines.map((line: any) => ({
            ...line,
            description: fixMojibake(line.description)
        }))
    }

    return invoice
}

// --- ZOD SCHEMAS ---
const InvoiceLineSchema = z.object({
    description: z.string().min(1, "La descripción es obligatoria"),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
    unitPrice: z.number().min(0, "El precio no puede ser negativo"),
    taxRate: z.number().min(0).default(21),
    discountPercentage: z.number().min(0).max(100).default(0)
})

const CreateInvoiceSchema = z.object({
    customerId: z.string().uuid("ID de cliente inválido"),
    issueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Fecha de emisión inválida",
    }),
    dueDate: z.string().optional().refine((date) => !date || !isNaN(Date.parse(date)), {
        message: "Fecha de vencimiento inválida",
    }),
    lines: z.array(InvoiceLineSchema).min(1, "Debe haber al menos una línea"),
    notes: z.string().optional(),
    projectId: z.string().uuid().optional(),
    paymentMethodId: z.string().uuid().optional()
})

export type InvoiceData = z.infer<typeof CreateInvoiceSchema>
export type InvoiceLine = z.infer<typeof InvoiceLineSchema>

// Generar número de factura automático
async function generateInvoiceNumber(organizationId: string, series: string = 'A') {
    // Buscar última factura de la organización
    const lastInvoice = await prisma.invoices.findFirst({
        where: { organization_id: organizationId },
        orderBy: { sequential_number: 'desc' }
    })

    const year = new Date().getFullYear()
    const number = (lastInvoice?.sequential_number || 0) + 1
    const invoiceNumber = `${series}-${year}-${String(number).padStart(4, '0')}`

    return { invoiceNumber, sequentialNumber: number }
}

// Calcular hash Verifactu
export async function calculateInvoiceHash(invoice: InvoiceHashInput): Promise<string> {
    const dataToHash = [
        invoice.invoice_number,
        invoice.issue_date,
        invoice.customer_nif,
        invoice.total.toFixed(2),
        invoice.verifactu_previous_hash || ''
    ].join('|')

    return createHash('sha256').update(dataToHash).digest('hex')
}

// Generar firma electrónica
async function generateInvoiceSignature(hash: string, previousHash: string | null): Promise<string> {
    const dataToSign = `${hash}${previousHash || ''}`
    return createHash('sha256').update(dataToSign).digest('hex')
}

// Generar QR Verifactu
interface InvoiceForQR {
    invoice_number: string
    issue_date: Date
    total: number
    customer_nif?: string | null
}

async function generateVerifactuQR(invoice: InvoiceForQR): Promise<string> {
    const qrData = {
        n: invoice.invoice_number,
        f: invoice.issue_date,
        t: invoice.total?.toFixed?.(2) || '0.00',
        h: invoice.verifactu_hash,
        url: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${invoice.id}`
    }

    return QRCode.toDataURL(JSON.stringify(qrData))
}

// Crear factura completa
export async function createInvoice(rawData: InvoiceData) {
    const validationResult = CreateInvoiceSchema.safeParse(rawData)
    if (!validationResult.success) {
        return { error: "Datos inválidos", details: validationResult.error.flatten().fieldErrors }
    }

    const data = validationResult.data
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'No autenticado' }

    // Obtener cliente
    const customer = await prisma.customers.findUnique({
        where: { id: data.customerId }
    })
    if (!customer) return { error: 'Cliente no encontrado' }

    // Generar número
    const { invoiceNumber, sequentialNumber } = await generateInvoiceNumber(user.organizationId!)

    // Calcular totales (extraído a función pura)
    const { calculateInvoiceTotals } = await import('@/lib/utils/invoice-calculations')
    const { subtotal, taxAmount, total, processedLines } = calculateInvoiceTotals(
        data.lines,
        (str) => fixMojibake(str) || str || ''
    )

    // Crear factura con transacción
    const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoices.create({
            data: {
                organization_id: user.organizationId,
                invoice_number: invoiceNumber,
                sequential_number: sequentialNumber,
                customer_id: customer.id,
                // Aplicar fixMojibake al copiar datos del cliente
                customer_name: fixMojibake(customer.name) || customer.name,
                customer_nif: customer.nif || customer.email,
                customer_address: fixMojibake(customer.address) || customer.address,
                customer_city: fixMojibake(customer.city) || customer.city,
                customer_postal_code: customer.postal_code,
                customer_email: customer.email,
                issue_date: new Date(data.issueDate),
                due_date: data.dueDate ? new Date(data.dueDate) : null,
                subtotal,
                tax_amount: taxAmount,
                total,
                notes: fixMojibake(data.notes) || data.notes,
                project_id: data.projectId,
                status: 'issued'
            }
        })

        // Crear líneas
        await tx.invoice_lines.createMany({
            data: processedLines.map(line => ({
                ...line,
                invoice_id: inv.id
            }))
        })

        return inv
    })

    // Calcular hash y QR (fuera de transacción)
    const hash = await calculateInvoiceHash(invoice)
    const signature = await generateInvoiceSignature(hash, null)
    const qrCode = await generateVerifactuQR({ ...invoice, verifactu_hash: hash })

    // Actualizar con datos Verifactu
    const updatedInvoice = await prisma.invoices.update({
        where: { id: invoice.id },
        data: {
            // verifactu_hash: hash,
            // verifactu_signature: signature,
            // verifactu_qr_code: qrCode
        }
    })

    // Audit log (ISO 27001 A.8.15)
    const { auditLogAction } = await import('@/lib/audit/audit-logger')
    await auditLogAction(
        'invoice.created',
        user.id,
        'invoice',
        updatedInvoice.id,
        `Invoice ${invoiceNumber} created for customer ${customer.id}`,
        {
            organizationId: user.organizationId || undefined,
            metadata: {
                invoiceNumber,
                customerId: customer.id,
                total: total.toString(),
                lineCount: processedLines.length
            }
        }
    ).catch(err => {
        // Log error pero no fallar la creación de factura
        console.error('Failed to create audit log:', err)
    })

    return { data: updatedInvoice, error: null }
}

// Listar facturas
export async function listInvoices(filters?: {
    status?: string
    paymentStatus?: string
    customerId?: string
    dateFrom?: string
    dateTo?: string
}) {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: null, error: 'No autenticado' }

    const where: any = { organization_id: user.organizationId }

    if (filters?.status) where.status = filters.status
    if (filters?.paymentStatus) where.payment_status = filters.paymentStatus
    if (filters?.customerId) where.customer_id = filters.customerId
    if (filters?.dateFrom) where.issue_date = { gte: new Date(filters.dateFrom) }
    if (filters?.dateTo) {
        where.issue_date = { ...where.issue_date, lte: new Date(filters.dateTo) }
    }

    const rawData = await prisma.invoices.findMany({
        where,
        include: {
            customer: { select: { id: true, name: true, email: true } },
            lines: true
        },
        orderBy: { created_at: 'desc' }
    })

    // Limpiar datos visualmente antes de enviarlos (lectura)
    const data = rawData.map(cleanInvoiceData)

    return { data, error: null }
}

// Obtener factura por ID
export async function getInvoiceById(invoiceId: string) {
    const rawData = await prisma.invoices.findUnique({
        where: { id: invoiceId },
        include: {
            customer: true,
            lines: true
        }
    })

    const data = cleanInvoiceData(rawData)

    return { data, error: data ? null : 'Factura no encontrada' }
}

// Cancelar factura
export async function cancelInvoice(invoiceId: string, reason?: string) {
    const data = await prisma.invoices.update({
        where: { id: invoiceId },
        data: {
            status: 'cancelled',
            internal_notes: reason
        }
    })

    return { data, error: null }
}

// Registrar pago
export async function registerPayment(invoiceId: string, paymentData: {
    amount: number
    paymentDate: string
    paymentMethod: string
    reference?: string
    notes?: string
}) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'No autenticado' }

    try {
        // Transacción ACID con SELECT FOR UPDATE para prevenir race conditions
        const result = await prisma.$transaction(async (tx) => {
            // Bloquear fila con SELECT FOR UPDATE
            const [lockedInvoice] = await tx.$queryRaw<Array<{
                id: string
                total: number
                payment_status: string
                organization_id: string
            }>>`
                SELECT id, total, payment_status, organization_id
                FROM invoices
                WHERE id = ${invoiceId}::uuid
                  AND organization_id = ${user.organizationId}::uuid
                FOR UPDATE
            `

            if (!lockedInvoice) {
                throw new Error('INVOICE_NOT_FOUND')
            }

            // Validar que no esté ya pagada completamente
            if (lockedInvoice.payment_status === 'paid') {
                throw new Error('INVOICE_ALREADY_PAID')
            }

            const currentTotal = Number(lockedInvoice.total || 0)
            const newPaymentStatus = paymentData.amount >= currentTotal ? 'paid' : 'partial'

            // Actualizar estado de la factura
            await tx.invoices.update({
                where: { id: invoiceId },
                data: {
                    payment_status: newPaymentStatus,
                    updated_at: new Date()
                }
            })

            return { amount: paymentData.amount, status: newPaymentStatus }
        }, {
            isolationLevel: 'Serializable' // Máximo nivel de aislamiento
        })

        // Audit log (ISO 27001 A.8.15)
        const { auditLogAction } = await import('@/lib/audit/audit-logger')
        await auditLogAction(
            'invoice.payment.registered',
            user.id,
            'invoice',
            invoiceId,
            `Payment of ${paymentData.amount}€ registered for invoice ${invoiceId}`,
            {
                organizationId: user.organizationId || undefined,
                metadata: {
                    amount: paymentData.amount,
                    paymentMethod: paymentData.paymentMethod,
                    reference: paymentData.reference,
                    newStatus: result.status
                }
            }
        ).catch(err => {
            console.error('Failed to create audit log:', err)
        })

        return { data: result, error: null }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        const errorMap: Record<string, string> = {
            'INVOICE_NOT_FOUND': 'Factura no encontrada o no pertenece a tu organización',
            'INVOICE_ALREADY_PAID': 'Esta factura ya está completamente pagada',
        }

        return {
            error: errorMap[errorMessage] || 'Error al registrar el pago',
            code: errorMessage
        }
    }
}


// Obtener estadísticas
export async function getInvoiceStats() {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: null, error: 'No autenticado' }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const today = new Date()

    // Total facturado este mes
    const monthlyInvoices = await prisma.invoices.findMany({
        where: {
            organization_id: user.organizationId,
            issue_date: { gte: startOfMonth },
            status: { not: 'cancelled' }
        },
        select: { total: true }
    })

    const monthlyTotal = monthlyInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Facturas pendientes
    const unpaidInvoices = await prisma.invoices.findMany({
        where: {
            organization_id: user.organizationId,
            payment_status: { in: ['pending', 'partial'] },
            status: { not: 'cancelled' }
        },
        select: { total: true }
    })

    const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    // Facturas vencidas
    const overdueInvoices = await prisma.invoices.findMany({
        where: {
            organization_id: user.organizationId,
            payment_status: { in: ['pending', 'partial'] },
            due_date: { lt: today },
            status: { not: 'cancelled' }
        },
        select: { total: true }
    })

    const overdueTotal = overdueInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0)

    return {
        data: {
            monthlyTotal,
            unpaidTotal,
            overdueTotal,
            monthlyCount: monthlyInvoices.length,
            unpaidCount: unpaidInvoices.length,
            overdueCount: overdueInvoices.length
        },
        error: null
    }
}
