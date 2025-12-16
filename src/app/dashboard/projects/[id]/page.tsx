'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, FileText, Download, Hammer, Edit } from 'lucide-react'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { TechnicalMemoryPDF } from '@/components/pdf/technical-memory-pdf'
import { getProjectTechnicalData } from '@/lib/actions/documents'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { AssignClientForm } from '@/components/projects/assign-client-form'

const LazyProjectMap = dynamic(() => import('@/components/maps/project-location-map'), {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[300px] rounded-xl" />
})

export default function ProjectDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [project, setProject] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [technicalData, setTechnicalData] = useState<any>(null)

    useEffect(() => {
        const fetchProject = async () => {
            // STUB: Use API route or server action to fetch project
            // TODO: Create /api/projects/[id] route with Prisma
            setProject({
                id: params.id,
                name: 'Proyecto de ejemplo',
                status: 'in_progress',
                address: 'Calle Principal 123, Madrid',
                coordinates: { lat: 40.4168, lng: -3.7038 },
                system_size: '5.5',
                budget: 15000,
                customers: {
                    full_name: 'Cliente ejemplo',
                    email: 'cliente@ejemplo.com',
                    phone: '+34 600 000 000'
                }
            })
            // Fetch technical data for PDF
            if (params.id) {
                getProjectTechnicalData(params.id as string).then(tech => {
                    if (tech) setTechnicalData(tech)
                })
            }
            setLoading(false)
        }
        fetchProject()
    }, [params.id])

    if (loading) return <div>Cargando proyecto...</div>
    if (!project) return <div>Proyecto no encontrado</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <p className="text-muted-foreground">{project.customers?.full_name}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/dashboard/projects/${project.id}/edit`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Proyecto</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Estado</span>
                            <span className="font-medium capitalize">{project.status}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Ubicación</span>
                            <span className="font-medium text-right">{project.address || 'ND'}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Potencia</span>
                            <span className="font-medium">{project.system_size || '0'} kWp</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Presupuesto</span>
                            <span className="font-medium">{project.budget ? `${project.budget} €` : 'Pendiente'}</span>
                        </div>

                        <div className="pt-4">
                            <LazyProjectMap address={project.address} coordinates={project.coordinates} />
                        </div>
                        <div className="pt-4 border-t">
                            <AssignClientForm
                                projectId={params.id as string}
                                currentPortalUser={project.portal_user} // This might be undefined in mock, but component handles it
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Documentación Técnica</CardTitle>
                        <CardDescription>Generación automática de documentos</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {technicalData ? (
                            <PDFDownloadLink
                                document={<TechnicalMemoryPDF data={technicalData} />}
                                fileName={`Memoria_Tecnica_${project.name}.pdf`}
                            >
                                {/* @ts-ignore */}
                                {({ blob, url, loading, error }) => (
                                    <Button className="w-full" disabled={loading} variant="default">
                                        <FileText className="mr-2 h-4 w-4" />
                                        {loading ? 'Generando PDF...' : 'Descargar Memoria Técnica'}
                                    </Button>
                                )}
                            </PDFDownloadLink>
                        ) : (
                            <Button className="w-full" disabled variant="secondary">
                                Preparando documento...
                            </Button>
                        )}

                        <Button className="w-full" variant="outline" disabled>
                            <Hammer className="mr-2 h-4 w-4" />
                            Hoja de Instalación (Próximamente)
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="activity" className="w-full">
                <TabsList>
                    <TabsTrigger value="activity">Actividad</TabsTrigger>
                    <TabsTrigger value="files">Archivos</TabsTrigger>
                </TabsList>
                <TabsContent value="activity">
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground">Historial del proyecto próximamente...</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="files">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg">
                                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                                <p className="text-sm text-muted-foreground">No hay archivos adjuntos</p>
                                <Button variant="link">Subir Archivo</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
