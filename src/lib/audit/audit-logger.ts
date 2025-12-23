/**
 * Audit Logger - ISO 27001 A.8.15 Compliance
 * 
 * Genera logs inmutables para todas las acciones críticas del sistema.
 * Cumple con requisitos de trazabilidad y cumplimiento regulatorio.
 * 
 * @requires Tabla audit_logs en base de datos
 */

'use server'

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export type AuditEventType =
    | 'invoice.created'
    | 'invoice.updated'
    | 'invoice.payment.registered'
    | 'invoice.cancelled'
    | 'payment.processed'
    | 'journal_entry.created'
    | 'journal_entry.posted'
    | 'sale.created'
    | 'sale.updated'
    | 'project.created'
    | 'project.updated'
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'role.changed'
    | 'permission.granted'
    | 'permission.revoked'
    | 'organization.updated'
    | 'subscription.changed'
    | 'infrastructure.scaled'
    | 'budget.exceeded'
    | 'security.breach.attempt'
    | 'data.exported'
    | 'data.deleted'

export interface AuditLogData {
    eventType: AuditEventType
    userId: string
    organizationId?: string
    resourceType: string
    resourceId: string
    action: string
    metadata?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
}

/**
 * Crea un log de auditoría inmutable
 * 
 * @param data - Datos del evento de auditoría
 * @returns ID del log creado o null si falla
 */
export async function auditLog(data: AuditLogData): Promise<string | null> {
    try {
        // Validación estricta
        if (!data.eventType || !data.userId || !data.resourceType || !data.resourceId) {
            logger.error('Invalid audit log data', {
                source: 'audit-logger',
                action: 'validation_failed',
                data
            })
            return null
        }

        // Crear log en base de datos (inmutable)
        const auditEntry = await prisma.audit_logs.create({
            data: {
                event_type: data.eventType,
                user_id: data.userId,
                organization_id: data.organizationId || null,
                resource_type: data.resourceType,
                resource_id: data.resourceId,
                action: data.action,
                metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                ip_address: data.ipAddress || null,
                user_agent: data.userAgent || null,
                timestamp: new Date()
            }
        })

        // También loguear en sistema de logging estructurado
        logger.info('Audit log created', {
            source: 'audit-logger',
            action: 'audit_log_created',
            eventType: data.eventType,
            userId: data.userId,
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            auditLogId: auditEntry.id
        })

        return auditEntry.id
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        // Logging de error crítico (no debe fallar silenciosamente)
        logger.error('Failed to create audit log', {
            source: 'audit-logger',
            action: 'audit_log_failed',
            error: errorMessage,
            eventType: data.eventType,
            userId: data.userId
        })

        // En producción, esto es crítico - no retornar null silenciosamente
        if (process.env.NODE_ENV === 'production') {
            // En producción, lanzar error para que se detecte
            throw new Error(`Critical: Audit logging failed for event ${data.eventType}`)
        }

        return null
    }
}

/**
 * Sanitiza metadata para evitar exposición de PII
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization', 'cookie', 'credit_card', 'ssn', 'dni', 'nif']
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(metadata)) {
        const lowerKey = key.toLowerCase()
        
        // Ocultar claves sensibles
        if (sensitiveKeys.some(s => lowerKey.includes(s))) {
            sanitized[key] = '[REDACTED]'
            continue
        }
        
        // Recursión para objetos anidados
        if (value && typeof value === 'object' && !Array.isArray(value) && value.constructor === Object) {
            sanitized[key] = sanitizeMetadata(value as Record<string, unknown>)
            continue
        }
        
        sanitized[key] = value
    }
    
    return sanitized
}

/**
 * Helper para obtener contexto de request (IP, User-Agent)
 */
export function getRequestContext(request?: {
    ip?: string | null
    headers?: Headers | Record<string, string>
}): { ipAddress?: string; userAgent?: string } {
    const ipAddress = request?.ip || 
        (request?.headers instanceof Headers 
            ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
            : request?.headers?.['x-forwarded-for']?.split(',')[0]?.trim()) ||
        request?.headers?.['x-real-ip'] ||
        undefined

    const userAgent = request?.headers instanceof Headers
        ? request.headers.get('user-agent') || undefined
        : request?.headers?.['user-agent'] || undefined

    return { ipAddress, userAgent }
}

/**
 * Helper para crear audit log desde Server Action
 */
export async function auditLogAction(
    eventType: AuditEventType,
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string,
    options?: {
        organizationId?: string
        metadata?: Record<string, unknown>
        request?: { ip?: string | null; headers?: Headers | Record<string, string> }
    }
): Promise<void> {
    const context = options?.request ? getRequestContext(options.request) : {}
    
    // Sanitizar metadata para evitar PII
    const sanitizedMetadata = options?.metadata ? sanitizeMetadata(options.metadata) : undefined
    
    await auditLog({
        eventType,
        userId,
        organizationId: options?.organizationId,
        resourceType,
        resourceId,
        action,
        metadata: sanitizedMetadata,
        ...context
    })
}

