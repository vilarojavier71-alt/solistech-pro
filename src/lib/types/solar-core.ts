/**
 * Constantes y tipos para Solar Core
 * Separado de server actions para permitir importación en cliente
 */

export const SOLAR_PHASES = {
    DRAFT: 'DRAFT',
    PHASE_0A: 'PHASE_0A',      // Venta registrada
    PHASE_0B: 'PHASE_0B',      // Pendiente pago
    PHASE_1_DOCS: 'PHASE_1_DOCS', // Pago recibido, pendiente docs
    PHASE_2_REVIEW: 'PHASE_2_REVIEW', // En revisión ingeniería
    APPROVED: 'APPROVED',       // Aprobado
    CORRECTIONS: 'CORRECTIONS', // Requiere correcciones
    COMPLETED: 'COMPLETED',     // Instalación completada
} as const

export type SolarPhase = typeof SOLAR_PHASES[keyof typeof SOLAR_PHASES]

export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    REFUNDED: 'REFUNDED',
} as const

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

export interface CreateSaleInput {
    clientName: string
    clientEmail: string
    clientDni: string
    clientPhone?: string
    projectName: string
    projectDescription?: string
    totalAmount: number
    installationType?: string
}

export interface ReconcilePaymentInput {
    projectId: string
    amount: number
    transactionRef: string
    paymentMethod?: 'transfer' | 'card' | 'cash'
    notes?: string
}

export interface EngineerReviewInput {
    projectId: string
    verdict: 'OK' | 'REJECT'
    reason?: string
}

// ============================================================================
// INSTALLATION PHASES (Portal Cliente)
// ============================================================================

export const INSTALLATION_PHASES = [
    { phase: 0, name: 'Pendiente', description: 'Proyecto en espera de inicio' },
    { phase: 1, name: 'Pago Inicial', description: 'Señal o anticipo confirmado' },
    { phase: 2, name: 'Diseño Aprobado', description: 'Diseño técnico aceptado por cliente' },
    { phase: 3, name: 'Permisos en Trámite', description: 'Licencias y permisos municipales' },
    { phase: 4, name: 'Material Preparado', description: 'Equipos listos para instalación' },
    { phase: 5, name: 'Instalación', description: 'Montaje físico en curso' },
    { phase: 6, name: 'Legalización', description: 'Registro en distribuidora y PVPC' },
    { phase: 7, name: 'Activación Final', description: 'Sistema operativo y entregado' },
] as const

export const LEGALIZATION_STATUS = {
    pending: 'Pendiente',
    in_progress: 'En Proceso',
    approved: 'Aprobado',
    rejected: 'Rechazado',
} as const
