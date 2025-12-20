'use client'

import { useState, useTransition } from 'react'
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
import { createLead } from '@/lib/actions/leads'

export function NewLeadForm() {
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const result = await createLead(formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Lead creado correctamente')
                router.push('/dashboard/leads')
            }
        })
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                        id="name"
                        name="name"
                        placeholder="Juan Pérez"
                        required
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="juan@ejemplo.com"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+34 600 000 000"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input
                        id="company"
                        name="company"
                        placeholder="Empresa S.L."
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="estimated_value">Valor Estimado (€)</Label>
                    <Input
                        id="estimated_value"
                        name="estimated_value"
                        type="number"
                        placeholder="10000"
                        disabled={isPending}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="source">Origen</Label>
                    <Select name="source" defaultValue="web" disabled={isPending}>
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
                    <Select name="status" defaultValue="new" disabled={isPending}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">Nuevo</SelectItem>
                            <SelectItem value="contacted">Contactado</SelectItem>
                            <SelectItem value="qualified">Cualificado</SelectItem>
                            <SelectItem value="proposal">Propuesta</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="col-span-2 space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Información adicional sobre el lead..."
                        rows={4}
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
                    {isPending ? 'Creando...' : 'Crear Lead'}
                </Button>
            </div>
        </form>
    )
}
