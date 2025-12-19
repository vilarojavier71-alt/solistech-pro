
import { getGmailClient } from './auth'

export async function listEmails(userId: string, maxResults = 20, pageToken?: string) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client' }

    try {
        const res = await client.users.messages.list({
            userId: 'me',
            maxResults,
            pageToken,
            q: 'in:inbox' // Default to inbox
        })

        const messages = res.data.messages || []
        const nextPageToken = res.data.nextPageToken

        // Hydrate simplified headers (Subject, From, Date)
        // Note: Listing only gives IDs. We need batch get or individual get.
        // For performance, we might want to do a batch. googleapis doesn't do batch easily.
        // We will fetch individual snippets for now or rely on threads.list.

        // Better approach: threads.list (includes snippet)

        return {
            messages,
            nextPageToken,
            resultSizeEstimate: res.data.resultSizeEstimate
        }

    } catch (e: any) {
        console.error('Gmail List Error:', e)
        return { error: e.message }
    }
}

export async function listThreads(userId: string, maxResults = 20, pageToken?: string) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client' }

    try {
        const res = await client.users.threads.list({
            userId: 'me',
            maxResults,
            pageToken,
            q: 'in:inbox'
        })

        return {
            threads: res.data.threads || [],
            nextPageToken: res.data.nextPageToken
        }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function getThread(userId: string, threadId: string) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client' }

    try {
        const res = await client.users.threads.get({
            userId: 'me',
            id: threadId,
            format: 'full' // or metadata
        })
        return { thread: res.data }
    } catch (e: any) {
        return { error: e.message }
    }
}

export async function getMessage(userId: string, messageId: string) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client' }

    try {
        const res = await client.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full'
        })
        return { message: res.data }
    } catch (e: any) {
        return { error: e.message }
    }
}

// ============================================================================
// FUNCIONES AVANZADAS - Vista Avanzada Gmail
// ============================================================================

/**
 * Busca correos con un query personalizado de Gmail
 */
export async function searchMessages(userId: string, query: string, maxResults = 20) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client' }

    try {
        const res = await client.users.messages.list({
            userId: 'me',
            maxResults,
            q: query
        })

        const messages = res.data.messages || []

        // Obtener detalles de cada mensaje (headers básicos)
        const enrichedMessages = await Promise.all(
            messages.slice(0, 10).map(async (msg: { id?: string | null; threadId?: string | null }) => {
                try {
                    const detail = await client.users.messages.get({
                        userId: 'me',
                        id: msg.id!,
                        format: 'metadata',
                        metadataHeaders: ['Subject', 'From', 'Date']
                    })
                    const headers = detail.data.payload?.headers || []
                    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value
                    return {
                        id: msg.id,
                        threadId: msg.threadId,
                        snippet: detail.data.snippet,
                        subject: getHeader('Subject') || '(Sin asunto)',
                        from: getHeader('From') || 'Desconocido',
                        date: getHeader('Date'),
                        labelIds: detail.data.labelIds
                    }
                } catch {
                    return { id: msg.id, threadId: msg.threadId }
                }
            })
        )

        return {
            messages: enrichedMessages,
            totalEstimate: res.data.resultSizeEstimate
        }
    } catch (e: any) {
        console.error('Gmail Search Error:', e)
        return { error: e.message }
    }
}

/**
 * Obtiene el conteo de correos no leídos
 */
export async function getUnreadCount(userId: string) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client', count: 0 }

    try {
        const res = await client.users.messages.list({
            userId: 'me',
            q: 'is:unread in:inbox',
            maxResults: 1
        })
        return { count: res.data.resultSizeEstimate || 0 }
    } catch (e: any) {
        return { error: e.message, count: 0 }
    }
}

/**
 * Obtiene estadísticas generales del correo
 */
export async function getEmailStats(userId: string) {
    const { client, error } = await getGmailClient(userId)
    if (error || !client) return { error: error || 'Failed to initialize Gmail client' }

    try {
        // Obtener varios conteos en paralelo
        const [unreadRes, importantRes, todayRes] = await Promise.all([
            client.users.messages.list({ userId: 'me', q: 'is:unread in:inbox', maxResults: 1 }),
            client.users.messages.list({ userId: 'me', q: 'is:important is:unread', maxResults: 1 }),
            client.users.messages.list({ userId: 'me', q: `after:${new Date().toISOString().split('T')[0]}`, maxResults: 1 })
        ])

        return {
            unread: unreadRes.data.resultSizeEstimate || 0,
            important: importantRes.data.resultSizeEstimate || 0,
            today: todayRes.data.resultSizeEstimate || 0
        }
    } catch (e: any) {
        return { error: e.message }
    }
}

/**
 * Obtiene correos relacionados con un término de búsqueda (ej: nombre de proyecto/cliente)
 */
export async function searchRelatedEmails(userId: string, searchTerm: string, maxResults = 5) {
    return searchMessages(userId, searchTerm, maxResults)
}

// ============================================================================
// UTILITIES
// ============================================================================

export function extractEmailBody(payload: any): string {
    if (!payload) return ''

    let body = ''

    // 1. If body has data directly
    if (payload.body && payload.body.data) {
        body = Buffer.from(payload.body.data, 'base64').toString('utf-8')
    }
    // 2. If it has parts (multipart/alternative or mixed)
    else if (payload.parts) {
        // Prefer HTML part
        const htmlPart = payload.parts.find((p: any) => p.mimeType === 'text/html')
        const textPart = payload.parts.find((p: any) => p.mimeType === 'text/plain')

        if (htmlPart && htmlPart.body && htmlPart.body.data) {
            body = Buffer.from(htmlPart.body.data, 'base64').toString('utf-8')
        } else if (textPart && textPart.body && textPart.body.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8')
        } else {
            // Recursive for nested parts
            for (const part of payload.parts) {
                const res = extractEmailBody(part)
                if (res) return res
            }
        }
    }

    return body
}
