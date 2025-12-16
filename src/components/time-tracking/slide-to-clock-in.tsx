/**
 * Slide-to-ClockIn Component
 * 
 * Componente de fichaje con deslizamiento para confirmar (Slide-to-Action).
 * Previene fichajes accidentales mediante confirmación física.
 * 
 * Features:
 * - Slide-to-action con Framer Motion
 * - Haptic feedback (vibración)
 * - Validación GPS automática
 * - Sincronización offline
 * - Feedback visual inmediato
 * - Estilo "Industrial Dark"
 * 
 * @author @FRONTEND_DISENOUI
 * @version 1.0.0
 */

"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, PanInfo } from "framer-motion"
import { Clock, MapPin, Wifi, WifiOff, CheckCircle2, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGeolocation } from "@/hooks/useGeolocation"
import { useOfflineSync } from "@/hooks/useOfflineSync"
import { useHapticFeedback } from "@/hooks/useHapticFeedback"
import { validateGeofence, formatDistance } from "@/lib/utils/geofencing"

interface SlideToClockInProps {
    projectId?: string
    projectName?: string
    projectLocation?: {
        latitude: number
        longitude: number
    }
    geofenceRadius?: number
    onClockIn?: (data: ClockInData) => void
    onClockOut?: (data: ClockOutData) => void
    className?: string
}

interface ClockInData {
    timestamp: string
    location: GeolocationData | null
    projectId?: string
    locationValidation?: any
}

interface ClockOutData {
    timestamp: string
    location: GeolocationData | null
    duration: number
}

interface GeolocationData {
    latitude: number
    longitude: number
    accuracy: number
    timestamp: string
}

type ClockStatus = "idle" | "clocked_in" | "clocked_out"

