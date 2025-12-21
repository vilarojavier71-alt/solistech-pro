import { getCrmMetrics } from "@/lib/actions/crm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, Activity, CheckCircle } from "lucide-react"

export async function OverviewMetrics() {
    const { success, data } = await getCrmMetrics()

    if (!success || !data) {
        return <div className="text-destructive p-4">Error cargando métricas</div>
    }

    const { totalPipelineValue, valueByStage, recentActivitiesCount } = data as {
        totalPipelineValue: number
        valueByStage: Record<string, number>
        recentActivitiesCount: number
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Valor Pipeline Total
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-card-foreground tracking-tight tabular-nums">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalPipelineValue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        En oportunidades abiertas
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Actividades Recientes (30d)
                    </CardTitle>
                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-card-foreground tracking-tight tabular-nums">
                        {recentActivitiesCount}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Llamadas, correos y reuniones
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Valor Ganado (Est.)
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-card-foreground tracking-tight tabular-nums">
                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(valueByStage['closed_won'] || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Ingresos cerrados
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
