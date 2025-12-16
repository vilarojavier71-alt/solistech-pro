'use client'

import { useState } from 'react'
import { assignClientToProject } from '@/lib/actions/project-assignment'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { UserPlus, Loader2 } from 'lucide-react'

interface AssignClientFormProps {
    projectId: string
    currentPortalUser?: {
        email: string
        full_name: string | null
    } | null
}

export function AssignClientForm({ projectId, currentPortalUser }: AssignClientFormProps) {
    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleAssign = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return

        setIsLoading(true)
        try {
            const result = await assignClientToProject(projectId, email)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Cliente asignado correctamente')
                setEmail('')
            }
        } catch (error) {
            toast.error('Error desconocido')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Acceso Portal Cliente
                </CardTitle>
                <CardDescription>
                    Otorga acceso a este proyecto a un usuario registrado.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {currentPortalUser ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-md p-3 mb-4">
                        <p className="text-sm font-medium text-emerald-600">Acceso Activo</p>
                        <p className="text-sm text-foreground">{currentPortalUser.full_name || 'Usuario'} ({currentPortalUser.email})</p>
                        {/* Future: Add Remove Button */}
                    </div>
                ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3 mb-4">
                        <p className="text-sm font-medium text-amber-600">Sin Asignar</p>
                        <p className="text-xs text-muted-foreground">Este proyecto no es visible para ningún cliente.</p>
                    </div>
                )}

                <form onSubmit={handleAssign} className="flex gap-2 items-end">
                    <div className="grid gap-1 flex-1">
                        <Label htmlFor="client-email" className="text-xs">Email del Usuario Cliente</Label>
                        <Input
                            id="client-email"
                            type="email"
                            placeholder="cliente@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                    <Button type="submit" disabled={isLoading || !email}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Asignar'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
