import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

// Use a dedicated client for health checks to avoid polluting the main pool
const prisma = new PrismaClient()

export async function GET() {
    try {
        // Check 1: Database Connectivity
        await prisma.$queryRaw`SELECT 1`

        // Check 2: Memory Usage (Optional but useful)
        const memoryUsage = process.memoryUsage()

        return NextResponse.json(
            {
                status: 'ok',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'connected',
                    memory: {
                        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    }
                },
                uptime: process.uptime()
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Health Check Failed:', error)
        return NextResponse.json(
            {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: 'Database connection failed'
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}
