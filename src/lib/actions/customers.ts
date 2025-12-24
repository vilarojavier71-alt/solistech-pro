'use server'

import { prisma } from '@/lib/db'
import { getCurrentUserWithRole } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Campos que existen en la tabla SQL customers
const SQL_FIELDS = [
    'name',
    'email',
    'phone',
    'nif',
    'address',
    'city',
    'postal_code',
    'province',
    'country',
    'notes'
]

// Schema de validación para actualización
const UpdateClientSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio').max(255).optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    nif: z.string().max(20).optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
    city: z.string().max(100).optional().or(z.literal('')),
    postal_code: z.string().max(10).optional().or(z.literal('')),
    province: z.string().max(100).optional().or(z.literal('')),
    country: z.string().max(100).optional().or(z.literal('')),
    notes: z.string().optional().or(z.literal(''))
})

/**
 * Actualiza un cliente con lógica híbrida SQL/JSONB
 */
export async function updateClient(id: string, input: unknown) {
    try {
        if (!id || typeof id !== 'string') {
            return { success: false, error: 'ID de cliente inválido' }
        }

        const validatedData = UpdateClientSchema.parse(input)

        const user = await getCurrentUserWithRole()
        if (!user) {
            return { success: false, error: 'Sesión expirada. Por favor, inicia sesión de nuevo.' }
        }

        // Obtener cliente actual
        const currentClient = await prisma.customer.findFirst({
            where: {
                id,
                organization_id: user.organizationId
            }
        })

        if (!currentClient) {
            return { success: false, error: 'Cliente no encontrado' }
        }

        // Separar campos SQL vs JSONB
        const sqlFields: Record<string, any> = {}
        const customFields: Record<string, any> = {}

        Object.entries(validatedData).forEach(([key, value]) => {
            // Aplicar corrección de encoding si es string
            const fixedValue = typeof value === 'string' ? fixMojibake(value) : value;

            if (SQL_FIELDS.includes(key)) {
                sqlFields[key] = fixedValue ?? value
            } else {
                customFields[key] = fixedValue ?? value
            }
        })

        // Merge custom_attributes
        const currentCustom = (currentClient.custom_attributes as Record<string, any>) || {}
        const mergedCustom = { ...currentCustom, ...customFields }

        // Update
        const updated = await prisma.customer.update({
            where: { id },
            data: {
                ...sqlFields,
                custom_attributes: mergedCustom,
                updated_at: new Date()
            }
        })

        revalidatePath('/dashboard/customers')

        return { success: true, data: updated, error: null }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message }
        }
        console.error('Unexpected error in updateClient:', error)
        return { success: false, error: 'Ocurrió un error inesperado.' }
    }
}

/**
 * Elimina un cliente (soft delete)
 */
export async function deleteClient(id: string) {
    const user = await getCurrentUserWithRole()
    if (!user) return { error: 'No autenticado' }

    try {
        await prisma.customer.update({
            where: {
                id,
                organization_id: user.organizationId
            },
            data: {
                is_active: false,
                updated_at: new Date()
            }
        })

        revalidatePath('/dashboard/customers')
        return { success: true, error: null }
    } catch (error) {
        console.error('Delete client error:', error)
        return { error: 'Error al eliminar el cliente' }
    }
}

// Schema de validación Zod para creación
const CreateCustomerSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio').max(255),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    nif: z.string().max(20).optional().or(z.literal('')),
    address: z.string().max(500).optional().or(z.literal('')),
    city: z.string().max(255).optional().or(z.literal('')),
    postal_code: z.string().max(10).optional().or(z.literal('')),
    province: z.string().max(255).optional().or(z.literal('')),
    country: z.string().max(255).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
})

/**
 * Crea un nuevo cliente con validación completa
 */
// Helper para corregir codificación corrupta (Mojibake)
function fixMojibake(str: string | undefined | null): string | undefined {
    if (!str) return undefined;
    // Si contiene caracteres típicos de doble codificación UTF-8 -> Latin1
    // Ã (0xC3) es el primer byte de muchos caracteres comunes en español (á, é, í, ó, ú, ñ)
    if (str.includes('Ã') || str.includes('Â')) {
        try {
            // Intenta revertir la interpretación Latin1 de bytes UTF-8
            return Buffer.from(str, 'binary').toString('utf-8');
        } catch (e) {
            return str;
        }
    }
    return str;
}

export async function addNewClient(input: unknown) {
    try {
        const validatedData = CreateCustomerSchema.parse(input)

        const user = await getCurrentUserWithRole()
        if (!user) {
            return { success: false, data: null, error: 'Sesión expirada. Por favor, inicia sesión de nuevo.' }
        }

        // CHECK SUBSCRIPTION LIMIT
        // ========================================================
        const { checkCustomerLimit } = await import('@/lib/actions/subscriptions')
        // Fix: Ensure null becomes undefined for the function call
        const limitCheck = await checkCustomerLimit(user.organizationId || undefined)

        if (!limitCheck.canAdd) {
            return {
                success: false,
                data: null,
                error: `Has llegado al límite de ${limitCheck.maxAllowed} clientes de tu plan gratuito. Actualiza tu cuenta para clientes ilimitados.`
            }
        }
        // ========================================================

        // Separar campos SQL vs JSONB y Saneamiento de Encoding
        const sqlFields: Record<string, any> = {}
        const customFields: Record<string, any> = {}

        Object.entries(validatedData).forEach(([key, value]) => {
            // Aplicar corrección de encoding si es string
            const fixedValue = typeof value === 'string' ? fixMojibake(value) : value;

            if (SQL_FIELDS.includes(key)) {
                sqlFields[key] = fixedValue ?? value // Fallback to original if undefined returned (though fixMojibake returns undefined for undefined)
            } else {
                customFields[key] = fixedValue ?? value
            }
        })

        const newClient = await prisma.customer.create({
            data: {
                ...sqlFields,
                name: fixMojibake(validatedData.name) || validatedData.name, // Explicitly provide name for TS
                organization_id: user.organizationId,
                custom_attributes: Object.keys(customFields).length > 0 ? customFields : undefined,
                created_by: user.id,
            }
        })

        revalidatePath('/dashboard/customers')

        return { success: true, data: newClient, error: null }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, data: null, error: error.issues[0].message }
        }
        console.error('Unexpected error in addNewClient:', error)
        return { success: false, data: null, error: 'Ocurrió un error inesperado.' }
    }
}

// Helper para limpiar objeto cliente completo
function cleanCustomerData(customer: any) {
    if (!customer) return customer

    // Lista de campos de texto susceptibles a corrupción
    const textFields = ['name', 'address', 'city', 'province', 'country', 'notes', 'nif']

    const cleaned = { ...customer }

    textFields.forEach(field => {
        if (typeof cleaned[field] === 'string') {
            cleaned[field] = fixMojibake(cleaned[field])
        }
    })

    return cleaned
}

/**
 * Obtiene todos los clientes de la organización
 */
export async function getCustomers() {
    const user = await getCurrentUserWithRole()
    if (!user) return { data: null, error: 'No autenticado' }

    try {
        const rawData = await prisma.customer.findMany({
            where: {
                organization_id: user.organizationId,
                is_active: true
            },
            orderBy: { created_at: 'desc' }
        })

        const data = rawData.map(cleanCustomerData)

        return { data, error: null }
    } catch (error) {
        console.error('Get customers error:', error)
        return { data: null, error: 'Error al obtener clientes' }
    }
}
