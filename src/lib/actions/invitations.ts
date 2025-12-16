'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { randomBytes } from 'crypto'

export async function generateClientInvitation(organizationId: string) {
    // 1. Auth Check (Admin/Owner only ideally, but 'employee' allowed for now based on context)
    const user = await getCurrentUserWithRole()

    if (!user || !user.id || !user.organizationId) {
        return { error: 'No autorizado' }
    }

    // Verify Org Match
    if (user.organizationId !== organizationId) {
        return { error: 'No tienes permiso para generar invitaciones en esta organización' }
    }

    try {
        // 2. Generate Token
        // 6 chars hex = 3 bytes
        const token = randomBytes(3).toString('hex').toUpperCase()

        // 3. Create Invitation
        const invitation = await prisma.invitations.create({
            data: {
                organization_id: organizationId,
                token: token,
                role: 'client',
                status: 'pending',
                created_by: user.id,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days expiration
            }
        })

        return { success: true, token: invitation.token }

    } catch (error: any) {
        console.error('[GenerateInvitation]', error)
        return { error: 'Error generando invitación' }
    }
}
