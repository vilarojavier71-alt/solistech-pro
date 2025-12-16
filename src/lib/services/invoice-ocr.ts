/**
 * Energy Invoice OCR Service
 * Lógica de extracción de datos usando expresiones regulares para CUPS y DNI.
 */

export interface InvoiceData {
    cups: string | null
    holderName: string | null
    holderDni: string | null
    address: string | null
    powers: {
        p1: number | null
        p2: number | null
    }
}

// Regex Patterns
const PATTERNS = {
    // CUPS: ES seguido de 20 o 22 caracteres alfanuméricos
    CUPS: /ES[0-9]{16}[A-Z]{2}[0-9]?[A-Z]?/,

    // DNI/NIE: 8 números + letra o X/Y/Z + 7 números + letra
    DNI: /[0-9]{8}[A-Z]|[XYZ][0-9]{7}[A-Z]/,

    // Potencia: Búsqueda de valores numéricos cercanos a "Potencia" o "kW"
    POWER: /(?:Potencia|Contratada).*?(\d+[.,]\d+)\s*kW/i
}

export function extractInvoiceData(text: string): InvoiceData {
    const cleanText = text.replace(/\s+/g, ' ') // Normalizar espacios

    // 1. Extract CUPS
    const cupsMatch = cleanText.match(PATTERNS.CUPS)
    const cups = cupsMatch ? cupsMatch[0] : null

    // 2. Extract DNI (Simple approach - first valid DNI found)
    const dniMatch = cleanText.match(PATTERNS.DNI)
    const holderDni = dniMatch ? dniMatch[0] : null

    // 3. Extract Powers (Simplificado: busca 2 valores si es posible)
    // En una implementación real, esto requeriría parsing posicional o IA
    const powerMatches = Array.from(cleanText.matchAll(/(?:P[1-6]|Potencia).*?(\d+[.,]\d+)\s*kW/gi))
    const p1 = powerMatches[0] ? parseFloat(powerMatches[0][1].replace(',', '.')) : 0
    const p2 = powerMatches[1] ? parseFloat(powerMatches[1][1].replace(',', '.')) : p1

    // 4. Heurística básica para Nombre y Dirección
    // Esto es muy difícil con solo regex. Normalmente se necesitaría un modelo de IA entrenado.
    // Retornamos null para que el usuario lo rellene manualmente.

    return {
        cups,
        holderDni,
        holderName: null, // Placeholder: OCR avanzado requerido
        address: null,    // Placeholder: OCR avanzado requerido
        powers: {
            p1: p1 || null,
            p2: p2 || null
        }
    }
}
