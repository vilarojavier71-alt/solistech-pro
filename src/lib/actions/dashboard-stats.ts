'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'

/**
 * Dashboard Stats - Aggregated KPIs for Centralita
 * 
 * Fetches all critical business metrics in parallel for optimal performance.
 * Uses Prisma aggregations and counts with proper organization filtering.
 * 
 * ROBUSTEZ: Todas las funciones están envueltas en try-catch para evitar
 * crashear el dashboard si falla una consulta a la base de datos.
 */

export interface DashboardStats {
    // KPIs Maestros
    totalRevenue: number           // Sum of paid invoices
    monthlyRevenue: number         // Sum of paid invoices this month
    leadsCount: number             // New leads this month
    activeProjectsCount: number    // Projects in 'installation' status
    todayAppointments: number      // Appointments scheduled for today

    // Additional metrics
    customersCount: number
    invoicesCount: number
    pendingInvoices: number        // Unpaid invoices

    // Error state
    hasError?: boolean
    errorMessage?: string
}

// Default empty stats for error handling
const EMPTY_STATS: DashboardStats = {
    totalRevenue: 0,
    monthlyRevenue: 0,
    leadsCount: 0,
    activeProjectsCount: 0,
    todayAppointments: 0,
    customersCount: 0,
    invoicesCount: 0,
    pendingInvoices: 0
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const user = await getCurrentUserWithRole()

        if (!user?.organizationId) {
            console.log('[DASHBOARD-STATS] No organization ID found for user')
            return EMPTY_STATS
        }

        const orgId = user.organizationId
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // Execute all queries in parallel for maximum performance
        const [
            totalRevenueResult,
            monthlyRevenueResult,
            leadsCount,
            activeProjectsCount,
            todayAppointments,
            customersCount,
            invoicesCount,
            pendingInvoices
        ] = await Promise.all([
            // Total Revenue (all paid invoices)
            prisma.invoices.aggregate({
                where: { organization_id: orgId, status: 'paid' },
                _sum: { total: true }
            }).catch(() => ({ _sum: { total: null } })),

            // Monthly Revenue (paid invoices this month)
            prisma.invoices.aggregate({
                where: {
                    organization_id: orgId,
                    status: 'paid',
                    date: { gte: startOfMonth }
                },
                _sum: { total: true }
            }).catch(() => ({ _sum: { total: null } })),

            // Leads count (this month)
            prisma.leads.count({
                where: {
                    organization_id: orgId,
                    created_at: { gte: startOfMonth }
                }
            }).catch(() => 0),

            // Active projects (in installation phase)
            prisma.projects.count({
                where: {
                    organization_id: orgId,
                    status: { in: ['installation', 'approved'] }
                }
            }).catch(() => 0),

            // Today's appointments
            prisma.appointments.count({
                where: {
                    organization_id: orgId,
                    start_time: { gte: today, lt: tomorrow }
                }
            }).catch(() => 0),

            // Total customers
            prisma.customers.count({
                where: { organization_id: orgId }
            }).catch(() => 0),

            // Total invoices
            prisma.invoices.count({
                where: { organization_id: orgId }
            }).catch(() => 0),

            // Pending invoices (not paid)
            prisma.invoices.count({
                where: {
                    organization_id: orgId,
                    status: { in: ['pending', 'sent', 'draft'] }
                }
            }).catch(() => 0)
        ])

        return {
            totalRevenue: totalRevenueResult._sum.total?.toNumber?.() || 0,
            monthlyRevenue: monthlyRevenueResult._sum.total?.toNumber?.() || 0,
            leadsCount,
            activeProjectsCount,
            todayAppointments,
            customersCount,
            invoicesCount,
            pendingInvoices
        }

    } catch (error) {
        console.error('[DASHBOARD-STATS] Critical error fetching stats:', error)
        return {
            ...EMPTY_STATS,
            hasError: true,
            errorMessage: error instanceof Error ? error.message : 'Error desconocido'
        }
    }
}

/**
 * Get recent projects for the dashboard widget
 */
export async function getRecentProjects(limit = 5) {
    try {
        const user = await getCurrentUserWithRole()

        if (!user?.organizationId) return []

        return await prisma.projects.findMany({
            where: { organization_id: user.organizationId },
            orderBy: { updated_at: 'desc' },
            take: limit,
            include: {
                client: { select: { name: true } }
            }
        })
    } catch (error) {
        console.error('[DASHBOARD-STATS] Error fetching recent projects:', error)
        return []
    }
}

/**
 * Get today's appointments for the agenda widget
 */
export async function getTodayAppointments() {
    try {
        const user = await getCurrentUserWithRole()

        if (!user?.organizationId) return []

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        return await prisma.appointments.findMany({
            where: {
                organization_id: user.organizationId,
                start_time: { gte: today, lt: tomorrow }
            },
            orderBy: { start_time: 'asc' },
            include: {
                customer: { select: { name: true, phone: true } }
            }
        })
    } catch (error) {
        console.error('[DASHBOARD-STATS] Error fetching appointments:', error)
        return []
    }
}
