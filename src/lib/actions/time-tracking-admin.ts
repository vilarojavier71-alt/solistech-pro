'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole, isAdmin } from '@/lib/session'

// Obtener fichajes de todos los empleados (solo admin)
export async function getAllTimeEntries(filters?: {
    userId?: string
    dateFrom?: string
    dateTo?: string
}) {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: null, error: 'No autenticado' }

    const isAdminUser = await isAdmin()
    if (!isAdminUser) {
        return { data: null, error: 'No autorizado' }
    }

    const where: any = {}

    if (filters?.userId) {
        where.user_id = filters.userId
    }

    if (filters?.dateFrom || filters?.dateTo) {
        where.clock_in = {}
        if (filters.dateFrom) where.clock_in.gte = new Date(filters.dateFrom)
        if (filters.dateTo) where.clock_in.lte = new Date(filters.dateTo)
    }

    const data = await prisma.timeEntry.findMany({
        where,
        include: {
            user: { select: { id: true, full_name: true, email: true } }
        },
        orderBy: { clock_in: 'desc' },
        take: 100
    })

    return { data, error: null }
}

// Obtener lista de empleados de la organización
export async function getOrganizationUsers() {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: null, error: 'No autenticado' }

    const data = await prisma.user.findMany({
        where: { organization_id: user.organizationId },
        select: { id: true, full_name: true, email: true, role: true },
        orderBy: { full_name: 'asc' }
    })

    return { data, error: null }
}

// Exportar fichajes a CSV
export async function exportTimeEntriesToCSV(filters?: {
    userId?: string
    dateFrom?: string
    dateTo?: string
}) {
    const { data: entries, error } = await getAllTimeEntries(filters)

    if (error || !entries) {
        return { data: null, error: error || 'No se encontraron datos' }
    }

    const headers = ['Empleado', 'Entrada', 'Salida', 'Minutos Trabajados', 'Estado', 'Verificado']
    const rows = entries.map((entry: any) => [
        entry.user?.full_name || 'Desconocido',
        entry.clock_in ? new Date(entry.clock_in).toLocaleString('es-ES') : '-',
        entry.clock_out ? new Date(entry.clock_out).toLocaleString('es-ES') : '-',
        entry.total_minutes || '0',
        entry.status || '-',
        entry.is_verified ? 'Sí' : 'No'
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n')

    return { data: csvContent, error: null }
}

// Validar jornada (admin)
export async function validateWorkDay(entryId: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'No autenticado' }

    const isAdminUser = await isAdmin()
    if (!isAdminUser) {
        return { error: 'No autorizado' }
    }

    const data = await prisma.timeEntry.update({
        where: { id: entryId },
        data: {
            is_verified: true,
            verification_notes: `Validado por ${user.email} el ${new Date().toISOString()}`
        }
    })

    return { data, error: null }
}

