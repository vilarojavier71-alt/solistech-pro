'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { updateSystemUser } from '@/lib/actions/admin-users'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface EditUserDialogProps {
    user: {
        id: string
        full_name: string
        role: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        formData.append('userId', user.id)

        const result = await updateSystemUser(null, formData)
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Usuario actualizado correctamente')
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <DialogDescription>
                        Modifica los detalles del empleado.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="fullName" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                defaultValue={user.full_name}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Rol
                            </Label>
                            <Select name="role" defaultValue={user.role} required>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="ingeniero">Ingeniero</SelectItem>
                                    <SelectItem value="comercial">Comercial</SelectItem>
                                    <SelectItem value="captador_visitas">Captador Visitas</SelectItem>
                                    <SelectItem value="employee">Empleado</SelectItem>
                                    <SelectItem value="user">Usuario Básico</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar cambios
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
