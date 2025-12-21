/**
 * Instrumentation Hook for Sentry
 * 
 * Este archivo se ejecuta una vez cuando el servidor inicia.
 * Inicializa Sentry para capturar errores del servidor y edge.
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        // Importar configuración del servidor
        await import('./sentry.server.config');
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        // Importar configuración de edge
        await import('./sentry.edge.config');
    }
}
