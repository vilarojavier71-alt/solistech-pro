'use server'

/**
 * STUB: Supabase Client Legacy Compatibility
 * 
 * Este archivo proporciona compatibilidad temporal para código legacy
 * que referencia funciones de Supabase que ya no están disponibles.
 * 
 * TODO: Migrar funcionalidad a Prisma o eliminar si no se usa.
 * 
 * Tablas legacy referenciadas:
 * - help_articles
 * - help_categories  
 * - help_tickets
 * - municipal_benefits
 * - subsidies
 */

interface SupabaseStubQuery {
    select: (query?: string) => SupabaseStubQuery
    insert: (data: unknown) => SupabaseStubQuery
    update: (data: unknown) => SupabaseStubQuery
    delete: () => SupabaseStubQuery
    eq: (column: string, value: unknown) => SupabaseStubQuery
    neq: (column: string, value: unknown) => SupabaseStubQuery
    or: (filter: string) => SupabaseStubQuery
    order: (column: string, options?: { ascending?: boolean }) => SupabaseStubQuery
    limit: (count: number) => SupabaseStubQuery
    single: () => Promise<{ data: null; error: { message: string } }>
    not: (column: string, filter: string, value: unknown) => SupabaseStubQuery
}

interface SupabaseStubClient {
    from: (table: string) => SupabaseStubQuery
    storage: {
        from: (bucket: string) => {
            upload: (path: string, file: unknown) => Promise<{ data: null; error: { message: string } }>
            getPublicUrl: (path: string) => { data: { publicUrl: string } }
        }
    }
    auth: {
        getUser: () => Promise<{ data: { user: null }; error: null }>
    }
}

const stubQuery: SupabaseStubQuery = {
    select: () => stubQuery,
    insert: () => stubQuery,
    update: () => stubQuery,
    delete: () => stubQuery,
    eq: () => stubQuery,
    neq: () => stubQuery,
    or: () => stubQuery,
    order: () => stubQuery,
    limit: () => stubQuery,
    not: () => stubQuery,
    single: async () => ({
        data: null,
        error: { message: 'Supabase legacy: Función no disponible. Migrar a Prisma.' }
    }),
}

/**
 * Stub createClient - Retorna un cliente mock que no hace nada
 * Los errores se loguean en consola para facilitar migración
 */
export async function createClient(): Promise<SupabaseStubClient> {
    console.warn('[SUPABASE_LEGACY] createClient() llamado. Esta función está deprecada. Migrar a Prisma.')

    return {
        from: (table: string) => {
            console.warn(`[SUPABASE_LEGACY] Acceso a tabla "${table}" - No disponible`)
            return stubQuery
        },
        storage: {
            from: (bucket: string) => ({
                upload: async () => ({
                    data: null,
                    error: { message: `Storage "${bucket}" no disponible` }
                }),
                getPublicUrl: (path: string) => ({
                    data: { publicUrl: `/stub-storage/${bucket}/${path}` }
                }),
            }),
        },
        auth: {
            getUser: async () => ({ data: { user: null }, error: null }),
        },
    }
}
