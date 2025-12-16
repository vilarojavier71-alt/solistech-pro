export interface TourStep {
    id: string
    title: string
    content: string
    targetId?: string // CSS selector like [data-tour="settings"]
    route?: string // Specific path required for this step
    position?: 'top' | 'bottom' | 'left' | 'right'
}

export const TOUR_STEPS: TourStep[] = [
    {
        id: 'welcome',
        title: 'Bienvenido a SolisTech Pro',
        content: 'Tu plataforma integral para gestión de proyectos fotovoltaicos. Este breve tour te enseñará lo esencial.',
        // No target -> Modal Center
        route: '/dashboard',
        position: 'bottom'
    },
    {
        id: 'settings',
        targetId: '[data-tour="settings-nav"]',
        title: 'Configuración Vital',
        content: 'Antes de empezar, configura tu Logo y API Keys aquí. Es crucial para los informes automáticos.',
        route: '/dashboard',
        position: 'right'
    },
    {
        id: 'new-sale',
        targetId: '[data-tour="create-project-btn"]',
        title: 'Crea tu Primera Venta',
        content: '¡Manos a la obra! Pulsa aquí para registrar tu primer lead o proyecto desde cero.',
        route: '/dashboard/projects', // Assumes this route exists or we guide them there
        position: 'bottom'
    }
]

export const restartOnboardingTour = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('onboarding_completed')
        window.location.reload()
    }
}
