import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Hammer, Calendar as CalendarIcon, MapPin, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { redirect } from 'next/navigation'

export default async function InstallationsPage() {
    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    // Fetch projects with status 'installation' or similar active statuses
    // Prioritizing installation, then approved/signed projects
    const projects = await prisma.project.findMany({
        where: {
            organization_id: session.user.organizationId,
            status: { in: ['installation', 'approved', 'signed'] }
        },
        orderBy: { updated_at: 'desc' },
        include: {
            customer: true
        }
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mis Instalaciones (Técnico)</h1>
                <p className="text-muted-foreground">
                    Calendario de obras y detalles técnicos asignados
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Card key={project.id} className="border-l-4 border-l-orange-500">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{project.name}</CardTitle>
                                <span className={`px-2 py-1 rounded text-xs font-semibold
                                    ${project.status === 'installation' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {project.status === 'installation' ? 'EN PROCESO' : project.status?.toUpperCase()}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center text-slate-600 dark:text-slate-300">
                                <MapPin className="h-4 w-4 mr-2" />
                                {/* Location is JSON, need to parse if possible or show address */}
                                {project.location ? (project.location as any).address : 'Sin dirección'}
                            </div>
                            <div className="flex items-center text-slate-600 dark:text-slate-300">
                                <Hammer className="h-4 w-4 mr-2" />
                                {Number(project.system_size_kwp || 0).toFixed(1)} kWp ({project.installation_type || 'Estándar'})
                            </div>

                            <div className="pt-4 flex gap-2">
                                <Button size="sm" className="w-full bg-slate-800 text-white">
                                    <CheckCircle className="h-3 w-3 mr-2" /> Finalizar
                                </Button>
                                <Button size="sm" variant="outline" className="w-full">
                                    Ver Planos
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <Hammer className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Sin instalaciones pendientes</h3>
                        <p className="text-slate-500 dark:text-slate-400">No hay proyectos en fase de instalación actualmente.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
