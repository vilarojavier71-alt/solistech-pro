'use server'

import { getCurrentUserWithRole } from '@/lib/session'

export async function getUserRoleAction() {
    const user = await getCurrentUserWithRole()
    if (!user) return { role: null, userId: null }
    return { role: user.role, userId: user.id }
}

export async function getCurrentUserAction() {
    const user = await getCurrentUserWithRole()
    if (!user) return null
    return user
}
