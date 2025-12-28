'use client'

import { useState } from 'react'
import { usePermissionsSafe } from '@/hooks/use-permissions-safe'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from '@/types/portal' // Asegurar que User type tiene role
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/lib/actions/user-actions'

interface TeamTableProps {
    users: any[] // Usar any temporalmente si User no coincide 100%, idealmente ajustar User type
    currentUserRole: string
}

export function TeamTable({ users, currentUserRole }: TeamTableProps) {
    // const supabase = createClient()
    const router = useRouter()
    const [updating, setUpdating] = useState<string | null>(null)

    // ✅ Permission Masking: Usar permisos booleanos en lugar de roles
    const { permissions } = usePermissionsSafe()
    const canEdit = permissions.manage_users || permissions.manage_team

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUpdating(userId)
        try {
            const result = await updateUserRole(userId, newRole)

            if (!result.success) throw new Error(result.message)

            toast.success('Rol actualizado correctamente')
            router.refresh()
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || 'Error al actualizar rol')
        } finally {
            setUpdating(null)
        }
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner': return <Badge className="bg-purple-600">Owner</Badge>
            case 'admin': return <Badge className="bg-indigo-600">Admin</Badge>
            case 'commercial': return <Badge className="bg-sky-600">Comercial</Badge>
            case 'engineer': return <Badge className="bg-orange-600">Ingeniero</Badge>
            case 'installer': return <Badge className="bg-emerald-600">Instalador</Badge>
            case 'canvasser': return <Badge className="bg-pink-600">Captador (Pica)</Badge>
            default: return <Badge variant="secondary">Usuario</Badge>
        }
    }

    return (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol Actual</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.full_name || 'Sin nombre'}</span>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{getRoleBadge(user.role)}</TableCell>
                            <TableCell className="text-right">
                                {canEdit ? (
                                    <Select
                                        defaultValue={user.role}
                                        onValueChange={(val) => handleRoleChange(user.id, val)}
                                        disabled={updating === user.id || user.role === 'owner'}
                                    >
                                        <SelectTrigger className="w-[140px] ml-auto">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="commercial">Comercial</SelectItem>
                                            <SelectItem value="canvasser">Captador (Pica)</SelectItem>
                                            <SelectItem value="engineer">Ingeniero</SelectItem>
                                            <SelectItem value="installer">Instalador</SelectItem>
                                            <SelectItem value="user">Usuario Base</SelectItem>
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="text-sm text-muted-foreground">Solo lectura</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
