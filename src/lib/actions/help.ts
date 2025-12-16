'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'

export interface SearchResult {
    id: string
    title: string
    subtitle: string
    slug: string
    category: {
        name: string
        slug: string
    }
    similarity?: number
}

/**
 * INTELLIGENT SEARCH (Hybrid: Text + Vector later)
 */
export async function searchHelpArticles(query: string): Promise<SearchResult[]> {
    const supabase = await createClient()

    if (!query || query.trim().length === 0) return []

    // 1. Full Text Search
    // Using simple ILIKE for now, but configured for FTS if using `to_tsvector` in raw query
    // Let's use Supabase 'textSearch' feature which wraps FTS

    // NOTE: For 'smarter' search we would use embeddings. 
    // Here we simulate prioritized search: Title > Content

    const { data, error } = await supabase
        .from('help_articles')
        .select(`
            id,
            title,
            subtitle,
            slug,
            category:help_categories(name, slug)
        `)
        .eq('status', 'published')
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(5)

    if (error) {
        console.error("Search Error:", error)
        return []
    }

    return (data || []) as SearchResult[]
}

/**
 * FETCH ARTICLE BY SLUG
 */
export async function getArticle(slug: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('help_articles')
        .select(`
            *,
            category:help_categories(*)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

    if (error) return null
    return data
}

/**
 * TICKET CREATION (Last Resort)
 */
export async function createTicket(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Organization Context?
    // We assume user is logged in
    if (!user) return { error: 'Debes iniciar sesión' }

    // Fetch user or organization? 
    // We need organization_id. Let's get it from user metadata or profile.
    const { data: profile } = await supabase.from('users').select('organization_id').eq('id', user.id).single()

    if (!profile) return { error: 'Error de cuenta' }

    const subject = formData.get('subject') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    // 1. Validate
    if (!subject || subject.length < 5) return { error: 'Asunto muy corto' }
    if (!description || description.length < 20) return { error: 'Describe mejor el problema' }

    // 2. Insert
    const { error: insertError } = await supabase.from('help_tickets').insert({
        organization_id: profile.organization_id,
        user_id: user.id,
        subject: `[${category}] ${subject}`,
        description,
        status: 'open',
        priority: 'medium'
    })

    if (insertError) return { error: 'Error al enviar ticket' }

    return { success: true }
}

