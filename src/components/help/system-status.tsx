'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    RefreshCw,
    Wifi,
    CreditCard,
    Mail,
    Sun,
    Database
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'

interface ServiceStatus {
    name: string
    status: 'operational' | 'degraded' | 'down' | 'unknown'
    icon: React.ReactNode
    lastChecked?: Date
    message?: string
}

const statusConfig = {
    operational: {
        color: 'bg-emerald-500',
        textColor: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        label: 'Operativo',
        icon: CheckCircle2
    },
    degraded: {
        color: 'bg-amber-500',
        textColor: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        label: 'Degradado',
        icon: AlertTriangle
    },
    down: {
        color: 'bg-red-500',
        textColor: 'text-red-500',
        bgColor: 'bg-red-500/10',
        label: 'Caído',
        icon: XCircle
    },
    unknown: {
        color: 'bg-slate-500',
        textColor: 'text-slate-500',
        bgColor: 'bg-slate-500/10',
        label: 'Verificando...',
        icon: RefreshCw
    }
}

/**
 * SystemStatus Component
 * 
 * Muestra el estado de las APIs externas para reducir tickets de soporte.
 * - Google Solar API
 * - Stripe (Pagos)
 * - Resend (Email)
 * - Base de Datos
 */
export function SystemStatus() {
    const [services, setServices] = useState<ServiceStatus[]>([
        { name: 'Google Solar API', status: 'unknown', icon: <Sun className="h-4 w-4" /> },
        { name: 'Stripe (Pagos)', status: 'unknown', icon: <CreditCard className="h-4 w-4" /> },
        { name: 'Email (Resend)', status: 'unknown', icon: <Mail className="h-4 w-4" /> },
        { name: 'Base de Datos', status: 'unknown', icon: <Database className="h-4 w-4" /> }
    ])
    const [isChecking, setIsChecking] = useState(false)
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

    const checkStatus = async () => {
        setIsChecking(true)

        try {
            const response = await fetch('/api/system-status', {
                cache: 'no-store',
                next: { revalidate: 60 } // Cache for 60 seconds
            })

            if (response.ok) {
                const data = await response.json()
                setServices(data.services)
                setLastUpdate(new Date())
            }
        } catch (error) {
            console.error('Error checking system status:', error)
        } finally {
            setIsChecking(false)
        }
    }

    useEffect(() => {
        checkStatus()

        // Auto-refresh every 60 seconds
        const interval = setInterval(checkStatus, 60000)
        return () => clearInterval(interval)
    }, [])

    const allOperational = services.every(s => s.status === 'operational')
    const hasIssues = services.some(s => s.status === 'degraded' || s.status === 'down')

    return (
        <Card className="border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Estado del Sistema
                        </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        {allOperational && (
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                                Todo Operativo
                            </Badge>
                        )}
                        {hasIssues && (
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-xs">
                                Incidencias
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={checkStatus}
                            disabled={isChecking}
                        >
                            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {services.map((service) => {
                    const config = statusConfig[service.status]
                    const StatusIcon = config.icon

                    return (
                        <div
                            key={service.name}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded ${config.bgColor}`}>
                                    {service.icon}
                                </div>
                                <span className="text-sm font-medium">{service.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${config.color}`} />
                                <span className={`text-xs ${config.textColor}`}>
                                    {config.label}
                                </span>
                            </div>
                        </div>
                    )
                })}

                {lastUpdate && (
                    <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                        Última verificación: {lastUpdate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
