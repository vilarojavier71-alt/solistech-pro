'use client'

import { useState, useEffect } from 'react'
import {
    Clock,
    MapPin,
    Coffee,
    LogOut,
    Play,
    Pause,
    History,
    Target,
    Zap,
    Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    getCurrentStatus,
    clockIn,
    clockOut,
    startBreak,
    endBreak,
    getMonthlyStats
} from '@/lib/actions/time-tracking'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ClockStatus {
    isClockedIn: boolean
    isOnBreak: boolean
    workDay?: {
        clock_in_time: string
    }
}

interface MonthlyStats {
    totalWorkedHours: number
    daysWorked: number
    averageHoursPerDay: number
    totalOvertimeHours: number
}

interface RecentActivity {
    type: string
    time: string
    label: string
}

import { Skeleton } from '@/components/ui/skeleton'

export function TimeClockWidget() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<ClockStatus | null>(null)
    const [stats, setStats] = useState<MonthlyStats | null>(null)
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
    const [currentTime, setCurrentTime] = useState(new Date())
    const [mounted, setMounted] = useState(false)

    // Simular actividad reciente
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
        { type: 'clock_in', time: '08:00', label: 'Entrada' },
        { type: 'break_start', time: '13:00', label: 'Descanso' },
        { type: 'break_end', time: '14:00', label: 'Vuelta' }
    ])

    useEffect(() => {
        setMounted(true)
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        loadStatus()
        loadStats()
        getLocation()
    }, [])

    const loadStatus = async () => {
        const { data } = await getCurrentStatus()
        setStatus(data)
    }

    const loadStats = async () => {
        const { data } = await getMonthlyStats()
        setStats(data)
    }

    const getLocation = () => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    })
                },
                (error) => console.warn('Geolocation error:', error)
            )
        }
    }

    const handleClockIn = async () => {
        setLoading(true)
        const { error } = await clockIn(location || undefined)
        if (error) toast.error(error)
        else {
            toast.success('¡Jornada iniciada!')
            loadStatus()
        }
        setLoading(false)
    }

    const handleClockOut = async () => {
        setLoading(true)
        const { error } = await clockOut(location || undefined)
        if (error) toast.error(error)
        else {
            toast.success('Jornada finalizada')
            loadStatus()
        }
        setLoading(false)
    }

    const handleBreak = async () => {
        setLoading(true)
        const isBreaking = status?.isOnBreak
        const action = isBreaking ? endBreak : startBreak

        const { error } = await action()
        if (error) toast.error(error)
        else {
            toast.success(isBreaking ? 'Descanso finalizado' : 'Descanso iniciado')
            loadStatus()
        }
        setLoading(false)
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const isActive = status?.isClockedIn
    const isOnBreak = status?.isOnBreak
    const workedHours = stats?.totalWorkedHours || 0
    const targetHours = 8 // Example daily target
    const progress = Math.min((workedHours / targetHours) * 100, 100)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Main Widget Card */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="relative w-full overflow-hidden border-0 shadow-2xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl isolate">
                    {/* Animated Gradient Background - Corrected Z-Index */}
                    <div className={cn(
                        "absolute inset-0 -z-10 bg-gradient-to-br opacity-10 transition-colors duration-1000",
                        isActive
                            ? (isOnBreak ? "from-amber-500 to-orange-600" : "from-emerald-500 to-teal-600")
                            : "from-blue-500 to-indigo-600"
                    )} />

                    <CardContent className="relative p-8 flex flex-col items-center justify-center min-h-[400px]">

                        {/* Status Badge */}
                        <div className="absolute top-6 right-6">
                            <Badge variant="outline" className={cn(
                                "px-4 py-1.5 text-sm uppercase tracking-wider font-semibold backdrop-blur-md border-white/20",
                                isActive
                                    ? (isOnBreak ? "bg-amber-500/20 text-amber-700 dark:text-amber-400" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400")
                                    : "bg-slate-500/20 text-slate-600 dark:text-slate-400"
                            )}>
                                {isActive ? (isOnBreak ? "En Pausa" : "Trabajando") : "Inactivo"}
                            </Badge>
                        </div>

                        {/* Location Badge */}
                        {location && (
                            <div className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground bg-white/30 dark:bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm">
                                <MapPin className="w-4 h-4" />
                                <span>Ubicación Activa</span>
                            </div>
                        )}

                        {/* Main Timer */}
                        <div className="text-center space-y-4 mb-12 w-full z-10">
                            <h2 className="text-sm font-medium text-muted-foreground tracking-[0.2em] uppercase">
                                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </h2>
                            <div className="text-6xl md:text-8xl font-mono font-bold tracking-tighter tabular-nums text-slate-800 dark:text-slate-100 drop-shadow-sm flex justify-center w-full">
                                {mounted ? (
                                    formatTime(currentTime)
                                ) : (
                                    <Skeleton className="h-[4.5rem] md:h-[7rem] w-[16rem] md:w-[28rem] bg-slate-200 dark:bg-slate-800/50 rounded-xl" />
                                )}
                            </div>
                        </div>

                        {/* Hero Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-lg z-10">
                            {!isActive ? (
                                <Button
                                    onClick={handleClockIn}
                                    disabled={loading}
                                    className="w-full h-20 text-xl rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    <Play className="w-6 h-6 mr-3 fill-current" />
                                    Iniciar Jornada
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={handleBreak}
                                        disabled={loading}
                                        variant="outline"
                                        className={cn(
                                            "flex-1 h-20 text-lg rounded-2xl border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all",
                                            isOnBreak ? "border-emerald-500 text-emerald-600" : "border-amber-500 text-amber-600"
                                        )}
                                    >
                                        {isOnBreak ? (
                                            <>
                                                <Play className="w-5 h-5 mr-2" /> Reanudar
                                            </>
                                        ) : (
                                            <>
                                                <Coffee className="w-5 h-5 mr-2" /> Pausa
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        onClick={handleClockOut}
                                        disabled={loading}
                                        className="flex-1 h-20 text-lg rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 shadow-xl shadow-red-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <LogOut className="w-6 h-6 mr-3" />
                                        Finalizar
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily Progress Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-0 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{workedHours.toFixed(1)}h</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Trabajadas</div>
                        </div>
                    </Card>

                    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-0 shadow-sm p-4 flex flex-col items-center justify-center gap-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                            <Target className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-muted-foreground">{targetHours}h</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">Objetivo</div>
                        </div>
                    </Card>

                    <Card className="col-span-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-0 shadow-sm p-4 flex flex-col justify-center gap-3">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span>Progreso Diario</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-3 bg-slate-100 dark:bg-slate-800" />
                        <div className="text-xs text-muted-foreground text-right">{targetHours - workedHours > 0 ? `${(targetHours - workedHours).toFixed(1)}h restantes` : 'Objetivo cumplido 🎉'}</div>
                    </Card>
                </div>
            </div>

            {/* Sidebar / History */}
            <div className="space-y-6">
                {/* Activity Feed */}
                <Card className="h-full border-0 shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                            <History className="w-5 h-5 text-primary" />
                            Actividad Reciente
                        </h3>

                        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 pl-8 py-2">
                            {/* Create dynamic timeline items here (mocked for UI) */}
                            {recentActivity.map((activity, i) => (
                                <div key={i} className="relative group">
                                    <span className={cn(
                                        "absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-white dark:ring-slate-900",
                                        activity.type === 'clock_in' ? "bg-emerald-500" : "bg-amber-500"
                                    )}>
                                        {activity.type === 'clock_in' && <Zap className="w-3 h-3 text-white" />}
                                        {activity.type.includes('break') && <Coffee className="w-3 h-3 text-white" />}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.label}</span>
                                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                                    </div>
                                </div>
                            ))}

                            {isActive && (
                                <div className="relative group animate-pulse">
                                    <span className="absolute -left-[41px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900">
                                        <Briefcase className="w-3 h-3 text-white" />
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">En curso...</span>
                                        <span className="text-xs text-muted-foreground">Calculando</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
