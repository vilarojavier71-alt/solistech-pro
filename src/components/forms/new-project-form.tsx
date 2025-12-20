'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

interface Customer {
    id: string
    name: string
    company?: string | null
}

export function NewProjectForm({ customers }: { customers: Customer[] }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()

    const preselectedCustomer = searchParams?.get('customer')

    const [formData, setFormData] = useState({
        name: '',
        customer_id: preselectedCustomer || '',
        installation_type: 'residential',
        status: 'quote',
        system_size_kwp: '',
        estimated_production_kwh: '',
        estimated_savings: '',
        street: '',
        city: '',
        postal_code: '',
        notes: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Import dinámico para evitar error si el archivo no existe en tiempo de compilación inicial
            const { createProject } = await import('@/lib/actions/projects')

            const result = await createProject({
                name: formData.name,
                customer_id: formData.customer_id,
                installation_type: formData.installation_type,
                status: formData.status,
                system_size_kwp: formData.system_size_kwp ? parseFloat(formData.system_size_kwp) : null,
                estimated_production_kwh: formData.estimated_production_kwh ? parseFloat(formData.estimated_production_kwh) : null,
                estimated_savings: formData.estimated_savings ? parseFloat(formData.estimated_savings) : null,
                street: formData.street,
                city: formData.city,
                postal_code: formData.postal_code,
                notes: formData.notes,
            })

            if (!result.success) {
                // Manejo de errores detallados de Zod si existen
                if (result.details) {
                    const firstError = Object.values(result.details)[0]
                    throw new Error(String(firstError))
                }
                throw new Error(result.error || 'Error al crear el proyecto')
            }

            toast.success('Proyecto creado correctamente')
            router.push('/dashboard/projects')
            router.refresh()
        } catch (error: any) {
            console.error('Error creating project:', error)
            toast.error(error.message || 'Error al crear el proyecto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nombre del Proyecto *</Label>
                    <Input
                        id="name"
                        placeholder="Instalación Solar Residencial"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="customer_id">Cliente *</Label>
                    <Select
                        value={formData.customer_id}
                        onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
                        disabled={loading}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            {customers.map((customer) => (
                                <SelectItem key={customer.id} value={customer.id}>
                                    {customer.name} {customer.company && `(${customer.company})`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="installation_type">Tipo de Instalación</Label>
                    <Select
                        value={formData.installation_type}
                        onValueChange={(value) => setFormData({ ...formData, installation_type: value })}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="residential">Residencial</SelectItem>
                            <SelectItem value="commercial">Comercial</SelectItem>
                            <SelectItem value="industrial">Industrial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Estado</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                        disabled={loading}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="quote">Presupuesto</SelectItem>
                            <SelectItem value="approved">Aprobado</SelectItem>
                            <SelectItem value="installation">Instalación</SelectItem>
                            <SelectItem value="completed">Completado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2">
                    <h3 className="text-sm font-medium mb-3">Datos Técnicos</h3>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="system_size_kwp">Potencia (kWp)</Label>
                    <Input
                        id="system_size_kwp"
                        type="number"
                        step="0.01"
                        placeholder="5.5"
                        value={formData.system_size_kwp}
                        onChange={(e) => setFormData({ ...formData, system_size_kwp: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="estimated_production_kwh">Producción Estimada (kWh/año)</Label>
                    <Input
                        id="estimated_production_kwh"
                        type="number"
                        placeholder="7500"
                        value={formData.estimated_production_kwh}
                        onChange={(e) => setFormData({ ...formData, estimated_production_kwh: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="estimated_savings">Ahorro Estimado (€/año)</Label>
                    <Input
                        id="estimated_savings"
                        type="number"
                        placeholder="1200"
                        value={formData.estimated_savings}
                        onChange={(e) => setFormData({ ...formData, estimated_savings: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="col-span-2">
                    <h3 className="text-sm font-medium mb-3">Ubicación</h3>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Dirección</Label>
                    <Input
                        id="street"
                        placeholder="Calle Principal, 123"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                        id="city"
                        placeholder="Madrid"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                        id="postal_code"
                        placeholder="28001"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                        id="notes"
                        placeholder="Información adicional sobre el proyecto..."
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
                    {loading ? 'Creando...' : 'Crear Proyecto'}
                </Button>
            </div>
        </form>
    )
}
