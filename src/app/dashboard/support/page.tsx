import { Metadata } from 'next'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Headphones,
    Plus,
    MessageCircle,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    LifeBuoy
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
    title: 'Soporte | MotorGap',
    description: 'Centro de ayuda y gestión de incidencias'
}

// Placeholder for support ticket stats - will be replaced with server action
async function getTicketStats() {
    // TODO: Connect to real data when prisma client is regenerated
    return {
        open: 0,
        inProgress: 0,
        resolved: 0,
        total: 0
    }
}

export default async function SupportPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/login')
    }

    const stats = await getTicketStats()

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Headphones className="h-7 w-7 text-primary" />
                        Centro de Soporte
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona incidencias y solicita ayuda técnica
                    </p>
                </div>
                <Link href="/dashboard/support/new">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nuevo Ticket
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <MessageCircle className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.open}</p>
                                <p className="text-xs text-muted-foreground">Abiertos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.inProgress}</p>
                                <p className="text-xs text-muted-foreground">En Proceso</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.resolved}</p>
                                <p className="text-xs text-muted-foreground">Resueltos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <LifeBuoy className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="my-tickets" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="my-tickets">Mis Tickets</TabsTrigger>
                    <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
                </TabsList>

                <TabsContent value="my-tickets">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mis Tickets de Soporte</CardTitle>
                            <CardDescription>
                                Historial de incidencias y consultas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Empty State */}
                            <div className="text-center py-12">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-2">Sin tickets activos</h3>
                                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                                    No tienes tickets de soporte abiertos. Si necesitas ayuda, crea un nuevo ticket y nuestro equipo te responderá lo antes posible.
                                </p>
                                <Link href="/dashboard/support/new">
                                    <Button className="gap-2">
                                        <Plus className="h-4 w-4" />
                                        Crear Primer Ticket
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="faq">
                    <Card>
                        <CardHeader>
                            <CardTitle>Preguntas Frecuentes</CardTitle>
                            <CardDescription>
                                Respuestas rápidas a las dudas más comunes
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                {
                                    question: '¿Cómo importo clientes desde Excel?',
                                    answer: 'Ve a Herramientas → Importador y sube tu archivo Excel. El sistema detectará automáticamente las columnas.'
                                },
                                {
                                    question: '¿Cómo solicito días de vacaciones?',
                                    answer: 'Accede a Control Horario y pulsa "Solicitar días". Selecciona las fechas y el tipo de ausencia.'
                                },
                                {
                                    question: '¿Cómo genero una factura?',
                                    answer: 'En la sección Facturas, pulsa "Nueva Factura", selecciona el cliente y añade los conceptos.'
                                },
                                {
                                    question: '¿Cómo contacto con soporte técnico?',
                                    answer: 'Crea un ticket de soporte con la categoría "Técnico" y nuestro equipo te responderá en menos de 24h.'
                                }
                            ].map((faq, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <h4 className="font-medium flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-primary" />
                                        {faq.question}
                                    </h4>
                                    <p className="text-sm text-muted-foreground pl-6">
                                        {faq.answer}
                                    </p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                        <Link href="/dashboard/support/new" className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Reportar Problema</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Algo no funciona correctamente
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="pt-6">
                        <Link href="/dashboard/support/new" className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                    <LifeBuoy className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Solicitar Ayuda</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Tengo una duda o consulta
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
