'use server'

import { generateAuthUrl, getOAuth2Client, storeTokens } from '@/lib/google/auth'
import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export async function getGmailAuthUrl() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

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

        oauth2Client.setCredentials(tokens)
        const url = 'https://www.googleapis.com/oauth2/v2/userinfo'
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
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

    try {
        await prisma.gmail_tokens.deleteMany({
            where: { user_id: user.id }
        })
        revalidatePath('/dashboard/mail')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getGmailStatus() {
    console.log('[MAIL DEBUG] getGmailStatus called')
    const user = await getCurrentUserWithRole()
    if (!user) {
        console.log('[MAIL DEBUG] No user found in session')
        return { isConnected: false }
    }
    console.log('[MAIL DEBUG] User found:', user.id)

    try {
        console.log('[MAIL DEBUG] Querying gmail_tokens for user:', user.id)
        const token = await prisma.gmail_tokens.findUnique({
            where: { user_id: user.id },
            select: { email: true, is_active: true, updated_at: true }
        })
        console.log('[MAIL DEBUG] Token found?', !!token)

        return {
            isConnected: !!token,
            email: token?.email,
            lastSynced: token?.updated_at
        }
    } catch (e: any) {
        console.error('[MAIL DEBUG] getGmailStatus error:', e)
        return { isConnected: false }
    }
}

export async function getGmailThreads() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { listThreads } = await import('@/lib/google/gmail')
    return await listThreads(user.id)
}

export async function getThreadDetails(threadId: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { getThread, extractEmailBody } = await import('@/lib/google/gmail')
    const { thread, error } = await getThread(user.id, threadId)

    if (error || !thread) return { error: error || 'Thread not found' }

    // Decode body for the last message in thread (usually the one we want to read first)
    // Or return all. For now, let's attach query to the messages.
    const messages = thread.messages?.map((msg: any) => ({
        ...msg,
        bodyDecoded: extractEmailBody(msg.payload)
    }))

    return { ...thread, messages }
}

export async function searchGmailMessages(query: string, maxResults = 20) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { searchMessages } = await import('@/lib/google/gmail')
    return await searchMessages(user.id, query, maxResults)
}

export async function getEmailSummary() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { getEmailStats } = await import('@/lib/google/gmail')
    return await getEmailStats(user.id)
}

export async function getUnreadEmailCount() {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated', count: 0 }

    const { getUnreadCount } = await import('@/lib/google/gmail')
    return await getUnreadCount(user.id)
}

export async function searchProjectEmails(searchTerm: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'Not authenticated' }

    const { searchRelatedEmails } = await import('@/lib/google/gmail')
    return await searchRelatedEmails(user.id, searchTerm, 5)
}
