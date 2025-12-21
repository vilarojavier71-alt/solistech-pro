import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Client Configuration
 * 
 * Se ejecuta en el navegador del usuario.
 * Captura errores de JavaScript, React, y performance.
 */
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Ajustar sample rate en producción
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Replay de sesiones (útil para debugging visual)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Debugging solo en development
    debug: process.env.NODE_ENV === "development",

    // Entorno
    environment: process.env.NODE_ENV,

    // PII filtering - NO enviar datos personales
    beforeSend(event) {
        // Limpiar emails del mensaje de error
        if (event.message) {
            event.message = event.message.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
        }
        return event;
    },

    // Ignorar errores conocidos que no son problemas reales
    ignoreErrors: [
        // Errores de red comunes
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Network request failed',
        'Failed to fetch',
        // Errores de extensiones de navegador
        /^chrome-extension:\/\//,
        /^moz-extension:\/\//,
    ],
});
