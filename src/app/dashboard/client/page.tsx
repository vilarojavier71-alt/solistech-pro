import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientProjects } from '@/lib/actions/client-portal'
import { InstallationTimeline } from '@/components/client/installation-timeline'
import { ChatWidget } from '@/components/client/chat-widget'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Sun,
    FileText,
    Phone,
    Mail,
    Download,
    Zap,
    Calendar
} from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'Mi Instalación Solar | Portal Cliente',
    description: 'Sigue el progreso de tu instalación de placas solares',
}

export default async function ClientDashboardPage() {
    const session = await auth()

    if (!session?.user) {
        redirect('/auth/login')
    }

    // Obtener proyectos del cliente
    const result = await getClientProjects()

    if (result.error || !result.projects?.length) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Sun className="w-16 h-16 text-amber-500 animate-pulse" />
                <h1 className="text-2xl font-bold">Bienvenido a tu Portal</h1>
                <p className="text-muted-foreground text-center max-w-md">
                    Aún no tienes proyectos de instalación solar asociados a tu cuenta.
                    Contacta con tu empresa instaladora para activar el seguimiento.
                </p>
            </div>
        )
    }

    const projects = result.projects
    const mainProject = projects[0] // Proyecto principal

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Sun className="w-8 h-8 text-amber-500" />
                        Mi Instalación Solar
                    </h1>
                    <p className="text-muted-foreground">
                        Sigue el progreso de tu proyecto en tiempo real
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        Documentos
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Facturas
                    </Button>
                </div>
            </div>

            {/* Grid Principal */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Timeline - 2 columnas */}
                <div className="lg:col-span-2">
                    <InstallationTimeline
                        currentPhase={mainProject.installation_phase}
                        legalizationStatus={mainProject.legalization_status || 'pending'}
                        expectedCompletion={mainProject.expected_completion}
                    />
                </div>

                {/* Panel lateral */}
                <div className="space-y-6">
                    {/* Info del Proyecto */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                Tu Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Proyecto</p>
                                <p className="font-medium">{mainProject.name}</p>
                            </div>
                            {mainProject.system_size_kwp && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Potencia Instalada</p>
                                    <p className="font-medium text-lg">
                                        {Number(mainProject.system_size_kwp).toFixed(1)} kWp
                                    </p>
                                </div>
                            )}
                            {mainProject.expected_completion && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Fecha Prevista</p>
                                    <p className="font-medium flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(mainProject.expected_completion).toLocaleDateString('es-ES', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contacto */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">¿Necesitas ayuda?</CardTitle>
                            <CardDescription>
                                Contacta con tu gestor de proyecto
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <a href="tel:+34912345678">
                                    <Phone className="w-4 h-4 mr-2" />
                                    Llamar
                                </a>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <a href="mailto:soporte@solistech.es">
                                    <Mail className="w-4 h-4 mr-2" />
                                    Enviar Email
                                </a>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Info Adicional */}
                    <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-200 dark:border-amber-800">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-3">
                                <Sun className="w-8 h-8 text-amber-500 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                                        Energía Limpia
                                    </h4>
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        Tu instalación contribuirá a reducir las emisiones de CO₂
                                        y generará ahorros en tu factura eléctrica.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Lista de Proyectos (si hay más de uno) */}
            {projects.length > 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Otros Proyectos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="divide-y">
                            {projects.slice(1).map((project) => (
                                <div key={project.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{project.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Fase {project.installation_phase} de 7
                                        </p>
                                    </div>
                                    <Link href={`/dashboard/client/${project.id}`}>
                                        <Button variant="ghost" size="sm">Ver</Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* AI Chat Assistant */}
            <ChatWidget userName={session.user.name || 'Cliente'} />
        </div>
    )
}