export function SlideToClockIn({
    projectId,
    projectName,
    projectLocation,
    geofenceRadius = 500,
    onClockIn,
    onClockOut,
    className
}: SlideToClockInProps) {
    const [clockStatus, setClockStatus] = React.useState<ClockStatus>("idle")
    const [clockInTime, setClockInTime] = React.useState<Date | null>(null)
    const [elapsedTime, setElapsedTime] = React.useState(0)
    const [isProcessing, setIsProcessing] = React.useState(false)
    const [isConfirmed, setIsConfirmed] = React.useState(false)

    const { location, error: geoError } = useGeolocation()
    const { isOnline, syncState, addToQueue } = useOfflineSync()
    const { vibrate } = useHapticFeedback()

    // Framer Motion values
    const x = useMotionValue(0)
    const containerRef = React.useRef<HTMLDivElement>(null)
    const SLIDE_THRESHOLD = 0.9 // 90% del recorrido

    // Calcular ancho del contenedor
    const [containerWidth, setContainerWidth] = React.useState(0)
    React.useEffect(() => {
        if (containerRef.current) {
            setContainerWidth(containerRef.current.offsetWidth)
        }
    }, [])

    // Transformar posición a porcentaje
    const slidePercentage = useTransform(
        x,
        [0, containerWidth - 80],
        [0, 1]
    )

    // Transformar a color de fondo
    const backgroundColor = useTransform(
        slidePercentage,
        [0, 0.5, 0.9, 1],
        clockStatus === "clocked_in"
            ? ["rgb(30 41 59)", "rgb(20 83 45)", "rgb(5 150 105)", "rgb(4 120 87)"] // Slate → Green
            : ["rgb(30 41 59)", "rgb(14 116 144)", "rgb(6 182 212)", "rgb(8 145 178)"] // Slate → Cyan
    )

    // Transformar opacidad del texto
    const textOpacity = useTransform(slidePercentage, [0, 0.5], [1, 0])

    // ============================================================================
    // CRONÓMETRO
    // ============================================================================

    React.useEffect(() => {
        if (clockStatus !== "clocked_in" || !clockInTime) return

        const interval = setInterval(() => {
            const now = new Date()
            const diff = now.getTime() - clockInTime.getTime()
            setElapsedTime(Math.floor(diff / 1000))
        }, 1000)

        return () => clearInterval(interval)
    }, [clockStatus, clockInTime])

    const formatElapsedTime = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        const secs = seconds % 60
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    // ============================================================================
    // VALIDACIÓN DE UBICACIÓN
    // ============================================================================

    const locationValidation = React.useMemo(() => {
        if (!location || !projectLocation) {
            return {
                isValid: false,
                distance: 0,
                status: "unknown" as const,
                message: "Ubicación no disponible"
            }
        }

        return validateGeofence(
            { latitude: location.latitude, longitude: location.longitude },
            projectLocation,
            geofenceRadius
        )
    }, [location, projectLocation, geofenceRadius])

    // ============================================================================
    // MANEJO DE DESLIZAMIENTO
    // ============================================================================

    const handleDragEnd = (_: any, info: PanInfo) => {
        const currentX = x.get()
        const maxX = containerWidth - 80
        const percentage = currentX / maxX

        if (percentage >= SLIDE_THRESHOLD && !isProcessing) {
            // Confirmado - Vibración fuerte
            vibrate([100, 50, 100])
            setIsConfirmed(true)

            // Ejecutar acción después de animación
            setTimeout(() => {
                handleClockAction()
            }, 300)
        } else {
            // No alcanzó el threshold - Resetear
            x.set(0)
        }
    }

    const handleDrag = () => {
        const currentX = x.get()
        const maxX = containerWidth - 80
        const percentage = currentX / maxX

        // Vibración suave al alcanzar 80%
        if (percentage >= 0.8 && percentage < 0.85) {
            vibrate(50)
        }
    }

    // ============================================================================
    // ACCIÓN DE FICHAJE
    // ============================================================================

    const handleClockAction = async () => {
        setIsProcessing(true)

        try {
            const timestamp = new Date().toISOString()
            const locationData: GeolocationData | null = location
                ? {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    accuracy: location.accuracy,
                    timestamp: location.timestamp
                }
                : null

            if (clockStatus === "idle" || clockStatus === "clocked_out") {
                // Clock In
                const data: ClockInData = {
                    timestamp,
                    location: locationData,
                    projectId,
                    locationValidation: locationValidation
                }

                if (isOnline) {
                    await onClockIn?.(data)
                } else {
                    await addToQueue({
                        entity: 'time_entry',
                        action: 'clock_in',
                        data,
                        timestamp
                    })
                }

                setClockStatus("clocked_in")
                setClockInTime(new Date())
            } else {
                // Clock Out
                const duration = clockInTime
                    ? (new Date().getTime() - clockInTime.getTime()) / 1000
                    : 0

                const data: ClockOutData = {
                    timestamp,
                    location: locationData,
                    duration
                }

                if (isOnline) {
                    await onClockOut?.(data)
                } else {
                    await addToQueue({
                        entity: 'time_entry',
                        action: 'clock_out',
                        data,
                        timestamp
                    })
                }

                setClockStatus("clocked_out")
                setClockInTime(null)
                setElapsedTime(0)
            }
        } catch (error) {
            console.error("Error al fichar:", error)
        } finally {
            setIsProcessing(false)
            setIsConfirmed(false)
            x.set(0)
        }
    }

    const isClockedIn = clockStatus === "clocked_in"

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header con información */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">
                        {isClockedIn ? "En Operación" : "Listo para Fichar"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isOnline ? (
                        <Wifi className="size-4 text-teal-500" />
                    ) : (
                        <WifiOff className="size-4 text-amber-500" />
                    )}
                    {syncState.totalPending > 0 && (
                        <span className="text-xs text-amber-500 font-medium">
                            {syncState.totalPending} pendiente{syncState.totalPending > 1 ? "s" : ""}
                        </span>
                    )}
                </div>
            </div>

            {/* Información del proyecto */}
            {projectName && (
                <div className="rounded-lg border bg-card p-3 space-y-2">
                    <p className="text-sm font-medium">{projectName}</p>
                    {projectLocation && location && (
                        <div className="flex items-center gap-2">
                            <MapPin className="size-3 text-muted-foreground flex-shrink-0" />
                            <span
                                className={cn(
                                    "text-xs",
                                    locationValidation.status === "valid" && "text-teal-500",
                                    locationValidation.status === "suspicious" && "text-amber-500",
                                    locationValidation.status === "invalid" && "text-destructive"
                                )}
                            >
                                {locationValidation.status === "valid" && "✓ Ubicación verificada"}
                                {locationValidation.status === "suspicious" && "⚠ Ubicación sospechosa"}
                                {locationValidation.status === "invalid" && "✗ Fuera del área"}
                                {locationValidation.distance > 0 && ` (${formatDistance(locationValidation.distance)})`}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Cronómetro (solo cuando está fichado) */}
            {isClockedIn && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-lg bg-teal-950/50 border border-teal-800 p-6 text-center"
                >
                    <motion.div
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="text-5xl font-mono font-bold text-teal-400 tabular-nums"
                    >
                        {formatElapsedTime(elapsedTime)}
                    </motion.div>
                    <p className="mt-2 text-sm text-teal-300">Tiempo trabajado</p>
                </motion.div>
            )}

            {/* Slider Container */}
            <div
                ref={containerRef}
                className={cn(
                    "relative h-16 rounded-full border-2 overflow-hidden transition-colors shadow-inner",
                    isClockedIn
                        ? "border-teal-700"
                        : "border-slate-700",
                    isProcessing && "opacity-50 pointer-events-none"
                )}
            >
                {/* Animated Background */}
                <motion.div
                    className="absolute inset-0"
                    style={{ backgroundColor }}
                />

                {/* Track Text */}
                <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ opacity: textOpacity }}
                >
                    <span
                        className={cn(
                            "text-sm font-medium",
                            isClockedIn ? "text-teal-300" : "text-slate-400"
                        )}
                    >
                        {isClockedIn ? "Desliza para Salir →" : "Desliza para Entrar →"}
                    </span>
                </motion.div>

                {/* Slider Button */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: containerWidth - 80 }}
                    dragElastic={0.1}
                    dragMomentum={false}
                    onDrag={handleDrag}
                    onDragEnd={handleDragEnd}
                    style={{ x }}
                    className={cn(
                        "absolute top-2 left-2 h-12 w-20 rounded-full cursor-grab active:cursor-grabbing",
                        "flex items-center justify-center",
                        "shadow-lg",
                        isConfirmed
                            ? "bg-emerald-600"
                            : isClockedIn
                                ? "bg-gradient-to-r from-teal-600 to-teal-500"
                                : "bg-gradient-to-r from-cyan-600 to-cyan-500"
                    )}
                    whileTap={{ scale: 0.95 }}
                >
                    {isProcessing ? (
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="size-6 rounded-full border-2 border-white border-t-transparent"
                        />
                    ) : isConfirmed ? (
                        <CheckCircle2 className="size-6 text-white" />
                    ) : (
                        <ArrowRight className="size-6 text-white" />
                    )}
                </motion.div>
            </div>

            {/* Mensajes de error */}
            {geoError && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-destructive flex items-center gap-1"
                >
                    <span>⚠</span>
                    <span>Error de geolocalización: {geoError}</span>
                </motion.p>
            )}
        </div>
    )
}
