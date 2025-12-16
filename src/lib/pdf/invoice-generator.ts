import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoicePDFData {
    // Factura
    invoice_number: string
    issue_date: string
    due_date?: string
    status: string

    // Cliente
    customer_name: string
    customer_nif: string
    customer_address?: string
    customer_city?: string
    customer_postal_code?: string
    customer_email?: string

    // Empresa (settings)
    company_name: string
    company_nif: string
    company_address?: string
    company_city?: string
    company_postal_code?: string
    company_phone?: string
    company_email?: string

    // Líneas
    lines: Array<{
        description: string
        quantity: number
        unit_price: number
        tax_rate: number
        total: number
    }>

    // Totales
    subtotal: number
    tax_amount: number
    total: number

    // Verifactu
    verifactu_qr_code?: string
    verifactu_hash?: string

    // Notas
    notes?: string
    payment_terms?: string
}

export async function generateInvoicePDF(data: InvoicePDFData): Promise<Blob> {
    const doc = new jsPDF()

    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    let yPos = margin

    // Colores
    const primaryColor: [number, number, number] = [37, 99, 235] // Blue-600
    const textColor: [number, number, number] = [31, 41, 55] // Gray-800
    const lightGray: [number, number, number] = [243, 244, 246] // Gray-100

    // ========== HEADER ==========
    // Logo/Nombre de empresa
    doc.setFontSize(24)
    doc.setTextColor(...primaryColor)
    doc.setFont('helvetica', 'bold')
    doc.text(data.company_name, margin, yPos)

    // Número de factura (derecha)
    doc.setFontSize(16)
    doc.setTextColor(...textColor)
    const invoiceNumberWidth = doc.getTextWidth(`Factura ${data.invoice_number}`)
    doc.text(`Factura ${data.invoice_number}`, pageWidth - margin - invoiceNumberWidth, yPos)

    yPos += 10

    // Datos de la empresa
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`NIF: ${data.company_nif}`, margin, yPos)
    yPos += 4
    if (data.company_address) {
        doc.text(data.company_address, margin, yPos)
        yPos += 4
    }
    if (data.company_city) {
        doc.text(`${data.company_postal_code || ''} ${data.company_city}`, margin, yPos)
        yPos += 4
    }
    if (data.company_phone) {
        doc.text(`Tel: ${data.company_phone}`, margin, yPos)
        yPos += 4
    }
    if (data.company_email) {
        doc.text(`Email: ${data.company_email}`, margin, yPos)
        yPos += 4
    }

    yPos += 10

    // Línea separadora
    doc.setDrawColor(...primaryColor)
    doc.setLineWidth(0.5)
    doc.line(margin, yPos, pageWidth - margin, yPos)

    yPos += 15

    // ========== DATOS DEL CLIENTE Y FECHAS ==========
    const col1X = margin
    const col2X = pageWidth / 2 + 10

    // Cliente
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...textColor)
    doc.text('CLIENTE', col1X, yPos)

    // Fechas
    doc.text('FECHAS', col2X, yPos)
    yPos += 6

    // Datos del cliente
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(data.customer_name, col1X, yPos)

    // Fecha de emisión
    doc.text(`Fecha de emisión: ${new Date(data.issue_date).toLocaleDateString('es-ES')}`, col2X, yPos)
    yPos += 4

    doc.text(`NIF: ${data.customer_nif}`, col1X, yPos)

    // Fecha de vencimiento
    if (data.due_date) {
        doc.text(`Fecha de vencimiento: ${new Date(data.due_date).toLocaleDateString('es-ES')}`, col2X, yPos)
    }
    yPos += 4

    if (data.customer_address) {
        doc.text(data.customer_address, col1X, yPos)
        yPos += 4
    }
    if (data.customer_city) {
        doc.text(`${data.customer_postal_code || ''} ${data.customer_city}`, col1X, yPos)
        yPos += 4
    }
    if (data.customer_email) {
        doc.text(data.customer_email, col1X, yPos)
        yPos += 4
    }

    yPos += 10

    // ========== TABLA DE LÍNEAS ==========
    const tableData = data.lines.map(line => [
        line.description,
        line.quantity.toString(),
        `${line.unit_price.toFixed(2)}€`,
        `${line.tax_rate}%`,
        `${line.total.toFixed(2)}€`
    ])

    autoTable(doc, {
        startY: yPos,
        head: [['Descripción', 'Cant.', 'Precio Unit.', 'IVA', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9
        },
        bodyStyles: {
            fontSize: 9,
            textColor: textColor
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'center', cellWidth: 20 },
            2: { halign: 'right', cellWidth: 30 },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'right', cellWidth: 30 }
        },
        margin: { left: margin, right: margin }
    })

    yPos = (doc as any).lastAutoTable.finalY + 10

    // ========== TOTALES ==========
    const totalsX = pageWidth - margin - 60

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')

    // Subtotal
    doc.text('Subtotal:', totalsX, yPos)
    doc.text(`${data.subtotal.toFixed(2)}€`, totalsX + 40, yPos, { align: 'right' })
    yPos += 5

    // IVA
    doc.text('IVA:', totalsX, yPos)
    doc.text(`${data.tax_amount.toFixed(2)}€`, totalsX + 40, yPos, { align: 'right' })
    yPos += 5

    // Línea
    doc.setDrawColor(200, 200, 200)
    doc.line(totalsX, yPos, totalsX + 40, yPos)
    yPos += 5

    // Total
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('TOTAL:', totalsX, yPos)
    doc.text(`${data.total.toFixed(2)}€`, totalsX + 40, yPos, { align: 'right' })

    yPos += 15

    // ========== CÓDIGO QR VERIFACTU ==========
    if (data.verifactu_qr_code) {
        const qrSize = 40
        const qrX = pageWidth - margin - qrSize

        try {
            doc.addImage(data.verifactu_qr_code, 'PNG', qrX, yPos, qrSize, qrSize)

            // Texto Verifactu
            doc.setFontSize(7)
            doc.setFont('helvetica', 'normal')
            doc.setTextColor(100, 100, 100)
            doc.text('Verifactu AEAT', qrX, yPos + qrSize + 4)

            if (data.verifactu_hash) {
                doc.text(`Hash: ${data.verifactu_hash.substring(0, 12)}...`, qrX, yPos + qrSize + 8)
            }
        } catch (error) {
            console.error('Error adding QR code:', error)
        }
    }

    // ========== NOTAS ==========
    if (data.notes) {
        yPos += 50

        if (yPos > pageHeight - 60) {
            doc.addPage()
            yPos = margin
        }

        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...textColor)
        doc.text('Notas:', margin, yPos)
        yPos += 6

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin)
        doc.text(notesLines, margin, yPos)
        yPos += notesLines.length * 4
    }

    // ========== PIE DE PÁGINA ==========
    const footerY = pageHeight - 20

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)

    if (data.payment_terms) {
        doc.text(data.payment_terms, margin, footerY)
    }

    // Número de página
    const pageText = `Página 1 de ${doc.getNumberOfPages()}`
    const pageTextWidth = doc.getTextWidth(pageText)
    doc.text(pageText, pageWidth - margin - pageTextWidth, footerY)

    // Generar blob
    return doc.output('blob')
}
