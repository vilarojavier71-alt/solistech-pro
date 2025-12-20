import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CalendarDays, MapPin, Clock, User, Plus } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default async function CalendarPage() {
    const session = await auth()

    if (!session?.user) return null

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, full_name: true }
    })

    // STUB: appointments table not in current Prisma schema
    // TODO: Add appointments model to Prisma schema and implement
    const appointments: any[] = []

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Agenda Comercial</h1>
                    <p className="text-slate-500">Próximas visitas y citas programadas.</p>
                </div>
                <Button asChild className="bg-sky-600 hover:bg-sky-700">
                    <Link href="/dashboard/calendar/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Agendar Visita
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4">
                {appointments && appointments.length > 0 ? (
                    appointments.map((apt) => (
                        <Card key={apt.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                {/* Date Box */}
                                <div className="flex flex-col items-center justify-center p-3 bg-slate-100 rounded-lg min-w-[80px]">
                                    <span className="text-xs text-slate-500 uppercase font-bold">
                                        {format(new Date(apt.start_time), 'MMM', { locale: es })}
                                    </span>
                                    <span className="text-2xl font-bold text-slate-800">
                                        {format(new Date(apt.start_time), 'dd')}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {format(new Date(apt.start_time), 'HH:mm')}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="flex-1 space-y-1">
                                    <h3 className="font-semibold text-lg">{apt.title || 'Visita Comercial'}</h3>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                        <div className="flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            {apt.customers?.full_name || 'Cliente Potencial'} ({apt.customers?.phone})
                                        </div>
                                        {apt.address && (
                                            <div className="flex items-center gap-1">
                                                <MapPin className="h-4 w-4" />
                                                {apt.address}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-2">
                                        Asignado a: <span className="font-medium text-sky-700">{apt.assigned_user?.full_name || 'Sin asignar'}</span>
                                    </div>
                                </div>

                                {/* Actions / Status */}
                                <div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${apt.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                        apt.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                            'bg-gray-50 text-gray-700'
                                        }`}>
                                        {apt.status === 'scheduled' ? 'Programada' : apt.status}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                        <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-slate-900">Agenda vacía</h3>
                        <p className="text-slate-500 mb-6">No hay visitas programadas próximamente.</p>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/calendar/new">Crear primera visita</Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
