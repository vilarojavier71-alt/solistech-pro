'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateInvoicePDFAction } from '@/lib/actions/invoice-pdf'
import { toast } from 'sonner'

interface DownloadInvoicePDFButtonProps {
    invoiceId: string
    invoiceNumber: string
}

export function DownloadInvoicePDFButton({ invoiceId, invoiceNumber }: DownloadInvoicePDFButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)

        const { data, error } = await generateInvoicePDFAction(invoiceId)

        if (error || !data) {
            toast.error(error || 'Error al generar PDF')
            setLoading(false)
            return
        }

        // Convertir base64 a blob y descargar
        const byteCharacters = atob(data)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        const blob = new Blob([byteArray], { type: 'application/pdf' })

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Factura_${invoiceNumber.replace(/\//g, '-')}.pdf`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('PDF descargado correctamente')
        setLoading(false)
    }

    return (
        <Button onClick={handleDownload} disabled={loading} variant="outline">
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                </>
            )}
        </Button>
    )
}
