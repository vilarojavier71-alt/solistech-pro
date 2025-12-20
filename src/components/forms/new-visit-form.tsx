'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createVisitAction, getCustomersForSelect, getTeamForSelect } from '@/lib/actions/sales-actions'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function NewVisitForm() {
    const router = useRouter()
    // const supabase = createClient()
    const [loading, setLoading] = useState(false)

    // Data Sources
    const [customers, setCustomers] = useState<any[]>([])
    const [commercials, setCommercials] = useState<any[]>([])

    // Form State
    const [formData, setFormData] = useState({
        title: 'Visita Comercial',
        customerId: '',
        commercialId: '',
        date: '',
        time: '',
        description: '',
        address: ''
    })

    useEffect(() => {
        const loadData = async () => {
            // 1. Load Customers
            const { data: custs } = await getCustomersForSelect()
            if (custs) setCustomers(custs)

            // 2. Load Commercials (Team)
            const { data: comms } = await getTeamForSelect(['commercial', 'owner', 'admin'])
            if (comms) setCommercials(comms)
        }
        loadData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (!formData.customerId || !formData.commercialId || !formData.date || !formData.time) {
                toast.error('Por favor completa los campos obligatorios')
                setLoading(false) // Ensure loading is reset on validation error
                return
            }

            // Construct ISO Date
            const startDateTime = new Date(`${formData.date}T${formData.time}:00`)
            // Default duration 1 hour
            const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000)

            const { success, error } = await createVisitAction({
                // organization_id and created_by are handled in server action via session
                title: formData.title,
                description: formData.description,
                start_time: startDateTime.toISOString(),
                end_time: endDateTime.toISOString(),
                customer_id: formData.customerId,
                assigned_to: formData.commercialId,
                address: formData.address
            })

            if (!success) {
                toast.error(error || 'Error al agendar visita')
                setLoading(false)
                return
            }

            toast.success('Visita agendada correctamente')
            router.push('/dashboard/calendar')

        } catch (error: any) {
            console.error(error)
            toast.error('Error al agendar visita')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Agendar Nueva Visita</CardTitle>
                <CardDescription>Asigna una visita técnica o comercial a un compañero.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="space-y-2">
                        <Label>Cliente *</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, customerId: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar cliente..." />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Comercial Asignado *</Label>
                        <Select onValueChange={(val) => setFormData({ ...formData, commercialId: val })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar comercial..." />
                            </SelectTrigger>
                            <SelectContent>
                                {commercials.map(c => (
                                    <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha *</Label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    required
                                    className="pl-10"
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Hora *</Label>
                            <div className="relative">
                                <Input
                                    type="time"
                                    required
                                    className="pl-10"
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Ubicación / Dirección</Label>
                        <Input
                            placeholder="Dirección de la visita..."
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Notas para el Comercial</Label>
                        <Textarea
                            placeholder="Detalles sobre el interés del cliente, perro peligroso, etc..."
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-700" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Agendar Visita
                    </Button>

                </form>
            </CardContent>
        </Card>
    )
}
