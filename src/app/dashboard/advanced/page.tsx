'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Mail,
    TrendingUp,
    DollarSign,
    BarChart3,
    Search,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    FileText,
    AlertCircle,
    CheckCircle
} from 'lucide-react'
import { getEmailSummary, getGmailStatus, searchGmailMessages } from '@/lib/actions/gmail'
import { getCashFlowReport, getFinancialKPIs, getRevenueForecasts } from '@/lib/actions/accounting'
import { ConnectGmailButton } from '@/components/gmail/connect-button'

// Types
interface EmailStats {
    unread: number
    important: number
    today: number
}

interface FinancialKPIs {
    totalRevenue: number
    paidRevenue: number
    pendingRevenue: number
    invoiceCount: number
    paidCount: number
    pendingCount: number
    overdueCount: number
    thisMonthRevenue: number
    lastMonthRevenue: number
    monthOverMonthGrowth: string
    collectionRate: string
    avgInvoiceValue: string
}

interface CashFlowData {
    totalIncome: number
    totalExpenses: number
    netCashFlow: number
    monthlyData: { month: string; income: number; expenses: number; net: number }[]
}

interface ForecastData {
    historical: { month: string; revenue: number }[]
    forecasts: { month: string; revenue: number; isForecast: boolean }[]
    avgMonthly: number
    trendPercentage: string
}

