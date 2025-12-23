'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

// ═══════════════════════════════════════════════════════════════════════════════
// TIPOS Y CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════

export type LeaveType = 'vacation' | 'personal' | 'paid' | 'sick' | 'unpaid' | 'other'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    vacation: 'Vacaciones',
    personal: 'Asuntos Propios',
    paid: 'Día Remunerado',
    sick: 'Enfermedad',
    unpaid: 'Sin Sueldo',
    other: 'Otro'
}

const STATUS_LABELS: Record<LeaveStatus, string> = {
    pending: 'Pendiente',
    approved: 'Aprobado',
    rejected: 'Rechazado',
    cancelled: 'Cancelado'
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const requestLeaveSchema = z.object({
    leaveType: z.enum(['vacation', 'personal', 'paid', 'sick', 'unpaid', 'other']),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    daysRequested: z.number().min(0.5).max(365),
    reason: z.string().optional(),
})

const approveLeaveSchema = z.object({
    requestId: z.string().uuid(),
    approved: z.boolean(),
    rejectionReason: z.string().optional(),
})

const adjustBalanceSchema = z.object({
    userId: z.string().uuid(),
    year: z.number().int().min(2020).max(2100),
    vacationDaysTotal: z.number().min(0).max(100).optional(),
    personalDaysTotal: z.number().min(0).max(30).optional(),
    paidDaysTotal: z.number().min(0).max(30).optional(),
})

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0
    const current = new Date(startDate)

    while (current <= endDate) {
        const dayOfWeek = current.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude weekends
            count++
        }
        current.setDate(current.getDate() + 1)
    }

    return count
}

// ═══════════════════════════════════════════════════════════════════════════════
// BALANCE ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getLeaveBalance(userId?: string, year?: number) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const currentYear = year || new Date().getFullYear()
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (!user?.organization_id) {
            return { success: false, error: 'Sin organización' }
        }

        const targetUserId = userId && (user.role === 'admin' || user.role === 'technician')
            ? userId
            : user.id

        // Get or create balance for this year
        let balance = await prisma.employee_leave_balances.findUnique({
            where: {
                user_id_year: {
                    user_id: targetUserId,
                    year: currentYear
                }
            }
        })

        // If no balance exists, create one
        if (!balance) {
            balance = await prisma.employee_leave_balances.create({
                data: {
                    user_id: targetUserId,
                    organization_id: user.organization_id,
                    year: currentYear,
                    vacation_days_total: new Decimal(22),
                    vacation_days_used: new Decimal(0),
                    vacation_days_pending: new Decimal(0),
                    personal_days_total: new Decimal(3),
                    personal_days_used: new Decimal(0),
                    paid_days_total: new Decimal(0),
                    paid_days_used: new Decimal(0),
                }
            })
        }

        // Calculate available days
        const data = {
            ...balance,
            vacationAvailable: Number(balance.vacation_days_total) - Number(balance.vacation_days_used) - Number(balance.vacation_days_pending),
            personalAvailable: Number(balance.personal_days_total) - Number(balance.personal_days_used),
            paidAvailable: Number(balance.paid_days_total) - Number(balance.paid_days_used),
        }

        return { success: true, data }

    } catch (error) {
        console.error('Error fetching leave balance:', error)
        return { success: false, error: 'Error al obtener saldo' }
    }
}

export async function getAllEmployeeBalances(year?: number) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado', data: [] }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (user?.role !== 'admin') {
            return { success: false, error: 'Solo administradores', data: [] }
        }

        const currentYear = year || new Date().getFullYear()

        const balances = await prisma.employee_leave_balances.findMany({
            where: {
                organization_id: user.organization_id!,
                year: currentYear
            },
            orderBy: { created_at: 'desc' }
        })

        return { success: true, data: balances }

    } catch (error) {
        console.error('Error fetching all balances:', error)
        return { success: false, error: 'Error al obtener saldos', data: [] }
    }
}

