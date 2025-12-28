
import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { logAudit, AuditAction, AuditSeverity } from "@/lib/security/audit"
import { getCurrentUserWithRole } from "@/lib/session"

export type SerializedCrmAccount = {
    id: string
    name: string
    status: string
    type: string
    email: string | null
    phone: string | null
    updated_at: Date
    assigned_to: string | null
}


export async function getCrmPipeline() {
    const user = await getCurrentUserWithRole()
    if (!user?.organizationId) return []

    // 1. Fetch all accounts with relevant statuses
    const accounts = await prisma.crmAccount.findMany({
        where: {
            organization_id: user.organizationId
        },
        orderBy: { updated_at: 'desc' },
        take: 100 // Limit for performance
    })

    return accounts
}

export async function updateAccountStatus(accountId: string, newStatus: string) {
    const user = await getCurrentUserWithRole()
    if (!user?.organizationId) throw new Error("Unauthorized")

    const oldAccount = await prisma.crmAccount.findUnique({
        where: { id: accountId }
    })

    if (!oldAccount) throw new Error("Account not found")

    const updated = await prisma.crmAccount.update({
        where: { id: accountId },
        data: { status: newStatus }
    })

    // Log Audit
    await logAudit({
        action: AuditAction.UPDATE,
        resource: 'CrmAccount',
        resourceId: accountId,
        userId: user.id,
        organizationId: oldAccount.organization_id, // assuming accessible
        details: { field: 'status', from: oldAccount.status, to: newStatus },
        severity: AuditSeverity.INFO
    })

    revalidatePath('/dashboard/crm')
    return updated
}

export async function createQuickLead(formData: FormData) {
    const user = await getCurrentUserWithRole()
    if (!user?.organizationId) throw new Error("Unauthorized")

    const name = formData.get('name') as string
    const email = formData.get('email') as string

    if (!name) throw new Error("Name required")

    const account = await prisma.crmAccount.create({
        data: {
            organization_id: user.organizationId,
            name,
            email,
            type: 'lead',
            status: 'new'
        }
    })

    await logAudit({
        action: AuditAction.CREATE,
        resource: 'CrmAccount',
        resourceId: account.id,
        userId: user.id,
        organizationId: user.organizationId,
        details: { name, email },
        severity: AuditSeverity.INFO
    })

    revalidatePath('/dashboard/crm')
    return account
}
