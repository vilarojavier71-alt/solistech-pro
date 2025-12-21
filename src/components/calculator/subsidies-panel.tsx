'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Euro,
    TrendingUp,
    Home,
    Building2,
    Info,
    ExternalLink
} from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'

interface SubsidiesPanelProps {
    calculation: {
        total_cost: number
        subsidy_irpf_type?: string
        subsidy_irpf_percentage?: number
        subsidy_irpf_amount?: number
        subsidy_ibi_percentage?: number
        subsidy_ibi_duration_years?: number
        subsidy_ibi_annual?: number
        subsidy_ibi_total?: number
        subsidy_icio_percentage?: number
        subsidy_icio_amount?: number
        total_subsidies?: number
        net_cost?: number
        subsidy_region?: string
        subsidy_municipality?: string
        roi_with_subsidies?: number
        annual_roi_with_subsidies?: number
    }
}

export function SubsidiesPanel({ calculation }: SubsidiesPanelProps) {
    if (!calculation) return null
    const hasSubsidies = calculation.total_subsidies && calculation.total_subsidies > 0

    if (!hasSubsidies) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Euro className="h-5 w-5" />
                        Ayudas y Subvenciones
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No hay datos de subvenciones disponibles para esta ubicación</p>
                        <p className="text-sm mt-2">Recalcula el proyecto para obtener las ayudas actualizadas</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Euro className="h-5 w-5" />
                        Ayudas y Subvenciones
                    </CardTitle>
                    {calculation.subsidy_region && (
                        <Badge variant="outline" className="text-xs">
                            {calculation.subsidy_municipality || calculation.subsidy_region}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* IRPF */}
                {calculation.subsidy_irpf_amount && calculation.subsidy_irpf_amount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <p className="font-semibold text-green-900 dark:text-green-100">
                                    Deducción IRPF
                                </p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-green-600" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-xs">
                                                Deducción del {calculation.subsidy_irpf_percentage}% en la declaración de la renta.
                                                Tipo: {calculation.subsidy_irpf_type === '60' ? 'Rehabilitación integral' :
                                                    calculation.subsidy_irpf_type === '40' ? 'Reducción â‰¥30%' :
                                                        'Mejora eficiencia'}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                {calculation.subsidy_irpf_percentage}% de la inversión
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {calculation.subsidy_irpf_amount.toLocaleString('es-ES')}â‚¬
                        </p>
                    </div>
                )}

                {/* IBI */}
                {calculation.subsidy_ibi_total && calculation.subsidy_ibi_total > 0 && (
                    <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-blue-600" />
                                <p className="font-semibold text-blue-900 dark:text-blue-100">
                                    Bonificación IBI
                                </p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-blue-600" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-xs">
                                                Bonificación del {calculation.subsidy_ibi_percentage}% en el Impuesto sobre Bienes Inmuebles
                                                durante {calculation.subsidy_ibi_duration_years} años.
                                                Ahorro estimado: {calculation.subsidy_ibi_annual?.toLocaleString('es-ES')}€/año
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                {calculation.subsidy_ibi_percentage}% durante {calculation.subsidy_ibi_duration_years} años
                                <span className="text-xs ml-2">
                                    ({calculation.subsidy_ibi_annual?.toLocaleString('es-ES')}€/año)
                                </span>
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">
                            {calculation.subsidy_ibi_total.toLocaleString('es-ES')}â‚¬
                        </p>
                    </div>
                )}

                {/* ICIO */}
                {calculation.subsidy_icio_amount && calculation.subsidy_icio_amount > 0 && (
                    <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-purple-600" />
                                <p className="font-semibold text-purple-900 dark:text-purple-100">
                                    Bonificación ICIO
                                </p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="h-3 w-3 text-purple-600" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-xs">
                                                Bonificación del {calculation.subsidy_icio_percentage}% en el Impuesto sobre
                                                Construcciones, Instalaciones y Obras (pago único)
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                                {calculation.subsidy_icio_percentage}% del impuesto de obra
                            </p>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">
                            {calculation.subsidy_icio_amount.toLocaleString('es-ES')}â‚¬
                        </p>
                    </div>
                )}

                <Separator />

                {/* Total ayudas */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white shadow-lg">
                    <p className="text-lg font-bold">TOTAL AYUDAS</p>
                    <p className="text-3xl font-bold">
                        {calculation.total_subsidies.toLocaleString('es-ES')}â‚¬
                    </p>
                </div>

                {/* Coste neto final */}
                <div className="text-center space-y-2 pt-4">
                    <p className="text-sm text-muted-foreground">Coste neto final</p>
                    <p className="text-5xl font-bold text-green-600">
                        {calculation.net_cost?.toLocaleString('es-ES')}â‚¬
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Ahorro de {((calculation.total_subsidies / calculation.total_cost) * 100).toFixed(1)}% sobre el precio original
                    </p>
                </div>

                {/* ROI */}
                {calculation.annual_roi_with_subsidies && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">ROI Anual</p>
                            <p className="text-2xl font-bold text-green-600">
                                {calculation.annual_roi_with_subsidies.toFixed(1)}%
                            </p>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">ROI (25 años)</p>
                            <p className="text-2xl font-bold text-green-600">
                                {calculation.roi_with_subsidies?.toFixed(0)}%
                            </p>
                        </div>
                    </div>
                )}

                {/* Disclaimer */}
                <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                    <p>* Las ayudas están sujetas a cumplimiento de requisitos legales y disponibilidad presupuestaria</p>
                    {calculation.subsidy_municipality && (
                        <Button variant="link" size="sm" className="text-xs mt-2">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver ordenanza fiscal de {calculation.subsidy_municipality}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
