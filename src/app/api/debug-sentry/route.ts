/**
 * Debug Route: Sentry Test
 * 
 * Esta ruta lanza una excepción intencional para verificar que Sentry
 * está capturando errores correctamente.
 * 
 * USO: GET /api/debug-sentry
 * NOTA: Solo disponible en desarrollo/staging
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
    // Solo permitir en desarrollo/staging
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_DEBUG_ROUTES) {
        return NextResponse.json(
            { error: 'Not available in production' },
            { status: 403 }
        )
    }

    const action = request.nextUrl.searchParams.get('action') || 'error'

    switch (action) {
        case 'error':
            // Capturar error con Sentry
            logger.error('🔴 [DEBUG] Error intencional para testing', {
                source: 'debug-sentry',
                timestamp: new Date().toISOString()
            })
            throw new Error('🧪 Sentry Test Error - This is intentional!')

        case 'warning':
            logger.warn('🟡 [DEBUG] Warning intencional para testing', {
                source: 'debug-sentry'
            })
            return NextResponse.json({
                success: true,
                message: 'Warning sent to Sentry'
            })

        case 'info':
            logger.info('🔵 [DEBUG] Info log para testing', {
                source: 'debug-sentry',
                requestHeaders: Object.fromEntries(request.headers.entries())
            })
            return NextResponse.json({
                success: true,
                message: 'Info logged (check console)'
            })

        case 'pii':
            // Test de sanitización PII
            logger.info('Testing PII scrubbing', {
                email: 'test@example.com',
                password: 'superSecret123',
                token: 'jwt-token-here',
                userId: '12345',
                normalData: 'This should stay'
            })
            return NextResponse.json({
                success: true,
                message: 'PII test logged - check that sensitive data is redacted'
            })

        default:
            return NextResponse.json({
                message: 'Debug Sentry API',
                actions: {
                    error: '/api/debug-sentry?action=error - Throws exception',
                    warning: '/api/debug-sentry?action=warning - Logs warning',
                    info: '/api/debug-sentry?action=info - Logs info',
                    pii: '/api/debug-sentry?action=pii - Tests PII scrubbing'
                }
            })
    }
}
