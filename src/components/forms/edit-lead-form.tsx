'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { updateLead } from '@/lib/actions/leads'
import { Lead } from '@/types'

export function EditLeadForm({ lead }: { lead: Lead }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()


    const [formData, setFormData] = useState({
        name: lead.name,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        source: lead.source || 'web',
        status: lead.status,
        estimated_value: lead.estimated_value?.toString() || '',
        notes: lead.notes || '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                source: formData.source,
                status: formData.status,
                estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : undefined,
                notes: formData.notes
            }

            const result = await updateLead(lead.id, payload)

            if (result.error) throw new Error(result.error || 'Error desconocido')

            toast.success('Lead actualizado correctamente')
            router.push('/dashboard/leads')
            router.refresh()
        } catch (error: any) {
            console.error('Error updating lead:', error)
            toast.error(error.message || 'Error al actualizar el lead')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                        id="name"
                        placeholder="Juan Pérez"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                        id="company"
                        placeholder="Empresa S.L."
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="estimated_value">Valor Estimado (€)</Label>
                    <Input
                        id="estimated_value"
                        type="number"
                        placeholder="10000"
                        value={formData.estimated_value}
                        onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="source">Origen</Label>
                    <Select
                        value={formData.source}
                        onValueChange={(value: any) => setFormData({ ...formData, source: value })}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="web">Web</SelectItem>
                            <SelectItem value="referral">Referido</SelectItem>
                            <SelectItem value="cold_call">Llamada en frío</SelectItem>
                            <SelectItem value="social_media">Redes sociales</SelectItem>
                            <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">Nuevo</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="qualified">Cualificado</SelectItem>
                            <SelectItem value="proposal">Propuesta</SelectItem>
                            <SelectItem value="won">Ganado</SelectItem>
                            <SelectItem value="lost">Perdido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                        id="notes"
                        placeholder="Informaci�n adicional sobre el lead..."
                        rows={4}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
        </form>
    )
}
