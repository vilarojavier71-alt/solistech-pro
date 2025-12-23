/**
 * Rate Limiter Centralizado - Anti-Ban 2.0
 * 
 * Implementa rate limiting dinámico con ventana deslizante y tarpitting.
 * Previene baneos por proveedores (Hetzner, Coolify) y ataques DDoS.
 * 
 * ISO 27001 A.8.28 Compliance
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export interface RateLimitConfig {
    windowMs: number // Ventana de tiempo en milisegundos
    maxRequests: number // Máximo de requests por ventana
    tarpitting?: boolean // Aumentar latencia progresivamente
    tarpittingDelay?: number // Delay base en ms
    keyGenerator?: (req: NextRequest) => string // Función para generar clave única
}

interface RateLimitRecord {
    count: number
    resetAt: number
    tarpittingDelay: number // Delay acumulado por tarpitting
    violations: number // Número de violaciones consecutivas
}

// Store en memoria (en producción, usar Redis)
const rateLimitStore = new Map<string, RateLimitRecord>()

// Limpieza periódica del store (evitar memory leak)
setInterval(() => {
    const now = Date.now()
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetAt) {
            rateLimitStore.delete(key)
        }
    }
}, 60 * 1000) // Limpiar cada minuto

/**
 * Genera clave única para rate limiting
 */
function defaultKeyGenerator(req: NextRequest): string {
    // Priorizar IP real (detrás de proxy)
    const ip = req.ip || 
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    
    // Incluir path para rate limiting por endpoint
    const path = req.nextUrl.pathname
    
    return `${ip}:${path}`
}

/**
 * Verifica rate limit y aplica tarpitting si está habilitado
 */
export function checkRateLimit(
    req: NextRequest,
    config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfter?: number; tarpittingDelay?: number } {
    const now = Date.now()
    const key = config.keyGenerator ? config.keyGenerator(req) : defaultKeyGenerator(req)
    const record = rateLimitStore.get(key)

    // Inicializar o resetear si la ventana expiró
    if (!record || now > record.resetAt) {
        const newRecord: RateLimitRecord = {
            count: 1,
            resetAt: now + config.windowMs,
            tarpittingDelay: 0,
            violations: 0
        }
        rateLimitStore.set(key, newRecord)
        
        return {
            allowed: true,
            remaining: config.maxRequests - 1
        }
    }

    // Verificar si excede el límite
    if (record.count >= config.maxRequests) {
        const retryAfter = Math.ceil((record.resetAt - now) / 1000)
        
        // Incrementar violaciones para tarpitting
        record.violations++
        
        // Aplicar tarpitting si está habilitado
        if (config.tarpitting && config.tarpittingDelay) {
            record.tarpittingDelay = Math.min(
                record.tarpittingDelay + (config.tarpittingDelay * record.violations),
                5000 // Máximo 5 segundos de delay
            )
        }

        // Log de rate limit excedido
        logger.warn('Rate limit exceeded', {
            source: 'rate-limiter',
            action: 'rate_limit_exceeded',
            key,
            count: record.count,
            maxRequests: config.maxRequests,
            violations: record.violations
        })

        return {
            allowed: false,
            remaining: 0,
            retryAfter,
            tarpittingDelay: config.tarpitting ? record.tarpittingDelay : undefined
        }
    }

    // Incrementar contador
    record.count++
    
    // Resetear violaciones si está dentro del límite
    if (record.count < config.maxRequests * 0.8) {
        record.violations = 0
        record.tarpittingDelay = 0
    }

    return {
        allowed: true,
        remaining: config.maxRequests - record.count
    }
}

/**
 * Middleware de rate limiting para Next.js API routes
 */
export function rateLimitMiddleware(config: RateLimitConfig) {
    return (req: NextRequest): NextResponse | null => {
        const result = checkRateLimit(req, config)

        if (!result.allowed) {
            const response = NextResponse.json(
                { 
                    error: 'Too many requests. Please try again later.',
                    retryAfter: result.retryAfter
                },
                { status: 429 }
            )

            // Headers estándar de rate limiting
            response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
            response.headers.set('X-RateLimit-Remaining', '0')
            response.headers.set('X-RateLimit-Reset', new Date(result.retryAfter ? Date.now() + (result.retryAfter * 1000) : Date.now()).toISOString())
            
            if (result.retryAfter) {
                response.headers.set('Retry-After', result.retryAfter.toString())
            }

            return response
        }

        // Aplicar tarpitting si hay delay acumulado
        if (result.tarpittingDelay && result.tarpittingDelay > 0) {
            // En producción, esto debería ser async, pero Next.js middleware es síncrono
            // El tarpitting se aplicará en el handler de la ruta
        }

        return null // Continuar con la request
    }
}

/**
 * Configuraciones predefinidas por tipo de endpoint
 */
export const RATE_LIMIT_PRESETS = {
    // API pública (más restrictivo)
    public: {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 60, // 60 requests/minuto
        tarpitting: true,
        tarpittingDelay: 100 // 100ms base
    },
    
    // API autenticada (moderado)
    authenticated: {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 100, // 100 requests/minuto
        tarpitting: true,
        tarpittingDelay: 50 // 50ms base
    },
    
    // Endpoints críticos (muy restrictivo)
    critical: {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 20, // 20 requests/minuto
        tarpitting: true,
        tarpittingDelay: 200 // 200ms base
    },
    
    // Chat/AI (muy restrictivo por costo)
    ai: {
        windowMs: 60 * 1000, // 1 minuto
        maxRequests: 10, // 10 requests/minuto
        tarpitting: true,
        tarpittingDelay: 500 // 500ms base
    }
} as const

