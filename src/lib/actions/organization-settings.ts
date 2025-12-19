'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Función simple de encriptación (en producción usar crypto más robusto)
function encryptApiKey(apiKey: string): string {
    // Por ahora, simple Base64 (MEJORAR en producción con AES-256)
    return Buffer.from(apiKey).toString('base64')
}

function decryptApiKey(encrypted: string): string {
    return Buffer.from(encrypted, 'base64').toString('utf-8')
}

// Validar API key según el proveedor
async function validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
        if (provider === 'replicate') {
            // Test con Replicate API
            const response = await fetch('https://api.replicate.com/v1/models', {
                headers: {
                    'Authorization': `Token ${apiKey}`,
                }
            })
            return response.ok
        } else if (provider === 'openai') {
            // Test con OpenAI API
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                }
            })
            return response.ok
        } else if (provider === 'stability') {
            // Test con Stability AI API
            const response = await fetch('https://api.stability.ai/v1/user/account', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                }
            })
            return response.ok
        }
        return false
    } catch (error) {
        console.error('Error validating API key:', error)
        return false
    }
}

// Obtener configuración de la organización
export async function getOrganizationSettings() {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    try {
        const user = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) return { error: 'Usuario sin organización' }

        const settings = await prisma.organization_settings.findUnique({
            where: { organization_id: user.organization_id }
        })

        // Si no existe configuración, retornar valores por defecto
        if (!settings) {
            return {
                data: {
                    ai_provider: null,
                    ai_api_key_valid: false,
                    presentation_template: 'ebro-solar',
                    default_fiscal_deduction: '40'
                }
            }
        }

        // No devolver la API key encriptada al cliente
        return {
            data: {
                ...settings,
                ai_api_key_encrypted: undefined, // No exponer la key
                has_api_key: !!settings.ai_api_key_encrypted
            }
        }

    } catch (error) {
        console.error('Error fetching settings:', error)
        return { error: 'Error al cargar configuración' }
    }
}

// Guardar/actualizar configuración de API
export async function saveOrganizationApiKey(
    provider: string,
    apiKey: string
) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    try {
        const user = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) return { error: 'Usuario sin organización' }

        // Validar la API key
        const isValid = await validateApiKey(provider, apiKey)

        if (!isValid) {
            return { error: 'API key inválida. Verifica que sea correcta.' }
        }

        // Encriptar la API key
        const encryptedKey = encryptApiKey(apiKey)

        // Upsert (Insert or Update)
        await prisma.organization_settings.upsert({
            where: { organization_id: user.organization_id },
            update: {
                ai_provider: provider,
                ai_api_key_encrypted: encryptedKey,
                ai_api_key_valid: true,
                ai_api_key_last_validated: new Date()
            },
            create: {
                organization_id: user.organization_id,
                ai_provider: provider,
                ai_api_key_encrypted: encryptedKey,
                ai_api_key_valid: true,
                ai_api_key_last_validated: new Date()
            }
        })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Error saving API key:', error)
        return { error: (error as Error).message || 'Error desconocido' }
    }
}

// Actualizar preferencias de presentaciones
export async function updatePresentationSettings(
    template: string,
    defaultFiscalDeduction: string
) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    try {
        const user = await prisma.User.findUnique({
            where: { id: session.user.id },
            select: { organization_id: true }
        })

        if (!user?.organization_id) return { error: 'Usuario sin organización' }

        await prisma.organization_settings.upsert({
            where: { organization_id: user.organization_id },
            update: {
                presentation_template: template,
                default_fiscal_deduction: defaultFiscalDeduction
            },
            create: {
                organization_id: user.organization_id,
                presentation_template: template,
                default_fiscal_deduction: defaultFiscalDeduction
            }
        })

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        return { error: (error as Error).message }
    }
}

// Obtener API key desencriptada (solo para uso interno del servidor)
export async function getDecryptedApiKey(organizationId: string) {
    // Nota: Esta función asume que el caller ya verificó permisos
    // O es llamada server-side por proceso seguro.

    try {
        const data = await prisma.organization_settings.findUnique({
            where: { organization_id: organizationId },
            select: {
                ai_provider: true,
                ai_api_key_encrypted: true,
                ai_api_key_valid: true
            }
        })

        if (!data || !data.ai_api_key_encrypted || !data.ai_api_key_valid) {
            return null
        }

        return {
            provider: data.ai_provider,
            apiKey: decryptApiKey(data.ai_api_key_encrypted)
        }
    } catch (error) {
        console.error('Error decrypting API key:', error)
        return null
    }
}
