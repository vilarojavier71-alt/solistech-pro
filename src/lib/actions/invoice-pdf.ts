'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { generateInvoicePDF, type InvoicePDFData } from '@/lib/pdf/invoice-generator'

export async function generateInvoicePDFAction(invoiceId: string) {
    const supabase = await createClient()

    // Obtener factura completa
    const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
            *,
            lines:invoice_lines(*)
        `)
        .eq('id', invoiceId)
        .single()

    if (error || !invoice) {
        return { data: null, error: 'Factura no encontrada' }
    }

    // Obtener configuración de la empresa
    const { data: settings } = await supabase
        .from('invoice_settings')
        .select('*')
        .eq('organization_id', invoice.organization_id)
        .single()

    if (!settings) {
        return { data: null, error: 'Configuración de facturación no encontrada' }
    }

    // Preparar datos para el PDF
    const pdfData: InvoicePDFData = {
        // Factura
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        status: invoice.status,

        // Cliente
        customer_name: invoice.customer_name,
        customer_nif: invoice.customer_nif,
        customer_address: invoice.customer_address,
        customer_city: invoice.customer_city,
        customer_postal_code: invoice.customer_postal_code,
        customer_email: invoice.customer_email,

        // Empresa
        company_name: settings.company_name,
        company_nif: settings.company_nif,
        company_address: settings.company_address,
        company_city: settings.company_city,
        company_postal_code: settings.company_postal_code,
        company_phone: settings.company_phone,
        company_email: settings.company_email,

        // Líneas
        lines: invoice.lines.map((line: any) => ({
            description: line.description,
            quantity: Number(line.quantity),
            unit_price: Number(line.unit_price),
            tax_rate: Number(line.tax_rate),
            total: Number(line.total)
        })),

        // Totales
        subtotal: Number(invoice.subtotal),
        tax_amount: Number(invoice.tax_amount),
        total: Number(invoice.total),

        // Verifactu
        verifactu_qr_code: invoice.verifactu_qr_code,
        verifactu_hash: invoice.verifactu_hash,

        // Notas
        notes: invoice.notes,
        payment_terms: settings.payment_terms_text
    }

    try {
        const pdfBlob = await generateInvoicePDF(pdfData)

        // Convertir blob a base64
        const arrayBuffer = await pdfBlob.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')

        return { data: base64, error: null }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error generating PDF:', error)
        return { data: null, error: errorMessage || 'Error al generar PDF' }
    }
}

