/**
 * Next.js Instrumentation
 * Carga condicional de configuraciones de Sentry
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Importar config de Sentry para Node.js
        await import('./sentry.server.config')
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        // Importar config de Sentry para Edge runtime
        await import('./sentry.edge.config')
    }
}
