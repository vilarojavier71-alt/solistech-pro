import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { UserRoleManager } from "@/components/dashboard/admin/user-role-manager"
import { getOrganizationUsers } from "@/lib/actions/user-actions"

export default async function AdminUsersPage() {
    const session = await auth()

    if (!session?.user) redirect("/auth/login")

    // Get current user role
    const profile = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    })

    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
        redirect("/dashboard")
    }

    const users = await getOrganizationUsers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">Administra los roles y accesos de tu equipo.</p>
            </div>

            <UserRoleManager users={users} currentUserRole={profile.role} />
        </div>
    )
}


