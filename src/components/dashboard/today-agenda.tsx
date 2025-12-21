'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Clock, MapPin, User, Plus } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Appointment {
    id: string
    title: string | null
    start_time: Date | null
    address: string | null
    customer?: { name: string; phone: string | null } | null
}

interface TodayAgendaProps {
    appointments: Appointment[]
    count: number
}

/**
 * Today Agenda Widget - Dashboard Centralita
 * Shows today's appointments in a compact view
 */
export function TodayAgenda({ appointments, count }: TodayAgendaProps) {
    const today = new Date()
    const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es })

    return (
        <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Agenda de Hoy
                        </CardTitle>
                        <p className="text-xs text-muted-foreground capitalize mt-1">
                            {formattedDate}
                        </p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 font-bold">
                        {count} citas
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {appointments.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin citas programadas</p>
                        <Link
                            href="/dashboard/calendar/new"
                            className="text-xs text-primary hover:underline mt-2 inline-flex items-center gap-1"
                        >
                            <Plus className="h-3 w-3" /> Agendar visita
                        </Link>
                    </div>
                ) : (
                    <>
                        {appointments.slice(0, 4).map((apt) => (
                            <div
                                key={apt.id}
                                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                {/* Time Block */}
                                <div className="bg-purple-500/10 text-purple-600 rounded-lg p-2 text-center min-w-[50px]">
                                    <p className="text-xs font-bold">
                                        {apt.start_time ? format(new Date(apt.start_time), 'HH:mm') : '--:--'}
                                    </p>
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {apt.title || 'Visita Comercial'}
                                    </p>
                                    {apt.customer && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                            <User className="h-3 w-3" />
                                            {apt.customer.name}
                                        </p>
                                    )}
                                    {apt.address && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                            <MapPin className="h-3 w-3" />
                                            {apt.address}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {appointments.length > 4 && (
                            <p className="text-xs text-center text-muted-foreground pt-1">
                                +{appointments.length - 4} más
                            </p>
                        )}

                        <Link
                            href="/dashboard/calendar"
                            className="flex items-center justify-center gap-1 text-xs text-primary hover:underline pt-2 border-t"
                        >
                            Ver agenda completa
                        </Link>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
