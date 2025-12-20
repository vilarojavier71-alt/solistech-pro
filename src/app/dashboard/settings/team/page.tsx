import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getOrganizationMembers, getOrganizationRoles } from '@/lib/actions/team-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AdvancedMemberModal } from '@/components/team/advanced-member-modal'
import { Shield, UserPlus, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { InitializeRolesButton } from '@/components/team/init-roles-button'

export default async function TeamSettingsPage() {
    const session = await auth()

    if (!session?.user) return null

    // Get Org ID
    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })
    const orgId = profile?.organization_id

    if (!orgId) return <div>Error: Sin organización</div>

    // Parallel fetch
    const [members, roles] = await Promise.all([
        getOrganizationMembers(orgId),
        getOrganizationRoles(orgId)
    ])

    // Check if roles need init
    if (!roles || roles.length === 0) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h1>
                <InitializeRolesButton organizationId={orgId} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h1>
                    <p className="text-muted-foreground mt-1">
                        Administra roles y permisos granulares de tu organización.
                    </p>
                </div>
                <AdvancedMemberModal roles={roles || []} organizationId={orgId} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Miembros del Equipo</CardTitle>
                    <CardDescription>
                        Usuarios activos con acceso a la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {members.map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="hidden md:flex flex-col items-end text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {member.lastActive
                                                ? formatDistanceToNow(new Date(member.lastActive), { addSuffix: true, locale: es })
                                                : 'Nunca'}
                                        </div>
                                    </div>

                                    <Badge variant={member.roleName === 'Admin' ? 'default' : 'secondary'} className="w-24 justify-center">
                                        {member.roleName || 'Sin Rol'}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
