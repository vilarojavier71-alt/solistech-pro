/**
 * Solar Status Mapper - "Translator" de estados DB a UI amigable
 * Convierte estados complejos de base de datos a una UI simple de 4 pasos
 * 
 * @module utils/solar-status-mapper
 */

// Estados de fase solar
export const SOLAR_PHASES = {
    DRAFT: 'DRAFT',
    PHASE_0A: 'PHASE_0A',
    PHASE_0B: 'PHASE_0B',
    PHASE_1_DOCS: 'PHASE_1_DOCS',
    PHASE_2_REVIEW: 'PHASE_2_REVIEW',
    APPROVED: 'APPROVED',
    CORRECTIONS: 'CORRECTIONS',
    COMPLETED: 'COMPLETED',
} as const

export type SolarPhase = typeof SOLAR_PHASES[keyof typeof SOLAR_PHASES]

export interface UIState {
    currentStep: 1 | 2 | 3 | 4
    uiState: 'idle' | 'loading' | 'error' | 'success'
    message: string
    description: string
    percentComplete: number
    isBlinking: boolean
    color: string
    icon: string
}

/**
 * Mapea fase solar de DB a estado UI amigable (Domino's Tracker style)
 * 
 * Pasos visuales:
 * 1. Venta Confirmada
 * 2. Validación de Pago
 * 3. Estudio Técnico
 * 4. Instalación
 */
export function mapSolarPhaseToUI(phase: string, paymentStatus?: string): UIState {
    const normalizedPhase = phase.toUpperCase()

    const phaseMap: Record<string, UIState> = {
        // Paso 1: Venta Confirmada
        [SOLAR_PHASES.DRAFT]: {
            currentStep: 1,
            uiState: 'loading',
            message: 'Procesando tu solicitud',
            description: 'Estamos preparando tu presupuesto personalizado',
            percentComplete: 10,
            isBlinking: true,
            color: 'blue',
            icon: '📝'
        },
        [SOLAR_PHASES.PHASE_0A]: {
            currentStep: 1,
            uiState: 'success',
            message: '¡Venta Confirmada!',
            description: 'Tu proyecto solar ha sido registrado correctamente',
            percentComplete: 25,
            isBlinking: false,
            color: 'green',
            icon: '✅'
        },

        // Paso 2: Validación de Pago
        [SOLAR_PHASES.PHASE_0B]: {
            currentStep: 2,
            uiState: 'loading',
            message: 'Validando tu pago',
            description: 'Estamos verificando la recepción de tu anticipo',
            percentComplete: 35,
            isBlinking: true,
            color: 'amber',
            icon: '💳'
        },

        // Paso 3: Estudio Técnico
        [SOLAR_PHASES.PHASE_1_DOCS]: {
            currentStep: 3,
            uiState: 'idle',
            message: 'Documentación requerida',
            description: 'Necesitamos algunos documentos para continuar',
            percentComplete: 50,
            isBlinking: false,
            color: 'blue',
            icon: '📄'
        },
        [SOLAR_PHASES.PHASE_2_REVIEW]: {
            currentStep: 3,
            uiState: 'loading',
            message: 'En revisión técnica',
            description: 'Nuestro equipo de ingeniería está analizando tu proyecto',
            percentComplete: 65,
            isBlinking: true,
            color: 'purple',
            icon: '🔍'
        },
        [SOLAR_PHASES.CORRECTIONS]: {
            currentStep: 3,
            uiState: 'error',
            message: 'Documentación rechazada',
            description: 'Algunos documentos necesitan ser corregidos',
            percentComplete: 55,
            isBlinking: true,
            color: 'red',
            icon: '⚠️'
        },

        // Paso 4: Instalación
        [SOLAR_PHASES.APPROVED]: {
            currentStep: 4,
            uiState: 'loading',
            message: 'Proyecto Aprobado',
            description: 'Coordinando la instalación de tus paneles solares',
            percentComplete: 85,
            isBlinking: true,
            color: 'green',
            icon: '🏗️'
        },
        [SOLAR_PHASES.COMPLETED]: {
            currentStep: 4,
            uiState: 'success',
            message: '¡Instalación Completada!',
            description: 'Tu sistema solar está operativo. ¡Bienvenido a la energía limpia!',
            percentComplete: 100,
            isBlinking: false,
            color: 'green',
            icon: '☀️'
        },
    }

    // Default si no se reconoce la fase
    return phaseMap[normalizedPhase] || {
        currentStep: 1,
        uiState: 'idle',
        message: 'Estado desconocido',
        description: 'Contacta con tu asesor para más información',
        percentComplete: 0,
        isBlinking: false,
        color: 'gray',
        icon: '❓'
    }
}

/**
 * Obtiene la lista de pasos para el tracker visual
 */
export function getTrackerSteps() {
    return [
        { step: 1, name: 'Venta', icon: '🛒', description: 'Presupuesto confirmado' },
        { step: 2, name: 'Pago', icon: '💳', description: 'Anticipo validado' },
        { step: 3, name: 'Técnico', icon: '📋', description: 'Documentación y diseño' },
        { step: 4, name: 'Instalación', icon: '⚡', description: 'Paneles en tu tejado' },
    ]
}

/**
 * Mapea estado de documento a UI
 */
export function mapDocumentStatusToUI(status: string) {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
        'PENDING': { label: 'Pendiente', color: 'gray', icon: '⏳' },
        'UPLOADED': { label: 'Subido', color: 'blue', icon: '📤' },
        'REJECTED': { label: 'Rechazado', color: 'red', icon: '❌' },
        'APPROVED': { label: 'Aprobado', color: 'green', icon: '✅' },
    }
    return statusMap[status.toUpperCase()] || statusMap['PENDING']
}

/**
 * Obtiene los tipos de documentos requeridos
 */
export function getRequiredDocumentTypes() {
    return [
        { type: 'DNI', label: 'DNI/NIE', required: true, description: 'Documento de identidad del titular' },
        { type: 'FACTURA_LUZ', label: 'Factura de Luz', required: true, description: 'Última factura eléctrica' },
        { type: 'CONTRATO', label: 'Contrato Firmado', required: true, description: 'Contrato de instalación' },
        { type: 'CIE', label: 'CIE/CUPS', required: false, description: 'Certificado de instalación' },
    ]
}
