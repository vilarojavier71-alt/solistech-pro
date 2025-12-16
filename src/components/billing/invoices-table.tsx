'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getInvoices } from '@/lib/actions/billing'
import { toast } from 'sonner'
import { Separator } from '@/components/ui/separator'

interface Invoice {
    id: string
    amount: number
    currency: string
    status: string | null
    date: Date
    pdf_url: string | null | undefined
}

interface InvoicesTableProps {
    orgId?: string
}

export function InvoicesTable({ orgId }: InvoicesTableProps) {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!orgId) {
            setLoading(false)
            return
        }

        async function loadInvoices() {
            try {
                const result = await getInvoices()
                if (result.error) {
                    // Silent fail or toast
                    console.error(result.error)
                } else if (result.data) {
                    setInvoices(result.data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadInvoices()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Facturas</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Historial de Facturas</CardTitle>
                <CardDescription>
                    Consulta y descarga tus facturas anteriores
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                        <FileText className="h-8 w-8 mb-3 opacity-50" />
                        <p>No tienes facturas disponibles</p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {invoices.map((invoice) => (
                            <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">
                                        {new Date(invoice.date).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        Factura #{invoice.id.slice(-6)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className="font-semibold text-sm">
                                            {(invoice.amount / 100).toLocaleString('es-ES', {
                                                style: 'currency',
                                                currency: invoice.currency.toUpperCase()
                                            })}
                                        </div>
                                        <Badge variant={invoice.status === 'paid' ? 'outline' : 'destructive'} className="text-[10px] h-5 px-1.5">
                                            {invoice.status === 'paid' ? 'Pagado' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                    <Button size="icon" variant="ghost" asChild>
                                        <a href={invoice.pdf_url || '#'} target="_blank" rel="noopener noreferrer" title="Descargar PDF">
                                            <Download className="h-4 w-4 text-muted-foreground" />
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
