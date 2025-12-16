'use server'

import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding() {
    const session = await auth()

    if (!session?.user?.id) return { error: 'Unauthorized' }

    // STUB: has_completed_onboarding field not in current schema
    // TODO: Add field to Prisma schema and implement properly
    console.log(`[ONBOARDING STUB] User ${session.user.id} completed onboarding`)

    revalidatePath('/')
    return { success: true }
}

