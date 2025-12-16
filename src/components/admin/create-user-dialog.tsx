'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createSystemUser } from '@/lib/actions/admin-users'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'

export function CreateUserDialog({ onSuccess }: { onSuccess?: () => void }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)

        try {
            const result = await createSystemUser(null, formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success) {
                toast.success('Usuario creado correctamente')
                toast.info(`Credenciales: ${result.data.email} / ${result.data.password}`, { duration: 10000 })
                setOpen(false)
                if (onSuccess) onSuccess()
            }
        } catch (err) {
            toast.error('Error al enviar formulario')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>
                        Ficha de alta para empleados o clientes. Se generará una contraseña temporal.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fullName">Nombre Completo</Label>
                        <Input id="fullName" name="fullName" placeholder="Ej. Juan PÃ©rez" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Correo ElectrÃ³nico</Label>
                        <Input id="email" name="email" type="email" placeholder="juan@empresa.com" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Rol de Sistema</Label>
                        <Select name="role" required defaultValue="cliente">
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="comercial">Comercial</SelectItem>
                                <SelectItem value="instalador">Instalador</SelectItem>
                                <SelectItem value="cliente">Cliente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Contraseña Provisional</Label>
                        <Input id="password" name="password" type="text" placeholder="MÃ­nimo 6 caracteres" minLength={6} required />
                    </div>

                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Crear Usuario
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
