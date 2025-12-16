'use client'

import { cn } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Fases de instalación
const PHASES = [
    { phase: 0, name: 'Pendiente', icon: Clock, color: 'text-gray-400' },
    { phase: 1, name: 'Pago Inicial', icon: Circle, color: 'text-blue-500' },
    { phase: 2, name: 'Diseño Aprobado', icon: Circle, color: 'text-indigo-500' },
    { phase: 3, name: 'Permisos', icon: Circle, color: 'text-purple-500' },
    { phase: 4, name: 'Material', icon: Circle, color: 'text-pink-500' },
    { phase: 5, name: 'Instalación', icon: Circle, color: 'text-orange-500' },
    { phase: 6, name: 'Legalización', icon: Circle, color: 'text-amber-500' },
    { phase: 7, name: 'Activado', icon: CheckCircle2, color: 'text-green-500' },
]

interface InstallationTimelineProps {
    currentPhase: number
    legalizationStatus?: string
    expectedCompletion?: Date | string | null
    className?: string
}

export function InstallationTimeline({
    currentPhase,
    legalizationStatus,
    expectedCompletion,
    className
}: InstallationTimelineProps) {
    const getPhaseStatus = (phase: number) => {
        if (phase < currentPhase) return 'completed'
        if (phase === currentPhase) return 'current'
        return 'pending'
    }

    const getLegalizationBadge = () => {
        switch (legalizationStatus) {
            case 'approved':
                return <Badge className="bg-green-500">Aprobado</Badge>
            case 'in_progress':
                return <Badge className="bg-amber-500">En Proceso</Badge>
            case 'rejected':
                return <Badge className="bg-red-500">Rechazado</Badge>
            default:
                return <Badge variant="secondary">Pendiente</Badge>
        }
    }

    const progressPercent = Math.round((currentPhase / 7) * 100)

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Progreso de Instalación</CardTitle>
                    <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
                </div>
                {expectedCompletion && (
                    <p className="text-sm text-muted-foreground">
                        Fecha estimada: {new Date(expectedCompletion).toLocaleDateString('es-ES')}
                    </p>
                )}
            </CardHeader>
            <CardContent>
                {/* Barra de progreso */}
                <div className="relative h-2 bg-muted rounded-full mb-6 overflow-hidden">
                    <div
                        className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Timeline vertical */}
                <div className="space-y-4">
                    {PHASES.map((phase, index) => {
                        const status = getPhaseStatus(phase.phase)
                        const Icon = phase.icon
                        const isCompleted = status === 'completed'
                        const isCurrent = status === 'current'

                        return (
                            <div
                                key={phase.phase}
                                className={cn(
                                    "flex items-center gap-4 p-3 rounded-lg transition-all",
                                    isCurrent && "bg-primary/10 border border-primary/20",
                                    isCompleted && "opacity-70"
                                )}
                            >
                                {/* Icono */}
                                <div className={cn(
                                    "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                    isCompleted && "bg-green-500 border-green-500 text-white",
                                    isCurrent && "border-primary bg-primary/20 text-primary animate-pulse",
                                    status === 'pending' && "border-muted bg-muted text-muted-foreground"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-bold">{phase.phase}</span>
                                    )}
                                </div>

                                {/* Contenido */}
                                <div className="flex-1">
                                    <h4 className={cn(
                                        "font-medium",
                                        isCurrent && "text-primary",
                                        isCompleted && "line-through"
                                    )}>
                                        {phase.name}
                                    </h4>
                                    {isCurrent && (
                                        <p className="text-sm text-muted-foreground">
                                            Fase actual
                                        </p>
                                    )}
                                </div>

                                {/* Estado de legalización en fase 6 */}
                                {phase.phase === 6 && currentPhase >= 6 && (
                                    <div>{getLegalizationBadge()}</div>
                                )}

                                {/* Check para completados */}
                                {isCompleted && (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Estado actual destacado */}
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-3">
                        {currentPhase === 7 ? (
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        ) : (
                            <Clock className="w-8 h-8 text-primary" />
                        )}
                        <div>
                            <h3 className="font-semibold">
                                {currentPhase === 7
                                    ? '¡Instalación Completada!'
                                    : `Fase ${currentPhase}: ${PHASES[currentPhase]?.name}`
                                }
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {currentPhase === 7
                                    ? 'Tu sistema solar está operativo'
                                    : `${7 - currentPhase} fases restantes`
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
