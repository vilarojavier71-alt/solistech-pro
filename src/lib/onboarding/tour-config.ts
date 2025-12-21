export interface TourStep {
    id: string
    title: string
    content: string
    targetId?: string // CSS selector like [data-tour="settings"]
    route?: string // Specific path required for this step
    position?: 'top' | 'bottom' | 'left' | 'right'
}

/**
 * TOUR STEPS - MotorGap Onboarding Tour
 * 
 * Pasos del tour guiado para nuevos usuarios.
 * Los selectores usan data-tour attributes que DEBEN existir en el DOM.
 */
export const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: '¡Bienvenido a MotorGap!',
        content: 'Tu plataforma integral para gestión de proyectos solares fotovoltaicos. Este breve tour te enseñará lo esencial en 2 minutos.',
        route: '/dashboard',
        position: 'bottom'
    },
    {
        id: 'centralita',
        title: 'Tu Centralita de Control',
        content: 'Aquí ves todos tus KPIs de negocio: ingresos, leads, proyectos activos y citas del día. Todo en tiempo real desde tu base de datos.',
        route: '/dashboard',
        position: 'bottom'
    },
    {
        id: 'settings',
        targetId: '[data-tour="settings-nav"]',
        title: 'Configuración Vital',
        content: 'Antes de empezar, configura tu logo y datos de empresa aquí. Es crucial para los informes y facturas automáticas.',
        route: '/dashboard',
        position: 'right'
    },
    {
        id: 'help',
        targetId: '[data-tour="help-nav"]',
        title: 'Centro de Ayuda',
        content: 'Si tienes dudas, aquí encuentras guías rápidas, estado del sistema y puedes abrir tickets de soporte.',
        route: '/dashboard',
        position: 'right'
    },
    {
        id: 'support-ticket',
        title: 'Abrir Ticket de Soporte',
        content: 'Si necesitas ayuda personalizada, puedes abrir un ticket y nuestro equipo te responderá en 24 horas.',
        route: '/dashboard/help',
        position: 'bottom'
    },
    {
        id: 'system-status',
        title: 'Estado del Sistema',
        content: 'Consulta aquí el estado de las APIs externas (Google Solar, Stripe, Email) antes de reportar problemas.',
        route: '/dashboard/help',
        position: 'left'
    }
]

/**
 * Reinicia el tour de onboarding
 * Limpia localStorage y recarga la página
 */
export const restartOnboardingTour = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding_completed')
        localStorage.removeItem('tour_step')
        // Dispatch custom event para que OnboardingTour lo detecte
        window.dispatchEvent(new Event('restart-tour'))
        window.location.href = '/dashboard'
    }
}

/**
 * Marca el tour como completado
 */
export const completeTour = () => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('onboarding_completed', 'true')
    }
}

/**
 * Verifica si el tour ha sido completado
 */
export const isTourCompleted = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('onboarding_completed') === 'true'
    }
    return false
}
