import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, DollarSign, Target, FileText, Play } from "lucide-react"
import Link from "next/link"
import { GenerateProposalButton } from "@/components/crm/generate-proposal-button"

async function getOpportunity(id: string) {
    // STUB: opportunities table doesn't exist in Prisma schema
    // TODO: Add opportunities model to Prisma
    return {
        id,
        title: 'Oportunidad de ejemplo',
        stage: 'proposal',
        amount: 15000,
        probability: 60,
        expected_close_date: new Date().toISOString(),
        description: 'Descripción de la oportunidad de ejemplo',
        customer_id: 'cust-1',
        customer: { id: 'cust-1', name: 'Cliente ejemplo', email: 'cliente@ejemplo.com', phone: '+34 600 000 000' }
    }
}

export default async function OpportunityDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const opportunity = await getOpportunity(id)

    if (!opportunity) {
        notFound()
    }

    const stages = [
        { id: 'prospecting', label: 'Prospección' },
        { id: 'qualification', label: 'Cualificación' },
        { id: 'proposal', label: 'Propuesta' },
        { id: 'negotiation', label: 'Negociación' },
        { id: 'closed_won', label: 'Ganada' },
        { id: 'closed_lost', label: 'Perdida' },
    ]

    const currentStageIndex = stages.findIndex(s => s.id === opportunity.stage)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/crm/clients">
                        <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-white">{opportunity.title}</h1>
                            <Badge variant={opportunity.stage === 'closed_won' ? 'default' : 'secondary'}>
                                {stages.find(s => s.id === opportunity.stage)?.label}
                            </Badge>
                        </div>
                        <p className="text-zinc-400 mt-1">
                            Cliente: <Link href={`/dashboard/crm/clients/${opportunity.customer?.id}`} className="text-emerald-400 hover:underline">{opportunity.customer?.name}</Link>
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <GenerateProposalButton opportunityId={opportunity.id} customerId={opportunity.customer_id} />
                </div>
            </div>

            {/* Pipeline Progress */}
            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                <div className="flex items-center justify-between min-w-[600px] gap-2">
                    {stages.map((stage, index) => {
                        const isCompleted = index <= currentStageIndex
                        const isCurrent = index === currentStageIndex
                        return (
                            <div key={stage.id} className="flex-1 flex flex-col items-center gap-2 relative">
                                <div className={`w-full h-1 rounded ${isCompleted ? 'bg-emerald-500' : 'bg-zinc-700'}`} />
                                <div className={`w-4 h-4 rounded-full border-2 z-10 ${isCurrent ? 'bg-white border-emerald-500' :
                                    isCompleted ? 'bg-emerald-500 border-emerald-500' : 'bg-zinc-800 border-zinc-700'
                                    }`} />
                                <span className={`text-xs ${isCurrent ? 'text-white font-bold' : isCompleted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                    {stage.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Info */}
                <Card className="md:col-span-2 bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-white">Detalles</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-sm text-zinc-500">Valor Estimado</span>
                                <div className="flex items-center gap-2 text-xl font-semibold text-white">
                                    <DollarSign className="h-5 w-5 text-emerald-500" />
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(opportunity.amount)}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-zinc-500">Probabilidad de Cierre</span>
                                <div className="flex items-center gap-2 text-xl font-semibold text-white">
                                    <Target className="h-5 w-5 text-blue-500" />
                                    {opportunity.probability}%
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-sm text-zinc-500">Fecha Cierre Estimada</span>
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <Calendar className="h-4 w-4" />
                                    {opportunity.expected_close_date ? new Date(opportunity.expected_close_date).toLocaleDateString() : 'No definida'}
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-zinc-800" />

                        <div className="space-y-2">
                            <h3 className="text-sm font-medium text-zinc-400">Notas / Descripción</h3>
                            <p className="text-zinc-300 leading-relaxed">
                                {opportunity.description || 'Sin descripción adicional.'}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar Actions / Metadata */}
                <div className="space-y-6">
                    <Card className="bg-emerald-900/10 border-emerald-500/20">
                        <CardHeader>
                            <CardTitle className="text-emerald-400 text-lg">Próxima Acción</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-zinc-300 text-sm mb-4">
                                Contactar cliente para revisión de presupuesto.
                            </p>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Play className="h-4 w-4 mr-2" />
                                Iniciar Tarea
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white text-base">Documentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3 p-3 rounded bg-zinc-800/50 mb-3">
                                <FileText className="h-8 w-8 text-blue-400" />
                                <div className="overflow-hidden">
                                    <div className="text-sm font-medium text-zinc-200 truncate">Propuesta_v1.pdf</div>
                                    <div className="text-xs text-zinc-500">Generado el 12 Dic</div>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full border-zinc-700 text-zinc-300">
                                Ver Todos
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
