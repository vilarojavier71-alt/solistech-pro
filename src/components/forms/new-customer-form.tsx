'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import { addNewClient } from '@/lib/actions/customers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export function NewCustomerForm() {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()
    const searchParams = useSearchParams()

    const leadId = searchParams?.get('from_lead')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        tax_id: '',
        street: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'España',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            try {
                // Mapear campos del formulario a los nombres esperados por el schema del servidor
                const dataToSend = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    nif: formData.tax_id, // tax_id -> nif
                    address: formData.street, // street -> address
                    city: formData.city,
                    postal_code: formData.postal_code,
                    province: formData.state, // state -> province
                    country: formData.country,
                    notes: formData.company ? `Empresa: ${formData.company}` : '', // company -> notes
                }

                const result = await addNewClient(dataToSend)

                if (result.success) {
                    toast.success('Cliente creado correctamente')
                    router.push('/dashboard/customers')
                    router.refresh()
                } else {
                    toast.error(result.error || 'Error al crear el cliente')
                }
            } catch (error: any) {
                console.error('Error creating customer:', error)
                toast.error('Error inesperado al crear el cliente')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                        id="name"
                        placeholder="Juan PÃ©rez"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        disabled={isPending}
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
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">TelÃ©fono</Label>
                    <Input
                        id="phone"
                        type="tel"
                        placeholder="+34 600 000 000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                        id="company"
                        placeholder="Empresa S.L."
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tax_id">CIF/NIF</Label>
                    <Input
                        id="tax_id"
                        placeholder="B12345678"
                        value={formData.tax_id}
                        onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="col-span-2">
                    <h3 className="text-sm font-medium mb-3">Dirección</h3>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="street">Calle</Label>
                    <Input
                        id="street"
                        placeholder="Calle Principal, 123"
                        value={formData.street}
                        onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                        id="city"
                        placeholder="Madrid"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="postal_code">Código Postal</Label>
                    <Input
                        id="postal_code"
                        placeholder="28001"
                        value={formData.postal_code}
                        onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="state">Provincia</Label>
                    <Input
                        id="state"
                        placeholder="Madrid"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country">PaÃ­s</Label>
                    <Input
                        id="country"
                        placeholder="España"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        disabled={isPending}
                    />
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Creando...' : 'Crear Cliente'}
                </Button>
            </div>
        </form>
    )
}
