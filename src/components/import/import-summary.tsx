'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
    CheckCircle2,
    XCircle,
    AlertTriangle,
    FileSpreadsheet,
    Users,
    Calendar,
    Package,
    Headphones,
    Download,
    RotateCcw,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface ImportResult {
    success: boolean
    totalRows: number
    created: number
    updated: number
    skipped: number
    errors: number
    errorDetails?: { row: number; field: string; message: string }[]
    model: string
    duration?: number // milliseconds
}

interface ImportSummaryProps {
    result: ImportResult
    onReset?: () => void
    onDownloadErrors?: () => void
}

const MODEL_CONFIG: Record<string, { label: string; icon: React.ReactNode; href: string }> = {
    customers: { label: 'Clientes', icon: <Users className="h-5 w-5" />, href: '/dashboard/customers' },
    appointments: { label: 'Visitas', icon: <Calendar className="h-5 w-5" />, href: '/dashboard/calendar' },
    components: { label: 'Componentes', icon: <Package className="h-5 w-5" />, href: '/dashboard/inventory' },
    support_tickets: { label: 'Incidencias', icon: <Headphones className="h-5 w-5" />, href: '/dashboard/support' },
    leads: { label: 'Leads', icon: <Users className="h-5 w-5" />, href: '/dashboard/leads' },
}

export function ImportSummary({ result, onReset, onDownloadErrors }: ImportSummaryProps) {
    const config = MODEL_CONFIG[result.model] || { label: result.model, icon: <FileSpreadsheet className="h-5 w-5" />, href: '/dashboard' }

    const successRate = result.totalRows > 0
        ? Math.round(((result.created + result.updated) / result.totalRows) * 100)
        : 0

    const isFullSuccess = result.errors === 0 && result.skipped === 0
    const hasErrors = result.errors > 0
    const hasSkipped = result.skipped > 0

    return (
        <Card className={cn(
            "border-2",
            isFullSuccess && "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/10",
            hasErrors && "border-red-200 bg-red-50/30 dark:bg-red-950/10",
            !isFullSuccess && !hasErrors && "border-amber-200 bg-amber-50/30 dark:bg-amber-950/10"
        )}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        {isFullSuccess ? (
                            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                        ) : hasErrors ? (
                            <XCircle className="h-6 w-6 text-red-600" />
                        ) : (
                            <AlertTriangle className="h-6 w-6 text-amber-600" />
                        )}
                        Resumen de Importación
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {config.icon}
                        <Badge variant="outline">{config.label}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Progress bar */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Tasa de éxito</span>
                        <span className="font-mono font-bold">{successRate}%</span>
                    </div>
                    <Progress
                        value={successRate}
                        className={cn(
                            "h-3",
                            successRate >= 90 && "[&>div]:bg-emerald-500",
                            successRate >= 70 && successRate < 90 && "[&>div]:bg-amber-500",
                            successRate < 70 && "[&>div]:bg-red-500"
                        )}
                    />
                </div>

                <Separator />

                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        label="Total filas"
                        value={result.totalRows}
                        icon={<FileSpreadsheet className="h-4 w-4" />}
                        variant="neutral"
                    />
                    <StatCard
                        label="Creados"
                        value={result.created}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        variant="success"
                    />
                    <StatCard
                        label="Actualizados"
                        value={result.updated}
                        icon={<CheckCircle2 className="h-4 w-4" />}
                        variant="info"
                    />
                    <StatCard
                        label="Omitidos"
                        value={result.skipped}
                        icon={<AlertTriangle className="h-4 w-4" />}
                        variant="warning"
                    />
                </div>

                {/* Errors section */}
                {hasErrors && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-red-700 dark:text-red-400 flex items-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    {result.errors} errores encontrados
                                </h4>
                                {onDownloadErrors && result.errorDetails && result.errorDetails.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onDownloadErrors}
                                        className="gap-1"
                                    >
                                        <Download className="h-3 w-3" />
                                        Descargar errores
                                    </Button>
                                )}
                            </div>

                            {/* Show first 5 errors */}
                            {result.errorDetails && result.errorDetails.length > 0 && (
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {result.errorDetails.slice(0, 5).map((err, idx) => (
                                        <div
                                            key={idx}
                                            className="text-xs p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-800"
                                        >
                                            <span className="font-mono">Fila {err.row}</span>
                                            {err.field && <span className="text-muted-foreground"> • {err.field}</span>}
                                            <span className="text-red-700 dark:text-red-400">: {err.message}</span>
                                        </div>
                                    ))}
                                    {result.errorDetails.length > 5 && (
                                        <p className="text-xs text-muted-foreground text-center py-1">
                                            ... y {result.errorDetails.length - 5} errores más
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Duration */}
                {result.duration && (
                    <p className="text-xs text-muted-foreground text-center">
                        Procesado en {(result.duration / 1000).toFixed(2)} segundos
                    </p>
                )}

                <Separator />

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {onReset && (
                        <Button variant="outline" onClick={onReset} className="flex-1 gap-2">
                            <RotateCcw className="h-4 w-4" />
                            Nueva Importación
                        </Button>
                    )}
                    <Link href={config.href} className="flex-1">
                        <Button className="w-full gap-2">
                            Ver {config.label}
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    )
}

// Helper stat card component
function StatCard({
    label,
    value,
    icon,
    variant
}: {
    label: string
    value: number
    icon: React.ReactNode
    variant: 'neutral' | 'success' | 'info' | 'warning' | 'error'
}) {
    const variantStyles = {
        neutral: 'bg-muted',
        success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700',
        info: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700',
        warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700',
        error: 'bg-red-100 dark:bg-red-900/30 text-red-700'
    }

    return (
        <div className={cn("p-3 rounded-lg", variantStyles[variant])}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-xs opacity-80">{label}</span>
            </div>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    )
}
