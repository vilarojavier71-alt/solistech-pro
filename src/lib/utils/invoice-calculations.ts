/**
 * Utilidades para cálculos de facturas
 * Extraídas de createInvoice para cumplir regla de 20 líneas
 */

export interface InvoiceLine {
    quantity: number
    unitPrice: number
    discountPercentage?: number
    taxRate?: number
    description: string
}

export interface ProcessedInvoiceLine {
    line_order: number
    description: string
    quantity: number
    unit_price: number
    discount_percentage: number
    discount_amount: number
    tax_rate: number
    tax_amount: number
    subtotal: number
    total: number
}

export interface InvoiceTotals {
    subtotal: number
    taxAmount: number
    total: number
    processedLines: ProcessedInvoiceLine[]
}

/**
 * Calcula los totales de una factura desde sus líneas
 */
export function calculateInvoiceTotals(
    lines: InvoiceLine[],
    fixMojibake: (str: string | undefined | null) => string | undefined
): InvoiceTotals {
    let subtotal = 0
    let taxAmount = 0

    const processedLines = lines.map((line, index) => {
        const lineSubtotal = line.quantity * line.unitPrice
        const discount = lineSubtotal * ((line.discountPercentage || 0) / 100)
        const subtotalAfterDiscount = lineSubtotal - discount
        const lineTax = subtotalAfterDiscount * ((line.taxRate || 21) / 100)
        const lineTotal = subtotalAfterDiscount + lineTax

        subtotal += subtotalAfterDiscount
        taxAmount += lineTax

        return {
            line_order: index + 1,
            description: fixMojibake(line.description) || line.description,
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

    return {
        subtotal,
        taxAmount,
        total,
        processedLines
    }
}

