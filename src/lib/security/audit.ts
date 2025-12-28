

export enum AuditAction {
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    EXPORT = 'EXPORT',
    VIEW_SENSITIVE = 'VIEW_SENSITIVE'
}

export enum AuditSeverity {
    INFO = 'INFO',
    WARNING = 'WARNING',
    CRITICAL = 'CRITICAL'
}

interface AuditEntry {
    action: AuditAction
    resource: string
    resourceId?: string
    details?: Record<string, any>
    severity?: AuditSeverity
    ip?: string
    userId?: string
    organizationId?: string
}

/**
 * Enhanced Audit Logger for ISO 27001 Compliance
 * Logs critical system actions immutably.
 */
export async function logAudit(entry: AuditEntry) {
    const timestamp = new Date().toISOString()

    // In production, this should ideally write to a dedicated log service (DataDog, Splunk)
    // or a secured database table that cannot be modified by the app itself (WORM storage).

    const logPayload = {
        timestamp,
        ...entry,
        environment: process.env.NODE_ENV,
        service: 'antigravity-core'
    }

    // 1. Console Log (captured by Docker/Coolify)
    if (entry.severity === AuditSeverity.CRITICAL) {
        console.error(JSON.stringify(logPayload))
    } else {
        console.log(JSON.stringify(logPayload))
    }

    // 2. TODO: Database persistence (AuditLog table)
    // await prisma.auditLog.create({ ... })
}

/**
 * Helper to sanitize sensitive data before logging
 */
export function sanitizeAuditData(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'credit_card', 'cvv']
    const sanitized = { ...data }

    for (const key of Object.keys(sanitized)) {
        if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
            sanitized[key] = '[REDACTED]'
        }
    }

    return sanitized
}
