'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEMAS DE VALIDACIÓN
// ═══════════════════════════════════════════════════════════════════════════════

const createTicketSchema = z.object({
    subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
    description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
    category: z.enum(['facturacion', 'tecnico', 'solar', 'general', 'import_incident']),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    customerId: z.string().uuid().optional(),
})

const sendMessageSchema = z.object({
    ticketId: z.string().uuid(),
    content: z.string().min(1, 'El mensaje no puede estar vacío'),
    isInternal: z.boolean().default(false),
})

const updateTicketSchema = z.object({
    ticketId: z.string().uuid(),
    status: z.enum(['open', 'in_analysis', 'intervention', 'resolved', 'closed']).optional(),
    priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
    assignedTo: z.string().uuid().nullable().optional(),
})

// ═══════════════════════════════════════════════════════════════════════════════
// SLA CONFIGURATION (en minutos)
// ═══════════════════════════════════════════════════════════════════════════════

const SLA_DEADLINES: Record<string, number> = {
    urgent: 30,    // 30 minutos
    high: 120,     // 2 horas
    normal: 480,   // 8 horas (1 día laboral)
    low: 1440,     // 24 horas
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCIONES DE TICKETS
// ═══════════════════════════════════════════════════════════════════════════════

export async function createTicket(data: z.infer<typeof createTicketSchema>) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const validated = createTicketSchema.parse(data)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true }
        })

        if (!user?.organization_id) {
            return { success: false, error: 'Usuario sin organización' }
        }

        // Calculate SLA deadline
        const slaMinutes = SLA_DEADLINES[validated.priority] || SLA_DEADLINES.normal
        const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000)

        const ticket = await prisma.supportTicket.create({
            data: {
                organization_id: user.organization_id,
                user_id: user.id,
                customer_id: validated.customerId || null,
                subject: validated.subject,
                description: validated.description,
                category: validated.category,
                priority: validated.priority,
                status: 'open',
                source_type: 'manual',
                sla_deadline: slaDeadline,
            }
        })

        // Add system message
        await prisma.ticketMessage.create({
            data: {
                ticket_id: ticket.id,
                sender_id: user.id,
                sender_role: 'system',
                content: `Ticket creado. Prioridad: ${validated.priority.toUpperCase()}. SLA: ${slaMinutes} minutos.`,
                is_internal: false,
            }
        })

        revalidatePath('/dashboard/support')
        return { success: true, data: ticket }

    } catch (error) {
        console.error('Error creating ticket:', error)
        return { success: false, error: 'Error al crear el ticket' }
    }
}

export async function getTickets(filters?: { status?: string; priority?: string }) {
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
            return { success: false, error: 'Usuario sin organización', data: [] }
        }

        const whereClause: any = {
            organization_id: user.organization_id,
        }

        // If not admin/technician, only show own tickets
        if (user.role !== 'admin' && user.role !== 'technician') {
            whereClause.user_id = user.id
        }

        if (filters?.status) {
            whereClause.status = filters.status
        }
        if (filters?.priority) {
            whereClause.priority = filters.priority
        }

        const tickets = await prisma.supportTicket.findMany({
            where: whereClause,
            orderBy: [
                { priority: 'desc' },
                { created_at: 'desc' }
            ],
            include: {
                user: { select: { full_name: true, email: true } },
                messages: {
                    take: 1,
                    orderBy: { created_at: 'desc' }
                }
            }
        })

        return { success: true, data: tickets }

    } catch (error) {
        console.error('Error fetching tickets:', error)
        return { success: false, error: 'Error al obtener tickets', data: [] }
    }
}

export async function getTicketById(ticketId: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (!user) {
            return { success: false, error: 'Usuario no encontrado' }
        }

        const ticket = await prisma.supportTicket.findFirst({
            where: {
                id: ticketId,
                organization_id: user.organization_id!,
                // Allow admins/technicians to see all, others only own
                ...(user.role !== 'admin' && user.role !== 'technician' ? { user_id: user.id } : {})
            },
            include: {
                user: { select: { full_name: true, email: true, avatar_url: true } },
                messages: {
                    orderBy: { created_at: 'asc' },
                    include: {
                        // Note: We need to add sender relation in schema if needed
                    }
                }
            }
        })

        if (!ticket) {
            return { success: false, error: 'Ticket no encontrado' }
        }

        return { success: true, data: ticket }

    } catch (error) {
        console.error('Error fetching ticket:', error)
        return { success: false, error: 'Error al obtener el ticket' }
    }
}

