'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportTimeEntriesToCSV } from '@/lib/actions/time-tracking-admin'
import { toast } from 'sonner'

interface ExportCSVButtonProps {
    filters?: {
        userId?: string
        dateFrom?: string
        dateTo?: string
    }
}

export function ExportCSVButton({ filters }: ExportCSVButtonProps) {
    const [loading, setLoading] = useState(false)

    const handleExport = async () => {
        setLoading(true)

        const { data, error } = await exportTimeEntriesToCSV(filters)

        if (error || !data) {
            toast.error(error || 'Error al exportar')
            setLoading(false)
            return
        }

        // Crear blob y descargar
        const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `fichajes_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        URL.revokeObjectURL(url)

        toast.success('Fichajes exportados correctamente')
        setLoading(false)
    }

    return (
        <Button onClick={handleExport} disabled={loading}>
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Exportando...
                </>
            ) : (
                <>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                </>
            )}
        </Button>
    )
}
