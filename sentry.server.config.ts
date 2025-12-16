/**
 * Sentry Configuration - Server Side
 * Este archivo se auto-carga por @sentry/nextjs
 */

import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,

        // Sampling: 100% en staging, 10% en producción
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Environment
        environment: process.env.NODE_ENV,

        // PII Scrubbing
        beforeSend(event) {
            // Eliminar emails
            if (event.user?.email) {
                event.user.email = '[REDACTED]'
            }

            // Limpiar request body de datos sensibles
            if (event.request?.data) {
                try {
                    const data = typeof event.request.data === 'string'
                        ? JSON.parse(event.request.data)
                        : event.request.data

                    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'credit_card']
                    for (const key of sensitiveKeys) {
                        if (key in data) {
                            data[key] = '[REDACTED]'
                        }
                    }
                    event.request.data = JSON.stringify(data)
                } catch {
                    // No es JSON, dejar como está
                }
            }

            return event
        },

        // Integrations
        integrations: [
            Sentry.prismaIntegration(), // Tracing de queries Prisma
        ],
    })
}
