'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Types
export type PaymentMethod = {
    id: string
    name: string
    instructions: string | null
    is_default: boolean
    is_active: boolean
    details?: any
}

// Schemas
const PaymentMethodSchema = z.object({
    name: z.string().min(1, "El nombre es obligatorio"),
    instructions: z.string().optional(),
    is_default: z.boolean().default(false)
})

// HELPER: Robust Context Retrieval
async function getPaymentSettingsContext() {
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

// Actions

export async function getPaymentMethods() {
    try {
        const { supabase, organizationId } = await getPaymentSettingsContext()

        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
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

export async function createPaymentMethod(data: z.infer<typeof PaymentMethodSchema>) {
    const validation = PaymentMethodSchema.safeParse(data)

    if (!validation.success) {
        return { error: 'Datos inválidos' }
    }

    try {
        const { supabase, organizationId } = await getPaymentSettingsContext()

        const { data: newMethod, error } = await supabase
            .from('payment_methods')
            .insert({
                organization_id: organizationId,
                name: validation.data.name,
                instructions: validation.data.instructions || null,
                is_default: validation.data.is_default
            })
            .select()
            .single()

        if (error) return { error: error.message }

        revalidatePath('/dashboard/settings/finance')
        revalidatePath('/dashboard/invoices')
        return { data: newMethod as PaymentMethod }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updatePaymentMethod(id: string, data: Partial<z.infer<typeof PaymentMethodSchema>>) {
    try {
        const { supabase, organizationId } = await getPaymentSettingsContext()

        const { data: updatedMethod, error } = await supabase
            .from('payment_methods')
            .update({
                name: data.name,
                instructions: data.instructions,
                is_default: data.is_default
            })
            .eq('id', id)
            .eq('organization_id', organizationId) // Security check
            .select()
            .single()

        if (error) return { error: error.message }

        revalidatePath('/dashboard/settings/finance')
        revalidatePath('/dashboard/invoices')
        return { data: updatedMethod as PaymentMethod }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deletePaymentMethod(id: string) {
    try {
        const { supabase, organizationId } = await getPaymentSettingsContext()

        // Soft delete
        const { error } = await supabase
            .from('payment_methods')
            .update({ is_active: false })
            .eq('id', id)
            .eq('organization_id', organizationId)

        if (error) return { error: error.message }

        revalidatePath('/dashboard/settings/finance')
        revalidatePath('/dashboard/invoices')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

