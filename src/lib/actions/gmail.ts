'use server'

import { generateAuthUrl, getOAuth2Client, storeTokens } from '@/lib/google/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { decrypt } from '@/lib/google/encryption'

export async function getGmailAuthUrl() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    // We encode userId in state to verify on callback if needed (optional security)
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')
    const url = generateAuthUrl(state)

    return { url }
}

export async function connectGmailAccount(code: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const oauth2Client = getOAuth2Client()

    try {
        const { tokens } = await oauth2Client.getToken(code)

        // Get user profile email
        oauth2Client.setCredentials(tokens)
        // We can't use gmail api here easily without circular dep if we use getGmailClient
        // So we request userinfo manually or just trust the scope
        // Let's optimize: We assume the user authorizes the correct email.
        // Better: Fetch user email from Google
        const url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        const res = await fetch(url, {
            headers: {
                Authorization: `Bearer ${tokens.access_token}`
            }
        })
        const profile = await res.json()

        if (!profile.email) throw new Error('Could not retrieve email from Google')

        await storeTokens(user.id, tokens, profile.email)

        revalidatePath('/dashboard/mail')
        return { success: true, email: profile.email }

    } catch (error: any) {
        console.error('Gmail Connect Error:', error)
        return { error: `Connection failed: ${error.message}` }
    }
}

export async function disconnectGmail() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const supabase = createAdminClient()

    const { error } = await supabase
        .from('gmail_tokens')
        .delete()
        .eq('user_id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/mail')
    return { success: true }
}

export async function getGmailStatus() {
    const user = await getCurrentUserWithRole()
    if (!user) return { isConnected: false }

    const supabase = createAdminClient()

    const { data } = await supabase
        .from('gmail_tokens')
        .select('email, is_active, updated_at')
        .eq('user_id', user.id)
        .single()

    return {
        isConnected: !!data,
        email: data?.email,
        lastSynced: data?.updated_at
    }
}

export async function getGmailThreads() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    // Dynamic import to avoid circular dependency issues if any
    const { listThreads } = await import('@/lib/google/gmail')

    return await listThreads(user.id)
}

// ============================================================================
// FUNCIONES AVANZADAS - Vista Avanzada Gmail
// ============================================================================

/**
 * Buscar correos con un query personalizado
 */
export async function searchGmailMessages(query: string, maxResults = 20) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { searchMessages } = await import('@/lib/google/gmail')
    return await searchMessages(user.id, query, maxResults)
}

/**
 * Obtener resumen de correos (estadísticas)
 */
export async function getEmailSummary() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { getEmailStats } = await import('@/lib/google/gmail')
    return await getEmailStats(user.id)
}

/**
 * Obtener correos no leídos
 */
export async function getUnreadEmailCount() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated', count: 0 }

    const { getUnreadCount } = await import('@/lib/google/gmail')
    return await getUnreadCount(user.id)
}

/**
 * Buscar correos relacionados con un proyecto o cliente
 */
export async function searchProjectEmails(searchTerm: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { searchRelatedEmails } = await import('@/lib/google/gmail')
    return await searchRelatedEmails(user.id, searchTerm, 5)
}
