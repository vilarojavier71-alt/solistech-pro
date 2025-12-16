import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Mail, CreditCard, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { getInvoiceById } from '@/lib/actions/invoices'
import { formatDate } from '@/lib/utils'
import { DownloadInvoicePDFButton } from '@/components/invoices/download-pdf-button'
import { PaymentForm } from '@/components/invoices/payment-form'

export const metadata: Metadata = {
    title: 'Detalle de Factura | SolisTech PRO',
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // NEXT.JS 15+: await params
    const { id } = await params

    const { data: invoice, error } = await getInvoiceById(id)

    if (error || !invoice) {
        notFound()
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
            draft: { label: 'Borrador', variant: 'secondary', icon: null },
            issued: { label: 'Emitida', variant: 'default', icon: null },
            sent: { label: 'Enviada', variant: 'outline', icon: Mail },
            paid: { label: 'Pagada', variant: 'default', icon: CheckCircle },
            cancelled: { label: 'Cancelada', variant: 'destructive', icon: XCircle }
        }
        return variants[status] || variants.draft
    }

    const getPaymentStatusBadge = (status: string) => {
        const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
            pending: { label: 'Pendiente', variant: 'secondary' },
            partial: { label: 'Parcial', variant: 'secondary' },
            paid: { label: 'Pagada', variant: 'default' }
        }
        return variants[status] || variants.pending
    }

    const statusBadge = getStatusBadge(invoice.status || 'draft')
    const paymentBadge = getPaymentStatusBadge(invoice.payment_status || 'pending')
    const pendingAmount = Number(invoice.total) - Number(invoice.paid_amount || 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/invoices">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Factura {invoice.invoice_number}
                        </h1>
                        <p className="text-muted-foreground">
                            Emitida el {formatDate(invoice.issue_date)}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Badge variant={statusBadge.variant} className="text-sm">
                        {statusBadge.icon && <statusBadge.icon className="h-4 w-4 mr-1" />}
                        {statusBadge.label}
                    </Badge>
                    <Badge variant={paymentBadge.variant} className="text-sm">
                        {paymentBadge.label}
                    </Badge>
                </div>
            </div>

            {/* Acciones */}
            <div className="flex gap-3">
                <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar PDF
                </Button>
                <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar por Email
                </Button>
                {invoice.payment_status !== 'paid' && (
                    <PaymentForm invoiceId={invoice.id} pendingAmount={pendingAmount} />
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Información del cliente */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Información de la Factura</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Cliente */}
                        <div>
                            <h3 className="font-semibold mb-2">Cliente</h3>
                            <div className="text-sm space-y-1">
                                <p className="font-medium">{invoice.customer_name}</p>
                                <p className="text-muted-foreground">NIF: {invoice.customer_nif}</p>
                                {invoice.customer_address && (
                                    <p className="text-muted-foreground">{invoice.customer_address}</p>
                                )}
                                {invoice.customer_city && (
                                    <p className="text-muted-foreground">
                                        {invoice.customer_postal_code} {invoice.customer_city}
                                    </p>
                                )}
                                {invoice.customer_email && (
                                    <p className="text-muted-foreground">{invoice.customer_email}</p>
                                )}
                            </div>
                        </div>

                        <Separator />

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="font-semibold mb-2">Fecha de Emisión</h3>
                                <p className="text-sm">{formatDate(invoice.issue_date)}</p>
                            </div>
                            {invoice.due_date && (
                                <div>
                                    <h3 className="font-semibold mb-2">Fecha de Vencimiento</h3>
                                    <p className="text-sm">{formatDate(invoice.due_date)}</p>
                                </div>
                            )}
                        </div>

                        <Separator />

                        {/* Líneas de factura */}
                        <div>
                            <h3 className="font-semibold mb-3">Conceptos</h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="text-left p-3 text-sm font-medium">Descripción</th>
                                            <th className="text-right p-3 text-sm font-medium">Cant.</th>
                                            <th className="text-right p-3 text-sm font-medium">Precio</th>
                                            <th className="text-right p-3 text-sm font-medium">IVA</th>
                                            <th className="text-right p-3 text-sm font-medium">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.lines?.map((line: any) => (
                                            <tr key={line.id} className="border-t">
                                                <td className="p-3 text-sm">{line.description}</td>
                                                <td className="p-3 text-sm text-right">{line.quantity}</td>
                                                <td className="p-3 text-sm text-right">{line.unit_price.toFixed(2)}€</td>
                                                <td className="p-3 text-sm text-right">{line.tax_rate}%</td>
                                                <td className="p-3 text-sm text-right font-medium">
                                                    {line.total.toFixed(2)}€
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="flex justify-end">
                            <div className="w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal:</span>
                                    <span>{invoice.subtotal.toFixed(2)}€</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>IVA:</span>
                                    <span>{invoice.tax_amount.toFixed(2)}€</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>TOTAL:</span>
                                    <span>{invoice.total.toFixed(2)}€</span>
                                </div>
                                {invoice.payment_status !== 'paid' && (
                                    <>
                                        <div className="flex justify-between text-sm text-muted-foreground">
                                            <span>Pagado:</span>
                                            <span>{(invoice.paid_amount || 0).toFixed(2)}€</span>
                                        </div>
                                        <div className="flex justify-between text-sm font-semibold text-destructive">
                                            <span>Pendiente:</span>
                                            <span>{pendingAmount.toFixed(2)}€</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Notas */}
                        {invoice.notes && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-2">Notas</h3>
                                    <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Verifactu */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Verifactu</CardTitle>
                            <CardDescription>Firma electrónica AEAT</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {invoice.verifactu_qr_code && (
                                <div className="flex justify-center">
                                    <img
                                        src={invoice.verifactu_qr_code}
                                        alt="QR Verifactu"
                                        className="w-32 h-32"
                                    />
                                </div>
                            )}
                            <div className="text-xs space-y-1">
                                <p className="text-muted-foreground">
                                    Hash: <span className="font-mono">{invoice.verifactu_hash?.substring(0, 16)}...</span>
                                </p>
                                {invoice.verifactu_status && (
                                    <p className="text-muted-foreground">
                                        Estado: <span className="capitalize">{invoice.verifactu_status}</span>
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pagos */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Pagos Registrados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {invoice.payments.map((payment: any) => (
                                        <div key={payment.id} className="flex justify-between items-start text-sm">
                                            <div>
                                                <p className="font-medium">{payment.amount.toFixed(2)}€</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(payment.payment_date)}
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    {payment.payment_method}
                                                </p>
                                            </div>
                                            {payment.reference && (
                                                <p className="text-xs text-muted-foreground">
                                                    Ref: {payment.reference}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
