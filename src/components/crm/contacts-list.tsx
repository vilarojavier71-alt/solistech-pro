'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, User, Phone, Mail, MoreHorizontal, Trash2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createContact, deleteContact } from '@/lib/actions/crm'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ContactsList({ contacts, customerId }: { contacts: any[], customerId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)

        const data = {
            customer_id: customerId,
            first_name: formData.get('first_name') as string,
            last_name: formData.get('last_name') as string,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            role: formData.get('role') as string,
        }

        const result = await createContact(data)
        setLoading(false)

        if (result.success) {
            toast.success('Contacto creado')
            setOpen(false)
            router.refresh()
        } else {
            toast.error(result.error || 'Error al crear contacto')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar contacto?')) return
        const res = await deleteContact(id)
        if (res.success) {
            toast.success('Contacto eliminado')
            router.refresh()
        } else {
            toast.error('Error al eliminar')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white">Contactos Asociados</h3>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300">
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Contacto
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
                        <DialogHeader>
                            <DialogTitle>Nuevo Contacto</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nombre</Label>
                                    <Input name="first_name" required className="bg-zinc-950 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Apellidos</Label>
                                    <Input name="last_name" className="bg-zinc-950 border-zinc-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input name="email" type="email" className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>TelÃ©fono</Label>
                                <Input name="phone" className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <div className="space-y-2">
                                <Label>Cargo / Rol</Label>
                                <Input name="role" placeholder="Ej. CEO, TÃ©cnico..." className="bg-zinc-950 border-zinc-800" />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
                                {loading ? 'Guardando...' : 'Guardar Contacto'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {contacts.map((contact) => (
                    <Card key={contact.id} className="bg-zinc-900 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center">
                                        <User className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{contact.first_name} {contact.last_name}</div>
                                        <div className="text-xs text-zinc-500">{contact.role || 'Sin cargo'}</div>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-6 w-6 p-0 text-zinc-500">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                                        <DropdownMenuItem className="text-red-500 focus:bg-red-900/20" onClick={() => handleDelete(contact.id)}>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Eliminar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div className="space-y-2 mt-4 text-sm text-zinc-400">
                                {contact.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-3 w-3" />
                                        {contact.email}
                                    </div>
                                )}
                                {contact.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-3 w-3" />
                                        {contact.phone}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {contacts.length === 0 && (
                    <div className="col-span-full text-center py-8 text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                        No hay contactos registrados
                    </div>
                )}
            </div>
        </div>
    )
}
