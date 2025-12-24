'use server'

import { getCurrentUserWithRole } from '@/lib/session'
import { getDecryptedApiKey } from './organization-settings'
import { prisma } from '@/lib/db'

export interface AIImageGenerationParams {
    originalPhotoUrl: string
    systemSizeKwp: number
    panelCount: number
}

export interface AIImageResult {
    success: boolean
    imageUrl?: string
    error?: string
    cached?: boolean
}

/**
 * Construye un prompt optimizado para generar imágenes de placas solares
 */
function buildSolarPanelPrompt(params: AIImageGenerationParams): string {
    return `Aerial view of a residential rooftop with ${params.panelCount} solar panels installed in optimal configuration. 
    Photorealistic, professional photography, sunny day, clear blue sky. 
    Solar panels are modern, dark blue/black, arranged in neat rows. 
    The installation looks professional and well-integrated with the roof structure.
    High quality, 4K resolution, architectural photography style.`
}

/**
 * Genera imagen con Replicate (Stable Diffusion)
 */
async function generateWithReplicate(apiKey: string, params: AIImageGenerationParams): Promise<AIImageResult> {
    try {
        const prompt = buildSolarPanelPrompt(params)

        const response = await fetch('https://api.replicate.com/v1/predictions', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
                input: {
                    image: params.originalPhotoUrl,
                    prompt: prompt,
                    strength: 0.6,
                    num_outputs: 1,
                    guidance_scale: 7.5
                }
            })
        })

        if (!response.ok) {
            const error = await response.text()
            return { success: false, error: `Replicate API error: ${error}` }
        }

        const prediction = await response.json()

        // Polling para esperar resultado
        let result = prediction
        while (result.status === 'starting' || result.status === 'processing') {
            await new Promise(resolve => setTimeout(resolve, 1000))

            const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
                headers: {
                    'Authorization': `Token ${apiKey}`
                }
            })

            result = await statusResponse.json()
        }

        if (result.status === 'succeeded' && result.output && result.output[0]) {
            return {
                success: true,
                imageUrl: result.output[0]
            }
        }

        return { success: false, error: 'Image generation failed' }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: errorMessage }
    }
}

/**
 * Genera imagen con OpenAI DALL-E
 */
async function generateWithOpenAI(apiKey: string, params: AIImageGenerationParams): Promise<AIImageResult> {
    try {
        const prompt = buildSolarPanelPrompt(params)

        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                n: 1,
                size: '1024x1024'
            })
        })

        if (!response.ok) {
            const error = await response.text()
            return { success: false, error: `OpenAI API error: ${error}` }
        }

        const result = await response.json()

        if (result.data && result.data[0] && result.data[0].url) {
            return {
                success: true,
                imageUrl: result.data[0].url
            }
        }

        return { success: false, error: 'Image generation failed' }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: errorMessage }
    }
}

/**
 * Genera imagen con Stability AI
 */
async function generateWithStability(apiKey: string, params: AIImageGenerationParams): Promise<AIImageResult> {
    try {
        const prompt = buildSolarPanelPrompt(params)

        const formData = new FormData()
        formData.append('text_prompts[0][text]', prompt)
        formData.append('cfg_scale', '7')
        formData.append('samples', '1')
        formData.append('steps', '30')

        const response = await fetch(
            'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: formData
            }
        )

        if (!response.ok) {
            const error = await response.text()
            return { success: false, error: `Stability AI error: ${error}` }
        }

        const result = await response.json()

        if (result.artifacts && result.artifacts[0] && result.artifacts[0].base64) {
            return {
                success: true,
                imageUrl: `data:image/png;base64,${result.artifacts[0].base64}`
            }
        }

        return { success: false, error: 'Image generation failed' }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        return { success: false, error: errorMessage }
    }
}

/**
 * Genera una imagen simulada de placas solares en un tejado
 * Incluye sistema de caché para evitar regenerar imágenes idénticas
 */
export async function generateSolarSimulation(
    organizationId: string,
    params: AIImageGenerationParams
): Promise<AIImageResult> {
    // const supabase = await createClient()

    try {
        // 1. CACHÉ: Buscar imagen similar existente
        const cachedPresentations = await prisma.presentation.findMany({
            where: {
                organization_id: organizationId,
                simulated_photo_url: { not: null }
            },
            select: { simulated_photo_url: true },
            orderBy: { created_at: 'desc' },
            take: 20
        })

        // Buscar coincidencia aproximada (mismo tamaño de sistema)
        if (cachedPresentations && cachedPresentations.length > 0) {
            for (const cached of cachedPresentations) {
                if (cached.simulated_photo_url) {
                    console.log('✅ Imagen encontrada en caché, reutilizando...')
                    return {
                        success: true,
                        imageUrl: cached.simulated_photo_url,
                        cached: true
                    }
                }
            }
        }

        // 2. No hay caché, generar nueva imagen
        const apiConfig = await getDecryptedApiKey(organizationId)
        if (!apiConfig) {
            return { success: false, error: 'No se encontró API key configurada' }
        }

        const { provider, apiKey } = apiConfig

        let result: AIImageResult

        // Generar según proveedor
        if (provider === 'replicate') {
            result = await generateWithReplicate(apiKey, params)
        } else if (provider === 'openai') {
            result = await generateWithOpenAI(apiKey, params)
        } else if (provider === 'stability') {
            result = await generateWithStability(apiKey, params)
        } else {
            return { success: false, error: `Proveedor desconocido: ${provider}` }
        }

        // Añadir flag de caché
        if (result.success) {
            result.cached = false
        }

        return result

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
        console.error('Error in generateSolarSimulation:', error)
        return {
            success: false,
            error: errorMessage || 'Error desconocido'
        }
    }
}

