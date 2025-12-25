import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { UserRoleManager } from "@/components/dashboard/admin/user-role-manager"
import { getOrganizationUsers } from "@/lib/actions/user-actions"

export default async function AdminUsersPage() {
    const session = await auth()

    if (!session?.user) redirect("/auth/login")

    // Zero-Flag Policy: Check permissions instead of role
    const { getUserPermissions } = await import('@/lib/actions/permissions')
    const permissions = await getUserPermissions()
    
    if (!permissions?.manage_users) {
        redirect("/dashboard")
    }

    const users = await getOrganizationUsers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
                <p className="text-muted-foreground">Administra los roles y accesos de tu equipo.</p>
            </div>

            {/* Zero-Flag Policy: Pass permissions instead of role */}
            <UserRoleManager users={users} currentUserRole={null} />
        </div>
    )
}


