'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { UserPlus, Loader2 } from 'lucide-react'
import { createEmployee } from '@/lib/actions/employees'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const schema = z.object({
    full_name: z.string().min(2, 'El nombre es requerido'),
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    role: z.enum(['user', 'ingeniero', 'comercial', 'captador_visitas', 'admin']),
})

type FormData = z.infer<typeof schema>

const roleLabels: Record<FormData['role'], string> = {
    ingeniero: 'Ingeniero',
    comercial: 'Comercial',
    captador_visitas: 'Captador de Visitas',
    user: 'Usuario Estándar',
    admin: 'Administrador',
}

const roleDescriptions: Record<FormData['role'], string> = {
    ingeniero: 'Personal técnico: acceso a instalaciones y fichajes',
    comercial: 'Ventas: acceso a CRM, calculadora y clientes',
    captador_visitas: 'Generación de leads: acceso limitado a captación',
    user: 'Acceso básico a proyectos y fichajes',
    admin: 'Acceso completo a todas las funcionalidades',
}

export function AddEmployeeDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            role: 'ingeniero',
        }
    })

    const selectedRole = watch('role')

    const onSubmit = async (data: FormData) => {
        setLoading(true)

        const result = await createEmployee(data)

        if (result.success) {
            toast.success(`Empleado ${data.full_name} creado exitosamente`)
            setOpen(false)
            reset()
            router.refresh()
        } else {
            toast.error(result.error || 'Error creando empleado')
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Empleado
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>Agregar Nuevo Empleado</DialogTitle>
                    <DialogDescription>
                        Crea una cuenta para un nuevo miembro del equipo
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nombre Completo *</Label>
                        <Input
                            id="full_name"
                            {...register('full_name')}
                            placeholder="Juan Pérez García"
                            autoComplete="name"
                        />
                        {errors.full_name && (
                            <p className="text-sm text-destructive">{errors.full_name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email')}
                            placeholder="juan@solistech.com"
                            autoComplete="email"
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Se usará como nombre de usuario para iniciar sesión
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña Inicial *</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password')}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            El empleado podrá cambiarla después de su primer inicio de sesión
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rol *</Label>
                        <Select
                            value={selectedRole}
                            onValueChange={(value) => setValue('role', value as FormData['role'])}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ingeniero">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{roleLabels.ingeniero}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {roleDescriptions.ingeniero}
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="comercial">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{roleLabels.comercial}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {roleDescriptions.comercial}
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="captador_visitas">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{roleLabels.captador_visitas}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {roleDescriptions.captador_visitas}
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="user">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{roleLabels.user}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {roleDescriptions.user}
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="admin">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">{roleLabels.admin}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {roleDescriptions.admin}
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && (
                            <p className="text-sm text-destructive">{errors.role.message}</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setOpen(false)
                                reset()
                            }}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Crear Empleado
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
