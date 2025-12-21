'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { HELP_TOPICS } from '@/components/help/help-data'

export interface SearchResult {
    id: string
    title: string
    description: string
    category: string
    cta: { text: string; link: string }
}

/**
 * INTELLIGENT SEARCH (Local in HELP_TOPICS)
 * Searches across all help topics for matching terms
 */
export async function searchHelpArticles(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 3) return []

    const searchTerm = query.toLowerCase()

    const results = HELP_TOPICS.filter(topic => {
        const matchesTitle = topic.title.toLowerCase().includes(searchTerm)
        const matchesDescription = topic.description.toLowerCase().includes(searchTerm)
        const matchesSteps = topic.steps.some(s => s.toLowerCase().includes(searchTerm))
        const matchesTips = topic.tips.some(t => t.toLowerCase().includes(searchTerm))

        return matchesTitle || matchesDescription || matchesSteps || matchesTips
    }).map(topic => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        category: topic.category,
        cta: topic.cta
    }))

    return results.slice(0, 5)
}

/**
 * GET ARTICLE BY ID (from HELP_TOPICS)
 */
export async function getArticle(id: string) {
    return HELP_TOPICS.find(t => t.id === id) || null
}

/**
 * TICKET CREATION (Prisma - Production Ready)
 * Creates a support ticket linked to the user's organization
 */
export async function createTicket(prevState: any, formData: FormData) {
    const user = await getCurrentUserWithRole()

    if (!user) return { error: 'Debes iniciar sesión' }

    if (!user.organizationId) return { error: 'Sin organización asignada' }

    const subject = formData.get('subject') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string || 'general'
    const sourcePage = formData.get('source_page') as string || null

    // Validation
    if (!subject || subject.length < 5) {
        return { error: 'El asunto es muy corto (mínimo 5 caracteres)' }
    }

    if (!description || description.length < 20) {
        return { error: 'Describe mejor el problema (mínimo 20 caracteres)' }
    }

    try {
        await prisma.support_tickets.create({
            data: {
                organization_id: user.organizationId,
                user_id: user.id,
                subject: subject,
                description: description,
                category: category,
                status: 'open',
                priority: 'normal',
                source_page: sourcePage
            }
        })

        revalidatePath('/dashboard/help')

        return { success: true, message: 'Ticket enviado correctamente' }

    } catch (error) {
        console.error('[HELP] Error creating ticket:', error)
        return { error: 'Error al enviar el ticket. Inténtalo de nuevo.' }
    }
}

/**
 * GET USER TICKETS
 * Returns tickets created by the user's organization
 */
export async function getUserTickets() {
    const user = await getCurrentUserWithRole()

    if (!user?.organizationId) return []

    return prisma.support_tickets.findMany({
        where: { organization_id: user.organizationId },
        orderBy: { created_at: 'desc' },
        take: 10
    })
}

/**
 * TICKET CATEGORIES
 * Available categories for support tickets
 */
export const TICKET_CATEGORIES = [
    { slug: 'facturacion', name: 'Facturación y Pagos' },
    { slug: 'tecnico', name: 'Problemas Técnicos' },
    { slug: 'solar', name: 'Calculadora Solar' },
    { slug: 'crm', name: 'CRM y Clientes' },
    { slug: 'calendario', name: 'Agenda y Citas' },
    { slug: 'general', name: 'Consulta General' }
]
