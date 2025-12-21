'use client'

import { useEffect, useState } from 'react'
import { getTimeHistory } from '@/lib/actions/time-tracking'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, CheckCircle, AlertCircle } from 'lucide-react'

export function TimeHistory() {
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        getTimeHistory().then(data => {
            if (data) setHistory(data)
        })
    }, [])

    if (history.length === 0) {
        return <div className="text-zinc-500">No hay registros recientes.</div>
    }

    return (
        <div className="space-y-4">
            {history.map((entry) => (
                <div key={entry.id} className="bg-card border border-border rounded-lg p-4 flex justify-between items-center hover:bg-muted/50 transition-colors shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-card-foreground font-medium antialiased">
                                {format(new Date(entry.clock_in), "d MMM yyyy", { locale: es })}
                            </span>
                            {entry.is_verified ? (
                                <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1 rounded-full" title={entry.verification_notes}>
                                    <CheckCircle className="h-3 w-3" />
                                </div>
                            ) : (
                                <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1 rounded-full" title={entry.verification_notes || 'Ubicación no verificada'}>
                                    <AlertCircle className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                            {format(new Date(entry.clock_in), "HH:mm")} - {entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : 'En curso'}
                        </div>
                        {entry.projects && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/10 px-2 py-0.5 rounded-full w-fit font-semibold">
                                {entry.projects.name}
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        {entry.total_minutes ? (
                            <div className="text-lg font-bold text-foreground tabular-nums tracking-tight">
                                {Math.floor(entry.total_minutes / 60)}h {entry.total_minutes % 60}m
                            </div>
                        ) : (
                            <span className="text-emerald-600 dark:text-emerald-500 font-medium animate-pulse">Activo</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
