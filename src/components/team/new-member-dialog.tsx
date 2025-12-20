'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTeamMember } from '@/lib/actions/team-management'
import { toast } from 'sonner'
import { UserPlus, Loader2, Key } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface Role {
    id: string
    name: string
    description: string
}

export function TeamMemberDialog({ roles, organizationId }: { roles: Role[], organizationId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [createdCreds, setCreatedCreds] = useState<{ email: string, pass: string } | null>(null)

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setCreatedCreds(null)

        const formData = new FormData(e.currentTarget)
        formData.append('organizationId', organizationId)

        try {
            const result = await createTeamMember(null, formData)

            if (result.error) {
                toast.error(result.error)
            } else if (result.success && result.data) {
                toast.success('Miembro añadido exitosamente')
                setCreatedCreds({
                    email: result.data.email,
                    pass: result.data.password || ''
                })
                // Don't close immediately so they can see credentials
            }
        } catch (err) {
            toast.error('Error inesperado')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) setCreatedCreds(null) // Reset on close
            setOpen(val)
        }}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Añadir Miembro
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Miembro del Equipo</DialogTitle>
                    <DialogDescription>
                        Da de alta a un empleado y asígnale un rol específico.
                    </DialogDescription>
                </DialogHeader>

                {createdCreds ? (
                    <div className="space-y-4 py-4">
                        <Alert className="bg-green-50 border-green-200 text-green-800">
                            <Key className="h-4 w-4" />
                            <AlertTitle>¡Usuario Creado!</AlertTitle>
                            <AlertDescription>
                                Copia estas credenciales temporales. No se volverán a mostrar.
                            </AlertDescription>
                        </Alert>

                        <div className="bg-slate-100 p-4 rounded-md space-y-2 font-mono text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Email:</span>
                                <span className="select-all">{createdCreds.email}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Password:</span>
                                <span className="select-all font-bold">{createdCreds.pass}</span>
                            </div>
                        </div>

                        <Button onClick={() => setOpen(false)} className="w-full">
                            Entendido, cerrar
                        </Button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Nombre Completo</Label>
                            <Input id="fullName" name="fullName" placeholder="Ej. Ana García" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Correo Corporativo</Label>
                            <Input id="email" name="email" type="email" placeholder="ana@solistech.pro" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="roleId">Rol / Cargo</Label>
                            <Select name="roleId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un rol..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.filter(r => r.id && r.id !== "").map(role => (
                                        <SelectItem key={role.id} value={role.id}>
                                            <div className="flex flex-col items-start">
                                                <span className="font-medium">{role.name}</span>
                                                <span className="text-xs text-muted-foreground">{role.description}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Crear Cuenta
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
