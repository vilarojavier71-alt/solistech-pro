import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * Health Check Endpoint
 * 
 * Verifica la salud de los componentes críticos del sistema.
 * Usado para:
 * - Monitorización de uptime
 * - Pre-deploy sanity checks
 * - Load balancer health probes
 */

interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy'
    timestamp: string
    version: string
    checks: {
        database: 'ok' | 'error'
        environment: 'ok' | 'error'
        memory: {
            used: number
            limit: number
            percentage: number
        }
    }
    errors: string[]
}

export async function GET() {
    const errors: string[] = []
    const startTime = Date.now()

    // 1. Database Check
    let databaseStatus: 'ok' | 'error' = 'error'
    try {
        await prisma.$queryRaw`SELECT 1`
        databaseStatus = 'ok'
    } catch (error) {
        errors.push(`Database: ${error instanceof Error ? error.message : 'Connection failed'}`)
    }

    // 2. Environment Check
    let envStatus: 'ok' | 'error' = 'ok'
    const requiredEnvVars = [
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
    ]

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            envStatus = 'error'
            errors.push(`Missing env: ${envVar}`)
        }
    }

    // 3. Memory Check
    const memoryUsage = process.memoryUsage()
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024)
    const memoryLimitMB = Math.round(memoryUsage.heapTotal / 1024 / 1024)
    const memoryPercentage = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100)

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    if (databaseStatus === 'error') {
        overallStatus = 'unhealthy'
    } else if (envStatus === 'error' || memoryPercentage > 90) {
        overallStatus = 'degraded'
    }

    const response: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        checks: {
            database: databaseStatus,
            environment: envStatus,
            memory: {
                used: memoryUsedMB,
                limit: memoryLimitMB,
                percentage: memoryPercentage
            }
        },
        errors
    }

    const responseTime = Date.now() - startTime

    return NextResponse.json(response, {
        status: overallStatus === 'unhealthy' ? 503 : 200,
        headers: {
            'X-Response-Time': `${responseTime}ms`,
            'Cache-Control': 'no-store'
        }
    })
}
