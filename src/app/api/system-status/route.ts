import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 60 // Cache for 60 seconds

interface ServiceCheck {
    name: string
    status: 'operational' | 'degraded' | 'down'
    icon: string
    message?: string
}

/**
 * API Route: /api/system-status
 * 
 * Performs health checks on external services and returns their status.
 * Cached for 60 seconds to avoid overwhelming external APIs.
 */
export async function GET() {
    const services: ServiceCheck[] = []

    // 1. Check Database (Prisma)
    try {
        const dbStart = Date.now()
        const { prisma } = await import('@/lib/db')
        await prisma.$queryRaw`SELECT 1`
        const dbTime = Date.now() - dbStart

        services.push({
            name: 'Base de Datos',
            status: dbTime < 500 ? 'operational' : 'degraded',
            icon: 'Database',
            message: `Respuesta: ${dbTime}ms`
        })
    } catch (error) {
        services.push({
            name: 'Base de Datos',
            status: 'down',
            icon: 'Database',
            message: 'Error de conexión'
        })
    }

    // 2. Check Google Solar API (via environment variables)
    try {
        const hasGoogleKey = !!process.env.GOOGLE_SOLAR_API_KEY
        services.push({
            name: 'Google Solar API',
            status: hasGoogleKey ? 'operational' : 'degraded',
            icon: 'Sun',
            message: hasGoogleKey ? 'API Key configurada' : 'API Key no configurada'
        })
    } catch {
        services.push({
            name: 'Google Solar API',
            status: 'down',
            icon: 'Sun'
        })
    }

    // 3. Check Stripe
    try {
        const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
        services.push({
            name: 'Stripe (Pagos)',
            status: hasStripeKey ? 'operational' : 'degraded',
            icon: 'CreditCard',
            message: hasStripeKey ? 'Configurado' : 'No configurado'
        })
    } catch {
        services.push({
            name: 'Stripe (Pagos)',
            status: 'down',
            icon: 'CreditCard'
        })
    }

    // 4. Check Resend (Email)
    try {
        const hasResendKey = !!process.env.RESEND_API_KEY
        services.push({
            name: 'Email (Resend)',
            status: hasResendKey ? 'operational' : 'degraded',
            icon: 'Mail',
            message: hasResendKey ? 'Configurado' : 'No configurado'
        })
    } catch {
        services.push({
            name: 'Email (Resend)',
            status: 'down',
            icon: 'Mail'
        })
    }

    return NextResponse.json({
        services,
        timestamp: new Date().toISOString(),
        allOperational: services.every(s => s.status === 'operational')
    })
}
