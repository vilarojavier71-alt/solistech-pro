/**
 * Feature Flags System
 * Control centralizado de características en producción.
 * Uso: if (isFeatureEnabled('SOLAR_CORE_V2')) { ... }
 */

export type FeatureFlag =
    | 'SOLAR_CORE_V2'
    | 'AI_CHAT'
    | 'CLIENT_PORTAL'
    | 'MAGIC_LINKS'
    | 'STORAGE_V2'

interface FeatureFlagConfig {
    enabled: boolean
    percentage?: number // Para rollout gradual (0-100)
    allowedEmails?: string[] // Beta testers
    description: string
}

const FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
    SOLAR_CORE_V2: {
        enabled: process.env.ENABLE_SOLAR_CORE_V2 === 'true',
        percentage: parseInt(process.env.SOLAR_CORE_ROLLOUT_PERCENT || '0'),
        description: 'Nuevo módulo Solar Core con transacciones ACID'
    },
    AI_CHAT: {
        enabled: process.env.ENABLE_AI_CHAT === 'true',
        description: 'Asistente AI en portal del cliente'
    },
    CLIENT_PORTAL: {
        enabled: process.env.ENABLE_CLIENT_PORTAL === 'true',
        description: 'Portal del cliente con seguimiento de proyecto'
    },
    MAGIC_LINKS: {
        enabled: process.env.ENABLE_MAGIC_LINKS === 'true',
        description: 'Login sin contraseña para clientes'
    },
    STORAGE_V2: {
        enabled: process.env.STORAGE_PROVIDER !== 'supabase',
        description: 'Nuevo sistema de storage (S3/R2)'
    }
}

/**
 * Verificar si una feature está habilitada
 * @param flag Nombre del feature flag
 * @param userId ID de usuario para rollout gradual (opcional)
 */
export function isFeatureEnabled(flag: FeatureFlag, userId?: string): boolean {
    const config = FLAGS[flag]

    if (!config) {
        console.warn(`[FeatureFlags] Unknown flag: ${flag}`)
        return false
    }

    // Si está completamente deshabilitado
    if (!config.enabled) {
        return false
    }

    // Si hay rollout gradual por porcentaje
    if (config.percentage !== undefined && config.percentage < 100 && userId) {
        // Hash simple del userId para distribución consistente
        const hash = userId.split('').reduce((a, b) => {
            a = ((a << 5) - a) + b.charCodeAt(0)
            return a & a
        }, 0)
        const userPercent = Math.abs(hash % 100)
        return userPercent < config.percentage
    }

    return true
}

/**
 * Obtener estado de todos los flags (para dashboard admin)
 */
export function getAllFlags(): Record<FeatureFlag, FeatureFlagConfig> {
    return FLAGS
}

/**
 * Log de flags activos al iniciar
 */
export function logActiveFlags(): void {
    console.log('🏁 Feature Flags Status:')
    for (const [flag, config] of Object.entries(FLAGS)) {
        const status = config.enabled ? '✅' : '❌'
        const percent = config.percentage !== undefined ? ` (${config.percentage}%)` : ''
        console.log(`   ${status} ${flag}${percent}: ${config.description}`)
    }
}
