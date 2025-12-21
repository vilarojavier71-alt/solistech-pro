'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Square, MapPin, Loader2, RefreshCw } from 'lucide-react'
import { checkIn, checkOut, getActiveEntry, getTimeHistory } from '@/lib/actions/time-tracking'
import { getProjects } from '@/lib/actions/projects'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TimeTracker() {
    const [status, setStatus] = useState<'idle' | 'active' | 'loading'>('loading')
    const [activeEntry, setActiveEntry] = useState<any>(null)
    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<string>('unassigned')
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
    const [timer, setTimer] = useState<string>('00:00:00')

    // Initial Load
    useEffect(() => {
        loadData()
    }, [])

    // Timer logic
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (status === 'active' && activeEntry?.clock_in) {
            interval = setInterval(() => {
                const start = new Date(activeEntry.clock_in).getTime()
                const now = new Date().getTime()
                const diff = now - start

                const hours = Math.floor(diff / (1000 * 60 * 60))
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((diff % (1000 * 60)) / 1000)

                setTimer(
                    `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                )
            }, 1000)
        } else {
            setTimer('00:00:00')
        }
        return () => clearInterval(interval)
    }, [status, activeEntry])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load Active Entry
            const entry = await getActiveEntry()
            if (entry) {
                setStatus('active')
                setActiveEntry(entry)
            } else {
                setStatus('idle')
                setActiveEntry(null)
            }

            // Load Projects
            const { data: projs } = await getProjects() // Assuming this exists or similar
            if (projs) setProjects(projs)

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const getLocation = (): Promise<{ lat: number, lng: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'))
                return
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => reject(err),
                { enableHighAccuracy: true, timeout: 10000 }
            )
        })
    }

    const handleCheckIn = async () => {
        setStatus('loading')
        try {
            const pos = await getLocation()
            const pid = selectedProject === 'unassigned' ? undefined : selectedProject
            const result = await checkIn({ projectId: pid, coords: pos })

            if (result.success) {
                toast.success('Entrada registrada')
                loadData()
            } else {
                toast.error(result.error)
                setStatus('idle')
            }
        } catch (error) {
            toast.error('Error obteniendo ubicación. Asegúrate de permitir el acceso GPS.')
            setStatus('idle')
        }
    }

    const handleCheckOut = async () => {
        if (!activeEntry) return
        setStatus('loading')
        try {
            const pos = await getLocation()
            const result = await checkOut({ entryId: activeEntry.id, coords: pos })

            if (result.success) {
                toast.success('Salida registrada')
                loadData() // Will reset to idle
            } else {
                toast.error(result.error)
                setStatus('active')
            }
        } catch (error) {
            toast.error('Error obteniendo ubicación')
            setStatus('active')
        }
    }

    const setLoading = (isLoading: boolean) => {
        setStatus(prev => isLoading ? 'loading' : (activeEntry ? 'active' : 'idle'))
    }

    return (
        <Card className="w-full max-w-md mx-auto bg-card border-border shadow-md">
            <CardContent className="p-6 space-y-6">

                {/* Timer Display */}
                <div className="text-center space-y-2">
                    <h2 className="text-muted-foreground text-sm uppercase tracking-wider font-semibold">Tiempo Transcurrido</h2>
                    <div className="text-5xl font-mono font-bold text-foreground tracking-widest tabular-nums antialiased">
                        {timer}
                    </div>
                </div>

                {/* Status Indicator */}
                <div className="flex justify-center">
                    <div className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border",
                        status === 'active'
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-transparent"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full", status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                        {status === 'active' ? 'JORNADA ACTIVA' : 'JORNADA INACTIVA'}
                    </div>
                </div>

                {/* Project Selector (Only if Idle) */}
                {status === 'idle' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Seleccionar Proyecto (Opcional)</label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger className="bg-background border-input">
                                <SelectValue placeholder="Sin proyecto específico" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="unassigned">Sin proyecto</SelectItem>
                                {projects
                                    .filter(p => p.id && p.id !== '')
                                    .map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Active Info */}
                {status === 'active' && activeEntry?.projects && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Trabajando en</p>
                        <p className="text-foreground font-bold text-lg">{activeEntry.projects.name}</p>
                    </div>
                )}

                {/* Big Button */}
                <Button
                    size="lg"
                    className={cn(
                        "w-full h-24 text-xl font-bold transition-all shadow-lg hover:shadow-xl",
                        status === 'active'
                            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20"
                    )}
                    onClick={status === 'active' ? handleCheckOut : handleCheckIn}
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                    ) : status === 'active' ? (
                        <div className="flex flex-col items-center gap-1">
                            <Square className="h-8 w-8 fill-current" />
                            <span>FINALIZAR (SALIDA)</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-1">
                            <Play className="h-8 w-8 fill-current" />
                            <span>COMENZAR (ENTRADA)</span>
                        </div>
                    )}
                </Button>

                {/* Geo Hint */}
                <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Se registrará tu ubicación actual
                </div>

            </CardContent>
        </Card>
    )
}
