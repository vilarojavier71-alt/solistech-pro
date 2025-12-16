'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { createHash } from 'crypto'
import QRCode from 'qrcode'
import type { InvoiceHashInput } from '@/lib/types/import-types'
import { z } from 'zod'

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
async function generateVerifactuQR(invoice: any): Promise<string> {
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

    // Calcular totales
    let subtotal = 0
    let taxAmount = 0

    const processedLines = data.lines.map((line, index) => {
        const lineSubtotal = line.quantity * line.unitPrice
        const discount = lineSubtotal * ((line.discountPercentage || 0) / 100)
        const subtotalAfterDiscount = lineSubtotal - discount
        const lineTax = subtotalAfterDiscount * ((line.taxRate || 21) / 100)
        const lineTotal = subtotalAfterDiscount + lineTax

        subtotal += subtotalAfterDiscount
        taxAmount += lineTax

        return {
            line_order: index + 1,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            discount_percentage: line.discountPercentage || 0,
            discount_amount: discount,
            tax_rate: line.taxRate || 21,
            tax_amount: lineTax,
            subtotal: subtotalAfterDiscount,
            total: lineTotal
        }
    })

    const total = subtotal + taxAmount

    // Crear factura con transacción
    const invoice = await prisma.$transaction(async (tx) => {
        const inv = await tx.invoices.create({
            data: {
                organization_id: user.organizationId,
                invoice_number: invoiceNumber,
                sequential_number: sequentialNumber,
                customer_id: customer.id,
                customer_name: customer.name,
                customer_nif: customer.nif || customer.email,
                customer_address: customer.address,
                customer_city: customer.city,
                customer_postal_code: customer.postal_code,
                customer_email: customer.email,
                issue_date: new Date(data.issueDate),
                due_date: data.dueDate ? new Date(data.dueDate) : null,
                subtotal,
                tax_amount: taxAmount,
                total,
                notes: data.notes,
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
    const hash = await calculateInvoiceHash(invoice as any)
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

    const data = await prisma.invoices.findMany({
        where,
        include: {
            customer: { select: { id: true, name: true, email: true } },
            lines: true
        },
        orderBy: { created_at: 'desc' }
    })

    return { data, error: null }
}

// Obtener factura por ID
export async function getInvoiceById(invoiceId: string) {
    const data = await prisma.invoices.findUnique({
        where: { id: invoiceId },
        include: {
            customer: true,
            lines: true
        }
    })

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

    // TODO: Crear tabla invoice_payments en Docker schema
    // Por ahora, actualizamos el estado de la factura directamente

    const invoice = await prisma.invoices.findUnique({
        where: { id: invoiceId }
    })

    if (!invoice) return { error: 'Factura no encontrada' }

    const currentPaid = Number(invoice.total || 0)
    const newPaymentStatus = paymentData.amount >= currentPaid ? 'paid' : 'partial'

    await prisma.invoices.update({
        where: { id: invoiceId },
        data: {
            payment_status: newPaymentStatus,
            updated_at: new Date()
        }
    })

    return { data: { amount: paymentData.amount, status: newPaymentStatus }, error: null }
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
