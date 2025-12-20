'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { usePermission } from "@/hooks/use-permission"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Shield, User, Wrench, Briefcase, UserCheck } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface User {
    id: string
    email: string
    full_name: string
    role: 'owner' | 'admin' | 'user' | 'ingeniero' | 'comercial' | 'captador_visitas'
    created_at: string
}

interface UsersTableProps {
    users: User[]
}

const roleIcons: Record<string, any> = {
    owner: Shield,
    admin: Shield,
    comercial: Briefcase,
    ingeniero: Wrench,
    captador_visitas: UserCheck,
    user: User
}

const roleColors: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700 border-amber-200',
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    comercial: 'bg-blue-100 text-blue-700 border-blue-200',
    ingeniero: 'bg-orange-100 text-orange-700 border-orange-200',
    captador_visitas: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    user: 'bg-gray-100 text-gray-700 border-gray-200'
}

const roleLabels: Record<string, string> = {
    owner: 'Propietario',
    admin: 'Administrador',
    comercial: 'Comercial',
    ingeniero: 'Ingeniero',
    captador_visitas: 'Captador de Visitas',
    user: 'Usuario'
}

import { useState } from 'react'
import { EditUserDialog } from './edit-user-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'
import { DeactivateUserDialog } from './deactivate-user-dialog'

export function UsersTable({ users }: UsersTableProps) {
    const { hasPermission } = usePermission()
    const canManage = hasPermission('users:manage')

    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [resettingUser, setResettingUser] = useState<User | null>(null)
    const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null)

    return (
        <div className="border rounded-lg bg-white overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Fecha Alta</TableHead>
                        {canManage && <TableHead className="text-right">Acciones</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((user) => {
                        const Icon = roleIcons[user.role] || User
                        return (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-slate-900">{user.full_name || 'Sin nombre'}</span>
                                        <span className="text-sm text-slate-500">{user.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className={`${roleColors[user.role] || 'bg-gray-100'} flex w-fit items-center gap-1`}>
                                        <Icon className="h-3 w-3" />
                                        <span>{roleLabels[user.role] || user.role}</span>
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-slate-500">
                                    {user.created_at ? format(new Date(user.created_at), 'dd MMM yyyy', { locale: es }) : '-'}
                                </TableCell>
                                {canManage && (
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                    Editar detalles
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setResettingUser(user)}>
                                                    Cambiar contraseña
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeactivatingUser(user)}
                                                >
                                                    Desactivar cuenta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                )}
                            </TableRow>
                        )
                    })}
                    {users.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={canManage ? 4 : 3} className="h-24 text-center text-muted-foreground">
                                No hay usuarios registrados.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Dialogs */}
            {editingUser && (
                <EditUserDialog
                    user={editingUser}
                    open={!!editingUser}
                    onOpenChange={(open) => !open && setEditingUser(null)}
                />
            )}
            {resettingUser && (
                <ResetPasswordDialog
                    userId={resettingUser.id}
                    open={!!resettingUser}
                    onOpenChange={(open) => !open && setResettingUser(null)}
                />
            )}
            {deactivatingUser && (
                <DeactivateUserDialog
                    userId={deactivatingUser.id}
                    userName={deactivatingUser.full_name}
                    open={!!deactivatingUser}
                    onOpenChange={(open) => !open && setDeactivatingUser(null)}
                />
            )}
        </div>
    )
}
