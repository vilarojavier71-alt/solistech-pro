import { Metadata } from 'next'
import Link from 'next/link'
import { Plus, TrendingUp, AlertCircle, Euro } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { listInvoices, getInvoiceStats } from '@/lib/actions/invoices'
import { PageShell } from "@/components/ui/page-shell"
import { InvoicesTable } from "@/components/finance/invoices-table"

export const metadata: Metadata = {
    title: 'Facturas | MotorGap',
    description: 'Gestión de facturas con Verifactu',
}

export default async function InvoicesPage() {
    // 1. Fetch Data
    const { data: invoices } = await listInvoices()
    const { data: stats } = await getInvoiceStats()

    // 2. Define Action Button
    const NewInvoiceAction = (
        <Link href="/dashboard/invoices/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Factura
            </Button>
        </Link>
    )

    return (
        <PageShell
            title="Facturas"
            description="Gestión integral de facturación electrónica y cobros."
            action={NewInvoiceAction}
        >
            <div className="space-y-8">
                {/* 3. KPI Cards */}
                {stats && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Facturado Este Mes
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.monthlyTotal.toFixed(2)}€</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.monthlyCount} facturas emitidas
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Pendiente de Cobro
                                </CardTitle>
                                <Euro className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.unpaidTotal.toFixed(2)}€</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.unpaidCount} facturas pendientes
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-card border-border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    Facturas Vencidas
                                </CardTitle>
                                <AlertCircle className="h-4 w-4 text-destructive" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">{stats.overdueTotal.toFixed(2)}€</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {stats.overdueCount} facturas requieren atención
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* 4. Invoices Table */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Listado de Facturas</h3>
                    <InvoicesTable invoices={invoices || []} />
                </div>
            </div>
        </PageShell>
    )
}
