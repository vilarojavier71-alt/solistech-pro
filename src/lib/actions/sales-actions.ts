'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { notifyNewSale } from '@/lib/actions/notifications'

// --- Data Fetching ---

export async function getCustomersForSelect() {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: [], error: 'No autenticado' }

    try {
        // Fix 1: Select name instead of full_name, nif instead of dni
        const customers = await prisma.customer.findMany({
            where: { organization_id: user.organizationId, is_active: true },
            select: { id: true, name: true, nif: true },
            orderBy: { name: 'asc' }
        })
        // Map back to expected props if frontend needs "full_name" or "dni"
        const mapped = customers.map(c => ({
            id: c.id,
            full_name: c.name,
            dni: c.nif
        }))
        return { data: mapped }
    } catch (e) {
        return { data: [], error: 'Error al obtener clientes' }
    }
}

export async function getTeamForSelect(roles: string[]) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { data: [], error: 'No autenticado' }

    try {
        const team = await prisma.user.findMany({
            where: {
                role: { in: roles },
                organization_id: user.organizationId // ✅ FIXED: Enforce tenant isolation
            },
            select: { id: true, full_name: true, role: true },
            orderBy: { full_name: 'asc' }
        })
        return { data: team }
    } catch (e) {
        return { data: [], error: 'Error al obtener equipo' }
    }
}

// --- Mutations ---

export async function createCustomerAction(data: any) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { success: false, error: 'No autenticado' }

    try {
        const newCustomer = await prisma.customer.create({
            data: {
                organization_id: user.organizationId,
                name: data.full_name,
                nif: data.dni,
                email: data.email,
                phone: data.phone,
                address: data.address,
                status: 'active',
                created_by: user.id
            }
        })
        // Map back
        const result = {
            ...newCustomer,
            full_name: newCustomer.name,
            dni: newCustomer.nif
        }
        return { success: true, data: result }
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al crear cliente' }
    }
}

export async function createSaleAction(data: any) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { success: false, error: 'No autenticado' }

    try {
        const newSale = await prisma.sale.create({
            data: {
                organization_id: user.organizationId,
                customer_id: data.customer_id,
                customer_name: data.customer_name,
                dni: data.dni,
                customer_email: data.customer_email,
                customer_phone: data.customer_phone,
                sale_number: data.sale_number,
                amount: data.amount,
                material: data.material,
                created_by: user.id,
                sale_date: new Date(),
                payment_method: data.payment_method,
                payment_terms: data.payment_terms || 'fractioned',
                payment_status: 'pending',
                documentation_status: 'pending',
                engineering_status: 'pending',
                process_status: 'not_started',
                installation_status: 'pending',
                documentation_notes: data.documentation_notes,
                canvasser_id: data.canvasser_id !== 'none' ? data.canvasser_id : null
            }
        })

        if (data.customer_email) {
            notifyNewSale(data.customer_email, data.customer_name, data.sale_number)
                .catch(console.error)
        }

        revalidatePath('/dashboard/sales')
        return { success: true, data: newSale }

    } catch (e: any) {
        console.error('Error creating sale:', e)
        return { success: false, error: e.message || 'Error al crear venta' }
    }
}

export async function createVisitAction(data: any) {
    const user = await getCurrentUserWithRole()
    if (!user || !user.organizationId) return { success: false, error: 'No autenticado' }

    try {
        await prisma.appointment.create({
            data: {
                organization_id: user.organizationId,
                title: data.title,
                description: data.description,
                start_time: data.start_time,
                end_time: data.end_time,
                customer_id: data.customer_id,
                assigned_to: data.assigned_to,
                created_by: user.id,
                address: data.address,
                status: 'scheduled'
            }
        })

        revalidatePath('/dashboard/calendar')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || 'Error al agendar visita' }
    }
}

