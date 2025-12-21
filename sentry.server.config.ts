import * as Sentry from "@sentry/nextjs";

/**
 * Sentry Server Configuration
 * 
 * Se ejecuta en el servidor Node.js.
 * Captura errores de Server Components, API routes, y Server Actions.
 */
Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Performance sampling
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Debugging solo en development
    debug: process.env.NODE_ENV === "development",

    // Entorno
    environment: process.env.NODE_ENV,

    // PII filtering
    beforeSend(event) {
        // No enviar eventos sensibles
        if (event.request?.cookies) {
            delete event.request.cookies;
        }
        if (event.request?.headers) {
            // Eliminar headers sensibles
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
        }
        return event;
    },
});