export default function AdvancedPage() {
    const [activeTab, setActiveTab] = useState('overview')
    const [gmailConnected, setGmailConnected] = useState(false)
    const [gmailEmail, setGmailEmail] = useState<string | null>(null)
    const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
    const [kpis, setKpis] = useState<FinancialKPIs | null>(null)
    const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
    const [forecasts, setForecasts] = useState<ForecastData | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [searching, setSearching] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        try {
            // Cargar datos en paralelo
            const [gmailStatusRes, emailSummaryRes, kpisRes, cashFlowRes, forecastsRes] = await Promise.all([
                getGmailStatus(),
                getEmailSummary(),
                getFinancialKPIs(),
                getCashFlowReport(),
                getRevenueForecasts(3)
            ])

            // Gmail
            setGmailConnected(gmailStatusRes.isConnected || false)
            setGmailEmail(gmailStatusRes.email || null)
            if (!('error' in emailSummaryRes)) {
                setEmailStats(emailSummaryRes as EmailStats)
            }

            // Finanzas
            if ('success' in kpisRes && kpisRes.data) {
                setKpis(kpisRes.data as FinancialKPIs)
            }
            if ('success' in cashFlowRes && cashFlowRes.data) {
                setCashFlow(cashFlowRes.data as CashFlowData)
            }
            if ('success' in forecastsRes && forecastsRes.data) {
                setForecasts(forecastsRes.data as ForecastData)
            }
        } catch (error) {
            console.error('Error loading advanced data:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return
        setSearching(true)
        try {
            const result = await searchGmailMessages(searchQuery, 10)
            if ('messages' in result) {
                setSearchResults(result.messages || [])
            }
        } catch (error) {
            console.error('Search error:', error)
        } finally {
            setSearching(false)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    if (loading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vista Avanzada</h1>
                    <p className="text-muted-foreground">
                        Integración Gmail y Análisis Financiero
                    </p>
                </div>
                <Button variant="outline" onClick={loadData} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Actualizar
                </Button>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="gmail" className="gap-2">
                        <Mail className="h-4 w-4" />
                        Gmail
                    </TabsTrigger>
                    <TabsTrigger value="finance" className="gap-2">
                        <DollarSign className="h-4 w-4" />
                        Finanzas
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid gap-4 md:grid-cols-4">
                        {/* Gmail Card */}
                        <Card className="border-blue-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Correos No Leídos</CardTitle>
                                <Mail className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {gmailConnected ? (emailStats?.unread || 0) : '—'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {gmailConnected ? `${emailStats?.today || 0} hoy` : 'Gmail no conectado'}
                                </p>
                            </CardContent>
                        </Card>

                        {/* Revenue Card */}
                        <Card className="border-emerald-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">
                                    {formatCurrency(kpis?.totalRevenue || 0)}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground">
                                    {Number(kpis?.monthOverMonthGrowth || 0) >= 0 ? (
                                        <ArrowUpRight className="h-3 w-3 text-emerald-500 mr-1" />
                                    ) : (
                                        <ArrowDownRight className="h-3 w-3 text-rose-500 mr-1" />
                                    )}
                                    {kpis?.monthOverMonthGrowth || '0'}% vs mes anterior
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pending Card */}
                        <Card className="border-amber-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pendiente Cobro</CardTitle>
                                <Wallet className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">
                                    {formatCurrency(kpis?.pendingRevenue || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {kpis?.pendingCount || 0} facturas pendientes
                                </p>
                            </CardContent>
                        </Card>

                        {/* Cash Flow Card */}
                        <Card className="border-indigo-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Flujo de Caja</CardTitle>
                                <BarChart3 className="h-4 w-4 text-indigo-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${(cashFlow?.netCashFlow || 0) >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    {formatCurrency(cashFlow?.netCashFlow || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Tasa cobro: {kpis?.collectionRate || '0'}%
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Forecast Preview */}
                    {forecasts && forecasts.forecasts.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-indigo-500" />
                                    Previsión de Ingresos
                                </CardTitle>
                                <CardDescription>
                                    Tendencia: {forecasts.trendPercentage}% mensual | Promedio: {formatCurrency(forecasts.avgMonthly)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-3">
                                    {forecasts.forecasts.map((f, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <span className="text-sm font-medium">{f.month}</span>
                                            <Badge variant="secondary">{formatCurrency(f.revenue)}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Gmail Tab */}
                <TabsContent value="gmail" className="space-y-4">
                    {!gmailConnected ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Conectar Gmail</h3>
                                <p className="text-muted-foreground mb-4 text-center max-w-md">
                                    Conecta tu cuenta de Gmail para ver resúmenes de correos, búsquedas avanzadas y correos relacionados con proyectos.
                                </p>
                                <ConnectGmailButton />
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Gmail Stats */}
                            <div className="grid gap-4 md:grid-cols-3">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">No Leídos</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-blue-600">{emailStats?.unread || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Importantes</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-amber-600">{emailStats?.important || 0}</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Recibidos Hoy</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold text-emerald-600">{emailStats?.today || 0}</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Search */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Search className="h-5 w-5" />
                                        Buscar Correos
                                    </CardTitle>
                                    <CardDescription>Conectado como: {gmailEmail}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Buscar por asunto, remitente, contenido..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                        <Button onClick={handleSearch} disabled={searching}>
                                            {searching ? 'Buscando...' : 'Buscar'}
                                        </Button>
                                    </div>

                                    {searchResults.length > 0 && (
                                        <div className="space-y-2">
                                            {searchResults.map((email, i) => (
                                                <div key={i} className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                    <div className="font-medium truncate">{email.subject}</div>
                                                    <div className="text-sm text-muted-foreground truncate">{email.from}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{email.snippet}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                {/* Finance Tab */}
                <TabsContent value="finance" className="space-y-4">
                    {/* KPIs Grid */}
                    <div className="grid gap-4 md:grid-cols-4">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Total Facturas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{kpis?.invoiceCount || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    Cobradas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600">{kpis?.paidCount || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Wallet className="h-4 w-4 text-amber-500" />
                                    Pendientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-600">{kpis?.pendingCount || 0}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-rose-500" />
                                    Vencidas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-600">{kpis?.overdueCount || 0}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cash Flow Detail */}
                    {cashFlow && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Flujo de Caja Mensual</CardTitle>
                                <CardDescription>
                                    Ingresos: {formatCurrency(cashFlow.totalIncome)} | Gastos: {formatCurrency(cashFlow.totalExpenses)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {cashFlow.monthlyData.length > 0 ? (
                                    <div className="space-y-3">
                                        {cashFlow.monthlyData.slice(-6).map((month, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                                <span className="font-medium">{month.month}</span>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span className="text-emerald-600">+{formatCurrency(month.income)}</span>
                                                    <span className="text-rose-600">-{formatCurrency(month.expenses)}</span>
                                                    <Badge variant={month.net >= 0 ? 'default' : 'destructive'}>
                                                        {formatCurrency(month.net)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No hay datos de flujo de caja disponibles
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Revenue Metrics */}
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Métricas de Ingresos</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Ingresos Este Mes</span>
                                    <span className="font-semibold">{formatCurrency(kpis?.thisMonthRevenue || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Ingresos Mes Pasado</span>
                                    <span className="font-semibold">{formatCurrency(kpis?.lastMonthRevenue || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Crecimiento MoM</span>
                                    <Badge variant={Number(kpis?.monthOverMonthGrowth || 0) >= 0 ? 'default' : 'destructive'}>
                                        {kpis?.monthOverMonthGrowth || '0'}%
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Factura Promedio</span>
                                    <span className="font-semibold">{formatCurrency(Number(kpis?.avgInvoiceValue || 0))}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Estado de Cobranza</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Facturado</span>
                                    <span className="font-semibold">{formatCurrency(kpis?.totalRevenue || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Total Cobrado</span>
                                    <span className="font-semibold text-emerald-600">{formatCurrency(kpis?.paidRevenue || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Pendiente de Cobro</span>
                                    <span className="font-semibold text-amber-600">{formatCurrency(kpis?.pendingRevenue || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Tasa de Cobro</span>
                                    <Badge variant="secondary">{kpis?.collectionRate || '0'}%</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
