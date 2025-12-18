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

export async function checkOnboardingStatus() {
    const session = await auth()

    if (!session?.user?.id) {
        return { hasCompletedOnboarding: true } // No user = skip tour
    }

    // STUB: For now, return true to skip the tour
    // TODO: Implement proper check against users table when field exists
    return { hasCompletedOnboarding: true }
}
