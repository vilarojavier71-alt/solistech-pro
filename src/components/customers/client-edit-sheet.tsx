'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { updateClient, addNewClient } from '@/lib/actions/customers'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Customer {
    id: string
    full_name: string
    email?: string
    phone?: string
    nif?: string
    address?: string
    city?: string
    postal_code?: string
    province?: string
    country?: string
    notes?: string
    custom_attributes?: Record<string, any>
}

interface ClientEditSheetProps {
    client?: Customer
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: (client: Customer) => void
}

const clientSchema = z.object({
    full_name: z.string().min(1, 'El nombre es obligatorio'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().optional(),
    nif: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    province: z.string().optional(),
    country: z.string().optional(),
    notes: z.string().optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

export function ClientEditSheet({ client, open, onOpenChange, onSuccess }: ClientEditSheetProps) {
    const [loading, setLoading] = useState(false)
    const [customFields, setCustomFields] = useState<Record<string, string>>(
        client?.custom_attributes || {}
    )

    const form = useForm<ClientFormData>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            full_name: client?.full_name || '',
            email: client?.email || '',
            phone: client?.phone || '',
            nif: client?.nif || '',
            address: client?.address || '',
            city: client?.city || '',
            postal_code: client?.postal_code || '',
            province: client?.province || '',
            country: client?.country || 'España',
            notes: client?.notes || '',
        },
    })

    const onSubmit = async (data: ClientFormData) => {
        setLoading(true)

        // Combinar campos estándar + custom
        const allData = {
            ...data,
            ...customFields,
            full_name: data.name, // Ensure full_name is present for type compatibility
        }

        const result = client
            ? await updateClient(client.id, allData)
            : await addNewClient(allData)

        if (result.error) {
            toast.error(client ? 'Error al actualizar' : 'Error al crear', {
                description: result.error,
            })
        } else {
            toast.success(client ? 'Cliente actualizado' : 'Cliente creado')
            onSuccess(result.data!)
        }

        setLoading(false)
    }

    const handleCustomFieldChange = (key: string, value: string) => {
        setCustomFields(prev => ({
            ...prev,
            [key]: value,
        }))
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="bg-slate-900 border-slate-700 overflow-y-auto sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle className="text-slate-100">
                        {client ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </SheetTitle>
                    <SheetDescription className="text-slate-400">
                        {client
                            ? 'Modifica los datos del cliente. Los cambios se guardarán automáticamente.'
                            : 'Completa los datos del nuevo cliente.'}
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
                        {/* Campos SQL Estándar */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-mono uppercase tracking-wider text-slate-500">
                                Información Básica
                            </h3>

                            <FormField
                                control={form.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Nombre Completo *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="bg-slate-950 border-slate-700"
                                                placeholder="Juan PÃ©rez GarcÃ­a"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Email</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="email"
                                                className="bg-slate-950 border-slate-700"
                                                placeholder="juan@ejemplo.com"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Teléfono</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="bg-slate-950 border-slate-700 font-mono"
                                                    placeholder="612345678"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="nif"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">NIF/CIF</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="bg-slate-950 border-slate-700 font-mono uppercase"
                                                    placeholder="12345678A"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Dirección</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="bg-slate-950 border-slate-700"
                                                placeholder="Calle Principal, 123"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Ciudad</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="bg-slate-950 border-slate-700"
                                                    placeholder="Madrid"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="postal_code"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">C.P.</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="bg-slate-950 border-slate-700 font-mono"
                                                    placeholder="28001"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="province"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-slate-300">Provincia</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="bg-slate-950 border-slate-700"
                                                    placeholder="Madrid"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-slate-300">Notas</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                className="bg-slate-950 border-slate-700"
                                                placeholder="Notas adicionales..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Campos Personalizados (JSONB) */}
                        {Object.keys(customFields).length > 0 && (
                            <>
                                <Separator className="bg-slate-700" />
                                <div className="space-y-4">
                                    <h3 className="text-sm font-mono uppercase tracking-wider text-slate-500">
                                        Campos Personalizados
                                    </h3>
                                    {Object.entries(customFields).map(([key, value]) => (
                                        <div key={key}>
                                            <label className="text-sm text-slate-300 mb-2 block capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </label>
                                            <Input
                                                value={value}
                                                onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                                                className="bg-slate-950 border-slate-700"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* Botones */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="flex-1 border-slate-700"
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {client ? 'Guardar Cambios' : 'Crear Cliente'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    )
}
