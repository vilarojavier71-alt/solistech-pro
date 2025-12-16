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
                <div key={entry.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex justify-between items-center hover:bg-zinc-800/50 transition-colors">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                                {format(new Date(entry.clock_in), "d MMM yyyy", { locale: es })}
                            </span>
                            {entry.is_verified ? (
                                <div className="bg-emerald-500/10 text-emerald-500 p-1 rounded-full" title={entry.verification_notes}>
                                    <CheckCircle className="h-3 w-3" />
                                </div>
                            ) : (
                                <div className="bg-amber-500/10 text-amber-500 p-1 rounded-full" title={entry.verification_notes || 'Ubicación no verificada'}>
                                    <AlertCircle className="h-3 w-3" />
                                </div>
                            )}
                        </div>
                        <div className="text-sm text-zinc-400">
                            {format(new Date(entry.clock_in), "HH:mm")} - {entry.clock_out ? format(new Date(entry.clock_out), "HH:mm") : 'En curso'}
                        </div>
                        {entry.projects && (
                            <div className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit">
                                {entry.projects.name}
                            </div>
                        )}
                    </div>

                    <div className="text-right">
                        {entry.total_minutes ? (
                            <div className="text-lg font-bold text-white">
                                {Math.floor(entry.total_minutes / 60)}h {entry.total_minutes % 60}m
                            </div>
                        ) : (
                            <span className="text-emerald-500 font-medium animate-pulse">Activo</span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