export async function updateTicket(data: z.infer<typeof updateTicketSchema>) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const validated = updateTicketSchema.parse(data)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (!user || (user.role !== 'admin' && user.role !== 'technician')) {
            return { success: false, error: 'Sin permisos para actualizar' }
        }

        const updateData: any = {}

        if (validated.status) {
            updateData.status = validated.status
            if (validated.status === 'resolved') {
                updateData.resolved_at = new Date()
            }
        }

        if (validated.priority) {
            updateData.priority = validated.priority
            // Recalculate SLA
            const slaMinutes = SLA_DEADLINES[validated.priority]
            updateData.sla_deadline = new Date(Date.now() + slaMinutes * 60 * 1000)
        }

        if (validated.assignedTo !== undefined) {
            updateData.assigned_to = validated.assignedTo
        }

        const ticket = await prisma.supportTicket.update({
            where: { id: validated.ticketId },
            data: updateData
        })

        revalidatePath('/dashboard/support')
        revalidatePath(`/dashboard/support/${validated.ticketId}`)

        return { success: true, data: ticket }

    } catch (error) {
        console.error('Error updating ticket:', error)
        return { success: false, error: 'Error al actualizar el ticket' }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACCIONES DE MENSAJES
// ═══════════════════════════════════════════════════════════════════════════════

export async function sendMessage(data: z.infer<typeof sendMessageSchema>) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const validated = sendMessageSchema.parse(data)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, organization_id: true, role: true }
        })

        if (!user) {
            return { success: false, error: 'Usuario no encontrado' }
        }

        // Determine sender role
        let senderRole = 'client'
        if (user.role === 'admin') senderRole = 'admin'
        else if (user.role === 'technician') senderRole = 'technician'

        // Create message
        const message = await prisma.ticketMessage.create({
            data: {
                ticket_id: validated.ticketId,
                sender_id: user.id,
                sender_role: senderRole,
                content: validated.content,
                is_internal: validated.isInternal,
            }
        })

        // If this is first response from staff, update first_response_at
        if (senderRole !== 'client') {
            await prisma.supportTicket.updateMany({
                where: {
                    id: validated.ticketId,
                    first_response_at: null
                },
                data: {
                    first_response_at: new Date(),
                    status: 'in_analysis' // Auto-change status on first response
                }
            })
        }

        revalidatePath(`/dashboard/support/${validated.ticketId}`)

        // TODO: Trigger Pusher event for real-time updates
        // await pusher.trigger(`ticket-${validated.ticketId}`, 'message:sent', message)

        return { success: true, data: message }

    } catch (error) {
        console.error('Error sending message:', error)
        return { success: false, error: 'Error al enviar el mensaje' }
    }
}

export async function getMessages(ticketId: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado', data: [] }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true }
        })

        const isStaff = user?.role === 'admin' || user?.role === 'technician'

        const messages = await prisma.ticketMessage.findMany({
            where: {
                ticket_id: ticketId,
                // Hide internal notes from clients
                ...(isStaff ? {} : { is_internal: false })
            },
            orderBy: { created_at: 'asc' }
        })

        return { success: true, data: messages }

    } catch (error) {
        console.error('Error fetching messages:', error)
        return { success: false, error: 'Error al obtener mensajes', data: [] }
    }
}

export async function markMessagesAsRead(ticketId: string) {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true }
        })

        if (!user) {
            return { success: false, error: 'Usuario no encontrado' }
        }

        // Mark all unread messages in this ticket as read
        await prisma.ticketMessage.updateMany({
            where: {
                ticket_id: ticketId,
                read_at: null,
                sender_id: { not: user.id } // Don't mark own messages
            },
            data: {
                read_at: new Date()
            }
        })

        return { success: true }

    } catch (error) {
        console.error('Error marking messages as read:', error)
        return { success: false, error: 'Error al marcar como leído' }
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ESTADÍSTICAS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getTicketStats() {
    const session = await auth()
    if (!session?.user) {
        return { success: false, error: 'No autorizado' }
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { organization_id: true }
        })

        if (!user?.organization_id) {
            return { success: false, error: 'Sin organización' }
        }

        const [total, open, inAnalysis, resolved, urgent] = await Promise.all([
            prisma.supportTicket.count({ where: { organization_id: user.organization_id } }),
            prisma.supportTicket.count({ where: { organization_id: user.organization_id, status: 'open' } }),
            prisma.supportTicket.count({ where: { organization_id: user.organization_id, status: 'in_analysis' } }),
            prisma.supportTicket.count({ where: { organization_id: user.organization_id, status: 'resolved' } }),
            prisma.supportTicket.count({ where: { organization_id: user.organization_id, priority: 'urgent', status: { notIn: ['resolved', 'closed'] } } }),
        ])

        return {
            success: true,
            data: { total, open, inAnalysis, resolved, urgent }
        }

    } catch (error) {
        console.error('Error fetching ticket stats:', error)
        return { success: false, error: 'Error al obtener estadísticas' }
    }
}

