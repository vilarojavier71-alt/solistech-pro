/**
 * Centralized Logger - MotorGap
 * 
 * Formato JSON estricto para stdout/stderr compatible con:
 * - Datadog
 * - CloudWatch
 * - Vercel Logs
 * - Sentry (errores automáticos)
 * 
 * Uso:
 *   import { logger } from '@/lib/logger'
 *   logger.info('Mensaje', { userId: '123' })
 *   logger.error('Error crítico', { error, context })
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
    timestamp: string
    level: LogLevel
    message: string
    service: string
    environment: string
    [key: string]: unknown
}

// Configuración
const SERVICE_NAME = 'motorgap'
const ENVIRONMENT = process.env.NODE_ENV || 'development'
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info') as LogLevel

// Niveles de log con prioridad
const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
}

/**
 * Sanitizar datos sensibles (PII Scrubbing)
 */
function sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'cookie', 'credit_card', 'ssn']
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

    const sanitized: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()

        // Ocultar claves sensibles
        if (sensitiveKeys.some(s => lowerKey.includes(s))) {
            sanitized[key] = '[REDACTED]'
            continue
        }

        // Sanitizar emails en strings
        if (typeof value === 'string' && emailRegex.test(value)) {
            sanitized[key] = value.replace(emailRegex, '[EMAIL]')
            continue
        }

        // Recursión para objetos anidados
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitize(value as Record<string, unknown>)
            continue
        }

        sanitized[key] = value
    }

    return sanitized
}

/**
 * Formatear entry para JSON output
 */
function formatLogEntry(level: LogLevel, message: string, meta: Record<string, unknown> = {}): LogEntry {
    return {
        timestamp: new Date().toISOString(),
        level,
        message,
        service: SERVICE_NAME,
        environment: ENVIRONMENT,
        ...sanitize(meta)
    }
}

/**
 * Verificar si el nivel debe ser logueado
 */
function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[LOG_LEVEL]
}

/**
 * Reportar a Sentry (solo errores y warnings)
 * Integración activa con @sentry/nextjs
 */
async function reportToSentry(level: LogLevel, message: string, meta: Record<string, unknown>) {
    if (level !== 'error' && level !== 'warn') return
    if (typeof window !== 'undefined') return // Solo server-side

    // Solo intentar si la variable de entorno existe
    if (!process.env.SENTRY_DSN && !process.env.NEXT_PUBLIC_SENTRY_DSN) return

    try {
        const Sentry = await import('@sentry/nextjs')
        if (level === 'error') {
            const error = meta.error instanceof Error ? meta.error : new Error(message)
            Sentry.captureException(error, { extra: sanitize(meta) })
        } else {
            Sentry.captureMessage(message, { level: 'warning', extra: sanitize(meta) })
        }
    } catch {
        // Sentry not configured, skip silently
    }
}

/**
 * Logger principal
 */
export const logger = {
    debug(message: string, meta: Record<string, unknown> = {}) {
        if (!shouldLog('debug')) return
        const entry = formatLogEntry('debug', message, meta)
        console.debug(JSON.stringify(entry))
    },

    info(message: string, meta: Record<string, unknown> = {}) {
        if (!shouldLog('info')) return
        const entry = formatLogEntry('info', message, meta)
        console.info(JSON.stringify(entry))
    },

    warn(message: string, meta: Record<string, unknown> = {}) {
        if (!shouldLog('warn')) return
        const entry = formatLogEntry('warn', message, meta)
        console.warn(JSON.stringify(entry))
        reportToSentry('warn', message, meta)
    },

    error(message: string, meta: Record<string, unknown> = {}) {
        if (!shouldLog('error')) return
        const entry = formatLogEntry('error', message, meta)
        console.error(JSON.stringify(entry))
        reportToSentry('error', message, meta)
    },

    /**
     * Log con contexto de request (para API routes)
     */
    withContext(context: { requestId?: string; userId?: string; path?: string }) {
        return {
            debug: (message: string, meta: Record<string, unknown> = {}) =>
                logger.debug(message, { ...context, ...meta }),
            info: (message: string, meta: Record<string, unknown> = {}) =>
                logger.info(message, { ...context, ...meta }),
            warn: (message: string, meta: Record<string, unknown> = {}) =>
                logger.warn(message, { ...context, ...meta }),
            error: (message: string, meta: Record<string, unknown> = {}) =>
                logger.error(message, { ...context, ...meta }),
        }
    }
}

// Exportar tipos
export type { LogLevel, LogEntry }
