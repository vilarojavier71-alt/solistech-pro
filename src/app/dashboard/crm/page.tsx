import { PageShell } from "@/components/ui/page-shell"
import { OverviewMetrics } from "@/components/crm/overview-metrics"
import { OverviewPipeline } from "@/components/crm/overview-pipeline"
import { MetricsSkeleton, PipelineSkeleton } from "@/components/crm/crm-skeletons"
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function CRMDashboardPage() {
    return (
        <PageShell
            title="Resumen Comercial"
            description="Métricas clave y actividad reciente de tu equipo."
        >
            <div className="space-y-6">

                <Suspense fallback={<MetricsSkeleton />}>
                    <OverviewMetrics />
                </Suspense>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Suspense fallback={<PipelineSkeleton />}>
                        <OverviewPipeline />
                    </Suspense>

                    <Card className="col-span-3 bg-card border-border shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-card-foreground">Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="p-4 rounded border border-dashed border-border bg-muted/50 text-center text-muted-foreground flex flex-col justify-center items-center h-[200px]">
                                <p>Próximamente: Crear Oportunidad, Registrar Llamada</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageShell >
    )
}
