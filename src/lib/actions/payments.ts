'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export type PaymentMethod = {
    id: string
    name: string
    instructions: string | null
    is_default: boolean
    is_active: boolean
}

const CreatePaymentMethodSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    instructions: z.string().optional()
})

// HELPER: Robust Context Retrieval
async function getPaymentContext() {
    const user = await getCurrentUserWithRole()
    if (!user || !user.id) throw new Error('Usuario no autenticado (Sesión inválida)')

    const supabase = createAdminClient()

    const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) throw new Error('Organización no encontrada para el usuario.')

    return { supabase, organizationId: profile.organization_id }
}

export async function getPaymentMethods() {
    try {
        const { supabase, organizationId } = await getPaymentContext()

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('is_default', { ascending: false }) // Defaults first
            .order('name', { ascending: true })

        if (error) {
            console.error('Error fetching payment methods:', error)
            return []
        }

        return data as PaymentMethod[]
    } catch (error) {
        console.error('Auth error in getPaymentMethods', error)
        return []
    }
}

export async function createPaymentMethod(data: { name: string; instructions?: string }) {
    const validation = CreatePaymentMethodSchema.safeParse(data)
    if (!validation.success) {
        return { error: "Datos inválidos" }
    }

    try {
        const { supabase, organizationId } = await getPaymentContext()

        const { data: newMethod, error } = await supabase
            .from('payment_methods')
            .insert({
                organization_id: organizationId,
                name: validation.data.name,
                instructions: validation.data.instructions || null
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating payment method:', error)
            return { error: error.message }
        }

        revalidatePath('/dashboard/invoices')
        return { data: newMethod as PaymentMethod }
    } catch (error: any) {
        return { error: error.message }
    }
}

