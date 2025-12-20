'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateClient } from '@/lib/actions/customers'

interface Customer {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    tax_id: string | null
    address: {
        street?: string | null
        city?: string | null
        state?: string | null
        postal_code?: string | null
        country?: string | null
    } | null
}

export function EditCustomerForm({ customer }: { customer: Customer }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()


    const [formData, setFormData] = useState({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        company: customer.company || '',
        tax_id: customer.tax_id || '',
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        postal_code: customer.address?.postal_code || '',
        country: customer.address?.country || 'EspaÒa',
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
                tax_id: formData.tax_id,
                street: formData.street,
                city: formData.city,
                state: formData.state,
                postal_code: formData.postal_code,
                country: formData.country,
            }

            const result = await updateClient(customer.id, {
                ...payload,
                address: {
                    street: formData.street,
                    city: formData.city,
                    state: formData.state,
                    postal_code: formData.postal_code,
                    country: formData.country
                }
            })

            if (!result.success) throw new Error(result.error || 'Error desconocido')

            toast.success('Cliente actualizado correctamente')
            router.push('/dashboard/customers')
            router.refresh()
        } catch (error: any) {
            console.error('Error updating customer:', error)
            toast.error(error.message || 'Error al actualizar el cliente')
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
                        placeholder="Juan P√©rez"
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
                    <Label htmlFor="phone">Tel√©fono</Label>
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
                    <Label htmlFor="tax_id">CIF/NIF</Label>
                    <Input
                        id="tax_id"
                        placeholder="B12345678"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="col-span-2">
                    <h3 className="text-sm font-medium mb-3">DirecciÛn</h3>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Calle</Label>
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
                    <Label htmlFor="postal_code">CÛdigo Postal</Label>
                    <Input
                        id="postal_code"
                        placeholder="28001"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">Provincia</Label>
                    <Input
                        id="state"
                        placeholder="Madrid"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country">Pa√≠s</Label>
                    <Input
                        id="country"
                        placeholder="EspaÒa"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
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
