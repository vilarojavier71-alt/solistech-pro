import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TeamTable } from '@/components/dashboard/team-table'
import { Info, Users } from 'lucide-react'

export default async function TeamPage() {
    const session = await auth()

    if (!session?.user) return null

    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, role: true }
    })

    if (!profile?.organization_id) return null

    // Get all organization members
    const teamMembers = await prisma.user.findMany({
        where: { organization_id: profile.organization_id },
        orderBy: { created_at: 'asc' }
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Users className="h-8 w-8 text-sky-600" />
                    Equipo
                </h1>
                <p className="text-muted-foreground">
                    Gestiona los miembros de tu organización y asigna permisos.
                </p>
            </div>

            {profile?.role !== 'admin' && profile?.role !== 'owner' && (
                <div className="flex gap-3 items-start p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                    <Info className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
                    <div>
                        <h5 className="font-medium mb-1">Modo Lectura</h5>
                        <p className="text-sm text-amber-700">
                            Solo los administradores pueden cambiar roles e invitar usuarios.
                        </p>
                    </div>
                </div>
            )}

            <TeamTable
                users={teamMembers || []}
                currentUserRole={profile?.role || 'user'}
            />
        </div>
    )
}


