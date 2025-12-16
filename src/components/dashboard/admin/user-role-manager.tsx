'use client'

import { useState } from "react"
import { toast } from "sonner"
import { Shield, ShieldAlert, BadgeCheck, Users, Search, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { type RoleUpdateResult } from "@/lib/actions/user-actions"
import { updateUserRole } from "@/lib/actions/userActions" // Using strict implementation
import { seedTestUsers } from "@/lib/actions/user-actions"

type User = {
    id: string
    email: string
    full_name: string
    role: string
    avatar_url?: string
    created_at: string
}

type Props = {
    users: User[]
    currentUserRole: string
}

export function UserRoleManager({ users: initialUsers, currentUserRole }: Props) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [filter, setFilter] = useState("")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [seeding, setSeeding] = useState(false)

    const handleSeed = async () => {
        setSeeding(true)
        try {
            const result = await seedTestUsers()
            if (result.success) {
                toast.success(result.message)
                window.location.reload() // Reload to fetch new users
            } else {
                toast.error("Error", { description: result.message })
            }
        } catch {
            toast.error("Error de conexión")
        } finally {
            setSeeding(false)
        }
    }

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(filter.toLowerCase()) ||
        u.email.toLowerCase().includes(filter.toLowerCase())
    )

    const handleRoleChange = async (userId: string, newRole: string) => {
        // Optimistic update
        const oldUsers = [...users]
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        setUpdatingId(userId)

        try {
            const result = await updateUserRole(userId, newRole)

            if (result.success) {
                toast.success("Rol actualizado correctamente")
            } else {
                toast.error("Error al actualizar rol", { description: result.message })
                setUsers(oldUsers) // Revert
            }
        } catch (error) {
            toast.error("Error de conexión")
            setUsers(oldUsers) // Revert
        } finally {
            setUpdatingId(null)
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'owner': return 'Propietario'
            case 'admin': return 'Administrador'
            case 'commercial': return 'Comercial'
            case 'technician': return 'TÃ©cnico'
            case 'canvasser': return 'Captador'
            case 'installer': return 'Instalador'
            case 'engineer': return 'Ingeniero'
            case 'viewer': return 'Visualizador'
            case 'user': return 'Usuario'
            default: return role
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'owner': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'admin': return 'bg-red-100 text-red-800 border-red-200'
            case 'commercial': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'engineer': return 'bg-orange-100 text-orange-800 border-orange-200'
            default: return 'bg-slate-100 text-slate-800 border-slate-200'
        }
    }

    if (currentUserRole !== 'admin' && currentUserRole !== 'owner') {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-red-50 text-red-800 rounded-lg border border-red-200">
                <ShieldAlert className="h-10 w-10 mb-2" />
                <h3 className="font-bold text-lg">Acceso Restringido</h3>
                <p>Solo los administradores pueden gestionar roles.</p>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-600" />
                            Gestión de Equipo
                        </CardTitle>
                        <CardDescription>
                            Administra los roles y permisos de los miembros de tu organización.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
                            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                            Generar Datos Test
                        </Button>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuario..."
                                className="pl-8"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
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
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No se encontraron usuarios.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.avatar_url} />
                                                    <AvatarFallback>{user.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                {user.full_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={getRoleColor(user.role)}>
                                                {getRoleLabel(user.role)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {updatingId === user.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                                <Select
                                                    value={user.role}
                                                    onValueChange={(val) => handleRoleChange(user.id, val)}
                                                    disabled={updatingId === user.id || (user.role === 'owner' && currentUserRole !== 'owner')}
                                                >
                                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Administrador</SelectItem>
                                                        <SelectItem value="commercial">Comercial</SelectItem>
                                                        <SelectItem value="engineer">Ingeniero</SelectItem>
                                                        <SelectItem value="technician">TÃ©cnico</SelectItem>
                                                        <SelectItem value="canvasser">Captador</SelectItem>
                                                        <SelectItem value="installer">Instalador</SelectItem>
                                                        <SelectItem value="viewer">Solo Lectura</SelectItem>
                                                        <SelectItem value="user">Usuario Básico</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}
