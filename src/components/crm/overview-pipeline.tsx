import { getCrmMetrics } from "@/lib/actions/crm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export async function OverviewPipeline() {
    const { success, data } = await getCrmMetrics()

    if (!success || !data) return null

    const { totalPipelineValue, valueByStage } = data as {
        totalPipelineValue: number
        valueByStage: Record<string, number>
    }

    const STAGES = [
        { key: 'prospecting', label: 'Prospección' },
        { key: 'qualification', label: 'Cualificación' },
        { key: 'proposal', label: 'Propuesta' },
        { key: 'negotiation', label: 'Negociación' }
    ]

    return (
        <Card className="col-span-4 bg-card border-border shadow-sm">
            <CardHeader>
                <CardTitle className="text-card-foreground text-lg">Pipeline de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-5">
                    {STAGES.map(({ key, label }) => {
                        const val = valueByStage[key] || 0
                        const percentage = totalPipelineValue > 0 ? (val / totalPipelineValue) * 100 : 0
                        return (
                            <div key={key} className="space-y-1.5">
                                <div className="flex justify-between text-sm items-end">
                                    <span className="font-medium text-muted-foreground">{label}</span>
                                    <span className="text-card-foreground font-semibold tabular-nums">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val)}
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.max(percentage, 2)}%` }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
