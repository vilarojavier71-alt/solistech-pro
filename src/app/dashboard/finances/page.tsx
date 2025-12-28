
import { PageShell } from "@/components/ui/page-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, CreditCard, Euro, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { getFinancialDashboardData } from "@/lib/actions/finances"
import { formatCurrency } from "@/lib/utils"

export default async function FinancesPage() {
    const data = await getFinancialDashboardData()

    return (
        <PageShell
            title="Finanzas"
            description="Control total de ingresos, gastos y estado financiero."
        >
            {/* KPI GRID */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Ingresos Totales"
                    value={formatCurrency(data.income)}
                    icon={Euro}
                    trend="Cobrado"
                    trendColor="text-emerald-500"
                />
                <MetricCard
                    title="Gastos Totales"
                    value={formatCurrency(data.expenses)}
                    icon={CreditCard}
                    trend="Operativo"
                    trendColor="text-red-500"
                />
                <MetricCard
                    title="Beneficio Neto"
                    value={formatCurrency(data.netProfit)}
                    icon={TrendingUp}
                    trend={data.netProfit >= 0 ? "+ Rentable" : "- Déficit"}
                    trendColor={data.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}
                />
                <MetricCard
                    title="Facturas Pendientes"
                    value={data.pendingInvoicesCound.toString()}
                    icon={BarChart3}
                    trend={`${data.overdueInvoicesCount} Vencidas`}
                    trendColor={data.overdueInvoicesCount > 0 ? "text-red-500 font-bold" : "text-muted-foreground"}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">

                {/* RECENT TRANSACTIONS */}
                <Card className="col-span-4 lg:col-span-5">
                    <CardHeader>
                        <CardTitle>Últimas Transacciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {data.recentTransactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No hay movimientos recientes.</p>
                            ) : (
                                data.recentTransactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {t.type === 'income' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{t.description}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* QUICK ACTIONS / STATUS */}
                <Card className="col-span-3 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Estado</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <span className="text-sm font-medium text-muted-foreground">Margen de Beneficio</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold">
                                    {data.income > 0 ? ((data.netProfit / data.income) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-primary h-full"
                                    style={{ width: `${data.income > 0 ? Math.min(Math.max((data.netProfit / data.income) * 100, 0), 100) : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="text-xs text-muted-foreground text-center pt-4">
                            Los datos se actualizan en tiempo real basados en facturas cobradas y gastos registrados.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageShell>
    )
}

function MetricCard({ title, value, icon: Icon, trend, trendColor }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className={`text-xs ${trendColor || 'text-muted-foreground'}`}>
                    {trend}
                </p>
            </CardContent>
        </Card>
    )
}