export async function adjustBalance(data: z.infer<typeof adjustBalanceSchema>) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const validated = adjustBalanceSchema.parse(data)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (user?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        const updateData: Record<string, Decimal> = {}
        if (validated.vacationDaysTotal !== undefined) {
            updateData.vacation_days_total = new Decimal(validated.vacationDaysTotal)
        }
        if (validated.personalDaysTotal !== undefined) {
            updateData.personal_days_total = new Decimal(validated.personalDaysTotal)
        }
        if (validated.paidDaysTotal !== undefined) {
            updateData.paid_days_total = new Decimal(validated.paidDaysTotal)
        }

        const balance = await prisma.employee_leave_balances.upsert({
            where: {
                user_id_year: {
                    user_id: validated.userId,
                    year: validated.year
                }
            },
            update: updateData,
            create: {
                user_id: validated.userId,
                organization_id: user.organization_id!,
                year: validated.year,
                vacation_days_total: new Decimal(validated.vacationDaysTotal || 22),
                personal_days_total: new Decimal(validated.personalDaysTotal || 3),
                paid_days_total: new Decimal(validated.paidDaysTotal || 0),
            }
        })

        revalidatePath('/dashboard/team')
        return { success: true, data: balance }

    } catch (error) {
        console.error('Error adjusting balance:', error)
        return { success: false, error: 'Error al ajustar saldo' }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAVE REQUEST ACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function requestLeave(data: z.infer<typeof requestLeaveSchema>) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const validated = requestLeaveSchema.parse(data)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true }
        })

        if (!user?.organization_id) {
            return { success: false, error: 'Sin organización' }
        }

        // Verify user has enough balance
        const year = new Date(validated.startDate).getFullYear()
        const balanceResult = await getLeaveBalance(user.id, year)

        if (!balanceResult.success || !balanceResult.data) {
            return { success: false, error: 'No se pudo verificar el saldo' }
        }

        const balance = balanceResult.data
        let hasEnoughDays = false

        switch (validated.leaveType) {
            case 'vacation':
                hasEnoughDays = balance.vacationAvailable >= validated.daysRequested
                break
            case 'personal':
                hasEnoughDays = balance.personalAvailable >= validated.daysRequested
                break
            case 'paid':
                hasEnoughDays = balance.paidAvailable >= validated.daysRequested
                break
            case 'sick':
            case 'unpaid':
            case 'other':
                hasEnoughDays = true // No balance check for these
                break
        }

        if (!hasEnoughDays) {
            return { success: false, error: 'Saldo insuficiente para este tipo de ausencia' }
        }

        // Create request
        const request = await prisma.leave_requests.create({
            data: {
                user_id: user.id,
                organization_id: user.organization_id,
                leave_type: validated.leaveType,
                start_date: new Date(validated.startDate),
                end_date: new Date(validated.endDate),
                days_requested: new Decimal(validated.daysRequested),
                reason: validated.reason,
                status: 'pending'
            }
        })

        // Update pending days if vacation type
        if (validated.leaveType === 'vacation') {
            await prisma.employee_leave_balances.update({
                where: {
                    user_id_year: { user_id: user.id, year }
                },
                data: {
                    vacation_days_pending: {
                        increment: validated.daysRequested
                    }
                }
            })
        }

        revalidatePath('/dashboard/time-tracking')
        return { success: true, data: request }

    } catch (error) {
        console.error('Error requesting leave:', error)
        return { success: false, error: 'Error al solicitar ausencia' }
    }
}

export async function getLeaveRequests(filters?: { status?: string; userId?: string }) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado', data: [] }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (!user?.organization_id) {
            return { success: false, error: 'Sin organización', data: [] }
        }

        const isAdmin = user.role === 'admin'
        const where: Record<string, unknown> = {
            organization_id: user.organization_id,
        }

        // Non-admins can only see their own requests
        if (!isAdmin) {
            where.user_id = user.id
        } else if (filters?.userId) {
            where.user_id = filters.userId
        }

        if (filters?.status) {
            where.status = filters.status
        }

        const requests = await prisma.leave_requests.findMany({
            where,
            orderBy: { created_at: 'desc' }
        })

        return { success: true, data: requests }

    } catch (error) {
        console.error('Error fetching leave requests:', error)
        return { success: false, error: 'Error al obtener solicitudes', data: [] }
    }
}

