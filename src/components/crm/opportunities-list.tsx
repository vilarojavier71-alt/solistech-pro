'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createOpportunity } from '@/lib/actions/crm'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/ui/empty-state'

export function OpportunitiesList({ opportunities, customerId }: { opportunities: any[], customerId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            customer_id: customerId,
            title: formData.get('title') as string,
            amount: Number(formData.get('amount')),
            stage: formData.get('stage') as any,
            probability: Number(formData.get('probability')) || 50,
        }

        const result = await createOpportunity(data)
        setLoading(false)

        if (result.success) {
            toast.success('Oportunidad creada')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Error al crear oportunidad')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount)
    }

    // ✅ WCAG 2.1 AA/AAA Compliant - Using centralized theme
    const getStageColor = (stage: string) => getStatusColor('opportunity', stage)

    const getStageLabel = (stage: string) => {
        const labels: Record<string, string> = {
            prospecting: 'Prospección',
            qualification: 'Cualificación',
            proposal: 'Propuesta',
            negotiation: 'Negociación',
            closed_won: 'Ganada',
            closed_lost: 'Perdida'
        }
        return labels[stage] || stage
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Oportunidades de Venta</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Oportunidad
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Nueva Oportunidad</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Título</Label>
                                <Input name="title" required placeholder="Ej. Instalación Solar 5kW" className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Valor Estimado (â‚¬)</Label>
                                    <Input name="amount" type="number" required defaultValue="0" className="bg-zinc-950 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Probabilidad (%)</Label>
                                    <Input name="probability" type="number" defaultValue="50" max="100" min="0" className="bg-zinc-950 border-zinc-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Etapa</Label>
                                <Select name="stage" defaultValue="prospecting">
                                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                        <SelectValue placeholder="Selecciona etapa" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-900 border-zinc-800">
                                        <SelectItem value="prospecting">Prospección</SelectItem>
                                        <SelectItem value="qualification">Cualificación</SelectItem>
                                        <SelectItem value="proposal">Propuesta</SelectItem>
                                        <SelectItem value="negotiation">Negociación</SelectItem>
                                        <SelectItem value="closed_won">Cerrado (Ganada)</SelectItem>
                                        <SelectItem value="closed_lost">Cerrado (Perdida)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                {loading ? 'Guardando...' : 'Crear Oportunidad'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {opportunities.map((opp) => (
                    <Card key={opp.id} className="bg-zinc-900 border-zinc-800 transition-all hover:bg-zinc-800/50 hover:border-zinc-700">
                        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div className="font-semibold text-white">{opp.title}</div>
                                    <div className={`text-xs px-2 py-0.5 rounded-full border ${getStageColor(opp.stage)}`}>
                                        {getStageLabel(opp.stage)}
                                    </div>
                                </div>
                                <div className="text-sm text-zinc-500">
                                    Creada el {new Date(opp.created_at).toLocaleDateString()}
                                </div>
                            </div>

                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <DollarSign className="h-4 w-4 text-emerald-500" />
                                    <span className="font-medium">{formatCurrency(opp.amount)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-zinc-300">
                                    <TrendingUp className="h-4 w-4 text-blue-500" />
                                    <span>{opp.probability}% Prob.</span>
                                </div>
                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white" onClick={() => router.push(`/dashboard/crm/opportunities/${opp.id}`)}>
                                    Ver Detalles
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {opportunities.length === 0 && (
                    <EmptyState
                        icon={TrendingUp}
                        title="No hay oportunidades"
                        description="Crea una nueva oportunidad para comenzar a gestionar tu pipeline."
                        className="bg-zinc-900/50"
                    />
                )}
            </div>
        </div>
    )
}
