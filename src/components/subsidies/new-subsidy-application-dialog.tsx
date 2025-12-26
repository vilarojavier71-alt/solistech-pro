'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'


interface Customer {
    id: string
    name: string
}

interface NewSubsidyApplicationDialogProps {
    customers: Customer[]
    onSuccess: () => void
}

export function NewSubsidyApplicationDialog({ customers, onSuccess }: NewSubsidyApplicationDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [formData, setFormData] = useState({
        customerId: '',
        region: '',
        subsidyType: 'ibi_icio',
        estimatedAmount: '',
        submissionDeadline: '',
        notes: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.customerId || !formData.region || !formData.subsidyType) {
            toast.error('Por favor, completa los campos obligatorios')
            return
        }

        setLoading(true)

        try {
            const response = await fetch('/api/subsidy-applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: formData.customerId,
                    subsidy_type: formData.subsidyType,
                    region: formData.region,
                    estimated_amount: formData.estimatedAmount || null,
                    submission_deadline: formData.submissionDeadline || null,
                    notes: formData.notes || null
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(`✅ Expediente ${data.application?.application_number || ''} creado`)
                setOpen(false)
                setFormData({
                    customerId: '',
                    region: '',
                    subsidyType: 'ibi_icio',
                    estimatedAmount: '',
                    submissionDeadline: '',
                    notes: ''
                })
                onSuccess()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Error al crear el expediente')
            }
        } catch (error: any) {
            console.error('Error creating subsidy application:', error)
            toast.error('Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Expediente
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nuevo Expediente de Subvención</DialogTitle>
                    <DialogDescription>
                        Crea un nuevo expediente para tramitar ayudas fotovoltaicas
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Cliente */}
                    <div className="space-y-2">
                        <Label htmlFor="customer">Cliente *</Label>
                        <Select
                            value={formData.customerId}
                            onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.filter(c => c.id && c.id !== "").map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Región */}
                    <div className="space-y-2">
                        <Label htmlFor="region">Comunidad Autónoma *</Label>
                        <Select
                            value={formData.region}
                            onValueChange={(value) => setFormData({ ...formData, region: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona la región" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Andalucía">Andalucía</SelectItem>
                                <SelectItem value="Aragón">Aragón</SelectItem>
                                <SelectItem value="Asturias">Asturias</SelectItem>
                                <SelectItem value="Baleares">Baleares</SelectItem>
                                <SelectItem value="Canarias">Canarias</SelectItem>
                                <SelectItem value="Cantabria">Cantabria</SelectItem>
                                <SelectItem value="Castilla-La Mancha">Castilla-La Mancha</SelectItem>
                                <SelectItem value="Castilla y León">Castilla y León</SelectItem>
                                <SelectItem value="Cataluña">Cataluña</SelectItem>
                                <SelectItem value="Extremadura">Extremadura</SelectItem>
                                <SelectItem value="Galicia">Galicia</SelectItem>
                                <SelectItem value="La Rioja">La Rioja</SelectItem>
                                <SelectItem value="Madrid">Madrid</SelectItem>
                                <SelectItem value="Murcia">Murcia</SelectItem>
                                <SelectItem value="Navarra">Navarra</SelectItem>
                                <SelectItem value="País Vasco">País Vasco</SelectItem>
                                <SelectItem value="Valencia">Valencia</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipo de Subvención */}
                    <div className="space-y-2">
                        <Label htmlFor="subsidyType">Tipo de Subvención *</Label>
                        <Select
                            value={formData.subsidyType}
                            onValueChange={(value) => setFormData({ ...formData, subsidyType: value })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ibi_icio">IBI + ICIO (Municipal)</SelectItem>
                                <SelectItem value="irpf">IRPF (Estatal)</SelectItem>
                                <SelectItem value="autonomica">Autonómica</SelectItem>
                                <SelectItem value="europea">Fondos Europeos</SelectItem>
                                <SelectItem value="otra">Otra</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Importe Estimado */}
                    <div className="space-y-2">
                        <Label htmlFor="estimatedAmount">Importe Estimado (€)</Label>
                        <Input
                            id="estimatedAmount"
                            type="number"
                            step="0.01"
                            placeholder="5000.00"
                            value={formData.estimatedAmount}
                            onChange={(e) => setFormData({ ...formData, estimatedAmount: e.target.value })}
                        />
                    </div>

                    {/* Fecha Límite */}
                    <div className="space-y-2">
                        <Label htmlFor="deadline">Fecha Límite de Presentación</Label>
                        <Input
                            id="deadline"
                            type="date"
                            value={formData.submissionDeadline}
                            onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
                        />
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            placeholder="Información adicional sobre el expediente..."
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                'Crear Expediente'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