export async function approveOrRejectLeave(data: z.infer<typeof approveLeaveSchema>) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const validated = approveLeaveSchema.parse(data)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true }
        })

        if (user?.role !== 'admin') {
            return { success: false, error: 'Solo administradores' }
        }

        // ✅ Validar organization_id antes de procesar (IDOR Prevention)
        const userOrg = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organization_id: true }
        })

        if (!userOrg?.organization_id) {
            return { success: false, error: 'Usuario sin organización asignada' }
        }

        const request = await prisma.leave_requests.findFirst({
            where: {
                id: validated.requestId,
                user: {
                    organization_id: userOrg.organization_id
                }
            }
        })

        if (!request || request.status !== 'pending') {
            return { success: false, error: 'Solicitud no encontrada o ya procesada' }
        }

        const year = request.start_date.getFullYear()
        const daysRequested = Number(request.days_requested)

        if (validated.approved) {
            // Approve and update balances
            await prisma.$transaction([
                prisma.leave_requests.update({
                    where: { id: validated.requestId },
                    data: {
                        status: 'approved',
                        approved_by: user.id,
                        approved_at: new Date()
                    }
                }),
                prisma.employee_leave_balances.update({
                    where: {
                        user_id_year: { user_id: request.user_id, year }
                    },
                    data: {
                        ...(request.leave_type === 'vacation' && {
                            vacation_days_used: { increment: daysRequested },
                            vacation_days_pending: { decrement: daysRequested }
                        }),
                        ...(request.leave_type === 'personal' && {
                            personal_days_used: { increment: daysRequested }
                        }),
                        ...(request.leave_type === 'paid' && {
                            paid_days_used: { increment: daysRequested }
                        })
                    }
                })
            ])
        } else {
            // Reject and restore pending days if vacation
            await prisma.$transaction([
                prisma.leave_requests.update({
                    where: { id: validated.requestId },
                    data: {
                        status: 'rejected',
                        rejection_reason: validated.rejectionReason,
                        approved_by: user.id,
                        approved_at: new Date()
                    }
                }),
                ...(request.leave_type === 'vacation' ? [
                    prisma.employee_leave_balances.update({
                        where: {
                            user_id_year: { user_id: request.user_id, year }
                        },
                        data: {
                            vacation_days_pending: { decrement: daysRequested }
                        }
                    })
                ] : [])
            ])
        }

        revalidatePath('/dashboard/team')
        revalidatePath('/dashboard/time-tracking')

        return { success: true }

    } catch (error) {
        console.error('Error processing leave request:', error)
        return { success: false, error: 'Error al procesar solicitud' }
    }
}

export async function cancelLeaveRequest(requestId: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        })

        const request = await prisma.leave_requests.findFirst({
            where: {
                id: requestId,
                user_id: user!.id,
                status: 'pending'
            }
        })

        if (!request) {
            return { success: false, error: 'Solicitud no encontrada o ya procesada' }
        }

        const year = request.start_date.getFullYear()

        await prisma.$transaction([
            prisma.leave_requests.update({
                where: { id: requestId },
                data: { status: 'cancelled' }
            }),
            ...(request.leave_type === 'vacation' ? [
                prisma.employee_leave_balances.update({
                    where: {
                        user_id_year: { user_id: user!.id, year }
                    },
                    data: {
                        vacation_days_pending: { decrement: Number(request.days_requested) }
                    }
                })
            ] : [])
        ])

        revalidatePath('/dashboard/time-tracking')
        return { success: true }

    } catch (error) {
        console.error('Error cancelling leave request:', error)
        return { success: false, error: 'Error al cancelar solicitud' }
    }
}

// Helper exports
export { LEAVE_TYPE_LABELS, STATUS_LABELS }
