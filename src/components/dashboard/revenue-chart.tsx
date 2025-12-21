'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useMemo } from 'react'

interface RevenueChartProps {
    totalRevenue: number
    monthlyRevenue: number
    pendingInvoices?: number
}

/**
 * Revenue Chart Widget - Dashboard Centralita
 * Displays total and monthly revenue with visual indicators
 */
export function RevenueChart({ totalRevenue, monthlyRevenue, pendingInvoices = 0 }: RevenueChartProps) {
    const formattedTotal = useMemo(() => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(totalRevenue)
    }, [totalRevenue])

    const formattedMonthly = useMemo(() => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(monthlyRevenue)
    }, [monthlyRevenue])

    // Simple progress bar for visual representation
    const progressWidth = totalRevenue > 0 ? Math.min((monthlyRevenue / (totalRevenue * 0.1)) * 100, 100) : 0

    return (
        <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Ingresos Totales
                    </CardTitle>
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Revenue */}
                <div>
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                        {formattedTotal}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Facturado Total
                    </p>
                </div>

                {/* Monthly Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Este Mes</span>
                        <span className="font-semibold text-emerald-600">{formattedMonthly}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>
                </div>

                {/* Pending indicator */}
                {pendingInvoices > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-500">
                        <TrendingUp className="h-3 w-3" />
                        <span>{pendingInvoices} facturas pendientes</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
