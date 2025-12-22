'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import {
    Palmtree,
    Calendar,
    Gift,
    AlertCircle,
    Plus,
    ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeaveBalance } from '@/lib/actions/leave-management'
import Link from 'next/link'

interface LeaveBalanceData {
    vacation_days_total: number
    vacation_days_used: number
    vacation_days_pending: number
    vacationAvailable: number
    personal_days_total: number
    personal_days_used: number
    personalAvailable: number
    paid_days_total: number
    paid_days_used: number
    paidAvailable: number
    year: number
}

interface BalanceCardProps {
    title: string
    icon: React.ReactNode
    total: number
    used: number
    pending?: number
    available: number
    colorClass: string
}

function BalanceCard({ title, icon, total, used, pending = 0, available, colorClass }: BalanceCardProps) {
    const usedPercent = total > 0 ? ((used / total) * 100) : 0
    const pendingPercent = total > 0 ? ((pending / total) * 100) : 0
    const availablePercent = 100 - usedPercent - pendingPercent

    const isLow = availablePercent < 20 && total > 0
    const isWarning = availablePercent < 40 && availablePercent >= 20

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("p-2 rounded-lg", colorClass)}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">
                            {available.toFixed(1)} disponibles de {total}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={cn(
                        "text-2xl font-bold",
                        isLow && "text-red-600",
                        isWarning && "text-amber-600"
                    )}>
                        {available.toFixed(1)}
                    </p>
                    {pending > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {pending.toFixed(1)} pendientes
                        </Badge>
                    )}
                </div>
            </div>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                            {/* Used portion */}
                            <div
                                className={cn(
                                    "absolute left-0 top-0 h-full transition-all",
                                    colorClass.replace('bg-', 'bg-').replace('/10', '')
                                )}
                                style={{ width: `${usedPercent}%` }}
                            />
                            {/* Pending portion */}
                            {pending > 0 && (
                                <div
                                    className="absolute top-0 h-full bg-amber-400/70"
                                    style={{ left: `${usedPercent}%`, width: `${pendingPercent}%` }}
                                />
                            )}
                        </div>
                    </TooltipTrigger>
                    <TooltipContent>
                        <div className="text-xs space-y-1">
                            <p>✅ Usados: {used.toFixed(1)} días</p>
                            {pending > 0 && <p>⏳ Pendientes: {pending.toFixed(1)} días</p>}
                            <p>📅 Disponibles: {available.toFixed(1)} días</p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}

export function LeaveBalanceWidget() {
    const [balance, setBalance] = useState<LeaveBalanceData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadBalance() {
            try {
                const result = await getLeaveBalance()
                if (result.success && result.data) {
                    setBalance({
                        vacation_days_total: Number(result.data.vacation_days_total),
                        vacation_days_used: Number(result.data.vacation_days_used),
                        vacation_days_pending: Number(result.data.vacation_days_pending),
                        vacationAvailable: result.data.vacationAvailable,
                        personal_days_total: Number(result.data.personal_days_total),
                        personal_days_used: Number(result.data.personal_days_used),
                        personalAvailable: result.data.personalAvailable,
                        paid_days_total: Number(result.data.paid_days_total),
                        paid_days_used: Number(result.data.paid_days_used),
                        paidAvailable: result.data.paidAvailable,
                        year: result.data.year,
                    })
                } else {
                    setError(result.error || 'Error al cargar saldo')
                }
            } catch (err) {
                setError('Error de conexión')
            } finally {
                setIsLoading(false)
            }
        }
        loadBalance()
    }, [])

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-32" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-700">{error}</p>
                </CardContent>
            </Card>
        )
    }

    if (!balance) return null

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Mis Días {balance.year}
                    </CardTitle>
                    <Link href="/dashboard/time-tracking/leave">
                        <Button variant="outline" size="sm" className="gap-1">
                            <Plus className="h-4 w-4" />
                            Solicitar
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Vacaciones */}
                <BalanceCard
                    title="Vacaciones"
                    icon={<Palmtree className="h-4 w-4 text-emerald-600" />}
                    total={balance.vacation_days_total}
                    used={balance.vacation_days_used}
                    pending={balance.vacation_days_pending}
                    available={balance.vacationAvailable}
                    colorClass="bg-emerald-500/10"
                />

                {/* Asuntos Propios */}
                <BalanceCard
                    title="Asuntos Propios"
                    icon={<Calendar className="h-4 w-4 text-blue-600" />}
                    total={balance.personal_days_total}
                    used={balance.personal_days_used}
                    available={balance.personalAvailable}
                    colorClass="bg-blue-500/10"
                />

                {/* Días Remunerados */}
                {balance.paid_days_total > 0 && (
                    <BalanceCard
                        title="Días Remunerados"
                        icon={<Gift className="h-4 w-4 text-purple-600" />}
                        total={balance.paid_days_total}
                        used={balance.paid_days_used}
                        available={balance.paidAvailable}
                        colorClass="bg-purple-500/10"
                    />
                )}

                {/* Ver historial */}
                <Link
                    href="/dashboard/time-tracking/leave"
                    className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors pt-2"
                >
                    Ver historial de solicitudes
                    <ChevronRight className="h-4 w-4" />
                </Link>
            </CardContent>
        </Card>
    )
}

// Compact version for sidebar or small spaces
export function LeaveBalanceCompact() {
    const [balance, setBalance] = useState<LeaveBalanceData | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadBalance() {
            try {
                const result = await getLeaveBalance()
                if (result.success && result.data) {
                    setBalance({
                        vacation_days_total: Number(result.data.vacation_days_total),
                        vacation_days_used: Number(result.data.vacation_days_used),
                        vacation_days_pending: Number(result.data.vacation_days_pending),
                        vacationAvailable: result.data.vacationAvailable,
                        personal_days_total: Number(result.data.personal_days_total),
                        personal_days_used: Number(result.data.personal_days_used),
                        personalAvailable: result.data.personalAvailable,
                        paid_days_total: Number(result.data.paid_days_total),
                        paid_days_used: Number(result.data.paid_days_used),
                        paidAvailable: result.data.paidAvailable,
                        year: result.data.year,
                    })
                }
            } finally {
                setIsLoading(false)
            }
        }
        loadBalance()
    }, [])

    if (isLoading || !balance) {
        return <Skeleton className="h-8 w-32" />
    }

    const totalAvailable = balance.vacationAvailable + balance.personalAvailable + balance.paidAvailable

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/dashboard/time-tracking/leave">
                        <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-primary/10">
                            <Palmtree className="h-3 w-3" />
                            {totalAvailable.toFixed(0)} días
                        </Badge>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-xs space-y-1">
                        <p>🏖️ Vacaciones: {balance.vacationAvailable.toFixed(1)}</p>
                        <p>📅 Asuntos Propios: {balance.personalAvailable.toFixed(1)}</p>
                        {balance.paidAvailable > 0 && (
                            <p>🎁 Remunerados: {balance.paidAvailable.toFixed(1)}</p>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
