
'use client'

import { PageShell } from "@/components/ui/page-shell"
import { getQuote } from "@/lib/actions/quotes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Printer, Mail, Download, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { PDFDownloadLink } from "@react-pdf/renderer"
import { QuotePDF } from "@/components/quotes/quote-pdf"
import { Skeleton } from "@/components/ui/skeleton"

// Client-side wrapper for PDF functionality (avoid server-side issues with layout)
function PDFDownloadButton({ quote, organization }: { quote: any, organization: any }) {
    // This hook ensures we only render PDF link on client
    const [isClient, setIsClient] = useState(false)
    useEffect(() => setIsClient(true), [])

    if (!isClient) return <Button variant="outline" disabled><Download className="h-4 w-4 mr-2" /> Descargar PDF</Button>

    return (
        <PDFDownloadLink
            document={<QuotePDF quote={quote} organization={organization} />}
            fileName={`Presupuesto-${quote.quote_number}.pdf`}
        >
            {({ blob, url, loading, error }) => (
                <Button variant="outline" disabled={loading}>
                    <Download className="h-4 w-4 mr-2" />
                    {loading ? 'Generando...' : 'Descargar PDF'}
                </Button>
            )}
        </PDFDownloadLink>
    )
}

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
    const [quote, setQuote] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Using useEffect to fetch data on client to simplify detailed interactions for now
    // Ideally this should be a Server Component with Client Components islands
    // but for "God Mode" speed, let's fetch client side or call server action

    useEffect(() => {
        getQuote(params.id).then(data => {
            setQuote(data)
            setLoading(false)
        })
    }, [params.id])

    if (loading) return <QuoteDetailSkeleton />
    if (!quote) return <div>Presupuesto no encontrado</div>

    return (
        <PageShell
            title={quote.title}
            description={`Presupuesto #${quote.quote_number}`}
            backButton={<Link href="/dashboard/quotes"><Button variant="ghost"><ArrowLeft className="h-4 w-4" /></Button></Link>}
            action={
                <div className="flex gap-2">
                    <PDFDownloadButton quote={quote} organization={quote.organization} />
                    <Button><Mail className="h-4 w-4 mr-2" /> Enviar por Email</Button>
                </div>
            }
        >
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Líneas del Presupuesto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="p-3">Concepto</th>
                                            <th className="p-3 text-center">Cant.</th>
                                            <th className="p-3 text-right">Precio</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {quote.lines.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="p-8 text-center text-muted-foreground italic">
                                                    No hay líneas. Añade conceptos para calcular el total.
                                                    <br />
                                                    (Editor en construcción)
                                                </td>
                                            </tr>
                                        ) : (
                                            quote.lines.map((line: any) => (
                                                <tr key={line.id}>
                                                    <td className="p-3 font-medium">{line.description}</td>
                                                    <td className="p-3 text-center">{line.quantity}</td>
                                                    <td className="p-3 text-right">{Number(line.unit_price).toFixed(2)}€</td>
                                                    <td className="p-3 text-right">{Number(line.total).toFixed(2)}€</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    <tfoot className="bg-muted/50 font-semibold">
                                        <tr>
                                            <td colSpan={3} className="p-3 text-right">TOTAL</td>
                                            <td className="p-3 text-right">{Number(quote.total).toFixed(2)}€</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-muted-foreground">Cliente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                                    {quote.crm_account?.name?.[0] || "?"}
                                </div>
                                <div>
                                    <p className="font-medium">{quote.crm_account?.name || "Sin asignar"}</p>
                                    <p className="text-xs text-muted-foreground">{quote.crm_account?.email}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm uppercase text-muted-foreground">Estado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge className="w-full justify-center py-1 text-base capitalize">
                                {quote.status}
                            </Badge>
                            <p className="text-xs text-center mt-2 text-muted-foreground">
                                Creado el {new Date(quote.created_at).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageShell>
    )
}

function QuoteDetailSkeleton() {
    return (
        <PageShell title="Cargando..." description="...">
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        </PageShell>
    )
}
