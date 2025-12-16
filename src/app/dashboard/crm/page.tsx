import { getCrmMetrics } from "@/lib/actions/crm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Activity, CheckCircle } from "lucide-react"
import { PageShell } from "@/components/ui/page-shell"

export default async function CRMDashboardPage() {
    const { success, data } = await getCrmMetrics()

    if (!success || !data) {
        return <div className="text-red-500">Error cargando métricas</div>
    }

    const { totalPipelineValue, valueByStage, recentActivitiesCount } = data


    return (
        <PageShell
            title="Resumen Comercial"
            description="Métricas clave y actividad reciente de tu equipo."
        >
            <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Valor Pipeline Total
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPipelineValue)}
                            </div>
                            <p className="text-xs text-zinc-500">
                                En oportunidades abiertas
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Actividades Recientes (30d)
                            </CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {recentActivitiesCount}
                            </div>
                            <p className="text-xs text-zinc-500">
                                Llamadas, correos y reuniones
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                Valor Ganado (Est.)
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valueByStage['closed_won'] || 0)}
                            </div>
                            <p className="text-xs text-zinc-500">
                                Ingresos cerrados
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4 bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Pipeline de Ventas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {/* Simple Bar Chart Placeholder - Visualization of valueByStage */}
                                {['prospecting', 'qualification', 'proposal', 'negotiation'].map((stage) => {
                                    const val = valueByStage[stage] || 0
                                    const percentage = totalPipelineValue > 0 ? (val / totalPipelineValue) * 100 : 0
                                    return (
                                        <div key={stage} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize text-zinc-400">{stage}</span>
                                                <span className="text-white font-medium">
                                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)}
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-500"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-3 bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Acciones Rápidas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="p-4 rounded border border-dashed border-zinc-700 text-center text-zinc-500">
                                Próximamente: Crear Oportunidad, Registrar Llamada
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageShell >
    )
}
