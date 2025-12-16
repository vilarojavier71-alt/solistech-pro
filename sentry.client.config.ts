/**
 * Sentry Configuration - Client Side
 * Este archivo se auto-carga por @sentry/nextjs
 */

import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Sampling: 100% en staging, 10% en producción
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Replay de sesiones (solo errores)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 1.0,

        // Environment
        environment: process.env.NODE_ENV,

        // PII Scrubbing
        beforeSend(event) {
            // Eliminar emails
            if (event.user?.email) {
                event.user.email = '[REDACTED]'
            }

            // Eliminar datos sensibles de breadcrumbs
            if (event.breadcrumbs) {
                event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
                    if (breadcrumb.data) {
                        const sensitiveKeys = ['password', 'token', 'secret', 'authorization']
                        for (const key of sensitiveKeys) {
                            if (key in breadcrumb.data) {
                                breadcrumb.data[key] = '[REDACTED]'
                            }
                        }
                    }
                    return breadcrumb
                })
            }

            return event
        },

        // Ignorar errores comunes de cliente
        ignoreErrors: [
            'ResizeObserver loop limit exceeded',
            'Non-Error promise rejection captured',
            /Loading chunk \d+ failed/,
        ],
    })
}
