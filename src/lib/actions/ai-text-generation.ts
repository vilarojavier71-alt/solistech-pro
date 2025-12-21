'use server'

import { getDecryptedApiKey } from './organization-settings'

export interface PresentationTextContent {
    executiveSummary: string
    environmentalImpact: string
    financialAnalysis: string
    technicalDetails: string
}

export async function generatePresentationText(
    organizationId: string,
    data: {
        customerName: string
        systemSize: number
        production: number
        savings: number
        roi: number
        location: string
    }
): Promise<PresentationTextContent> {
    try {
        const apiConfig = await getDecryptedApiKey(organizationId)

        // Default content if no API key or error
        const defaultContent = {
            executiveSummary: `Propuesta de instalación solar fotovoltaica para ${data.customerName}. El sistema de ${data.systemSize} kWp generará ${data.production} kWh anuales, cubriendo gran parte de su demanda energética.`,
            environmentalImpact: `Esta instalación evitará la emisión de aproximadamente ${(data.production * 0.4).toFixed(0)} kg de CO2 al año, equivalente a plantar ${(data.production * 0.02).toFixed(0)} árboles.`,
            financialAnalysis: `Con un ahorro estimado de ${data.savings}€ anuales y un ROI del ${data.roi}%, la inversión se amortiza rápidamente, generando beneficios netos durante los 25+ años de vida útil.`,
            technicalDetails: `Instalación de alto rendimiento ubicada en ${data.location}, optimizada para maximizar la captación solar.`
        }

        if (!apiConfig || !apiConfig.apiKey) {
            console.warn('No API key found for text generation, using defaults')
            return defaultContent
        }

        // Use OpenAI if available (or others) - assuming OpenAI for text
        if (apiConfig.provider !== 'openai' && apiConfig.provider !== 'replicate') {
            // For now only OpenAI strictly supported for text in this helper
            return defaultContent
        }

        const apiKey = apiConfig.apiKey

        const prompt = `
        Actúa como un consultor energético experto de la empresa MotorGap.
        Genera 4 textos breves y persuasivos para una propuesta solar comercial:
        1. Resumen Ejecutivo (max 50 palabras): Visión general valorando la independencia energética.
        2. Impacto Ambiental (max 40 palabras): Enfocado en sostenibilidad y reducción de huella de carbono.
        3. Análisis Financiero (max 50 palabras): Destacando el ROI (${data.roi}%) y ahorro anual (${data.savings}€).
        4. Detalles Técnicos (max 40 palabras): Sobre el sistema de ${data.systemSize} kWp en ${data.location}.

        Cliente: ${data.customerName}
        Producción: ${data.production} kWh/año
        
        Formato de respuesta JSON:
        {
            "executiveSummary": "...",
            "environmentalImpact": "...",
            "financialAnalysis": "...",
            "technicalDetails": "..."
        }
        `

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // or gpt-3.5-turbo
                messages: [
                    { role: 'system', content: 'You are a helpful solar energy consultant. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7
            })
        })

        if (!response.ok) {
            console.error('AI Text Generation Error:', await response.text())
            return defaultContent
        }

        const json = await response.json()
        const content = json.choices[0]?.message?.content

        // Clean JSON formatting (sometimes user returns markdown code blocks)
        const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim()

        try {
            const parsed = JSON.parse(cleanContent)
            return {
                executiveSummary: parsed.executiveSummary || defaultContent.executiveSummary,
                environmentalImpact: parsed.environmentalImpact || defaultContent.environmentalImpact,
                financialAnalysis: parsed.financialAnalysis || defaultContent.financialAnalysis,
                technicalDetails: parsed.technicalDetails || defaultContent.technicalDetails
            }
        } catch (e) {
            console.error('Failed to parse AI response', e)
            return defaultContent
        }

    } catch (error) {
        console.error('Error generating presentation text:', error)
        // Fallback to basic template
        return {
            executiveSummary: `Propuesta para ${data.customerName}: Sistema de ${data.systemSize} kWp.`,
            environmentalImpact: `Reducción de emisiones estimada.`,
            financialAnalysis: `ROI: ${data.roi}%. Ahorro: ${data.savings}€.`,
            technicalDetails: `Ubicación: ${data.location}.`
        }
    }
}
