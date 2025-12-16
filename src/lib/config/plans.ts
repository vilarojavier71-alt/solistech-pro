export const SUBSCRIPTION_PLANS = [
    {
        id: 'basic',
        name: 'Básico',
        description: 'Para autónomos que empiezan',
        price: 0,
        currency: 'EUR',
        features: [
            '1 Usuario',
            'Hasta 5 Clientes',
            'Cálculos Solares Básicos',
            'Gestión de Proyectos Simple'
        ],
        stripePriceId: '', // Gratis
        highlight: false,
        buttonText: 'Tu Plan'
    },
    {
        id: 'starter',
        name: 'Starter',
        description: 'Para pequeñas empresas en crecimiento',
        price: 49,
        currency: 'EUR',
        features: [
            'Hasta 3 Usuarios',
            'Hasta 50 Clientes',
            'Generación de Propuestas PDF',
            'Soporte por Email'
        ],
        stripePriceId: process.env.STRIPE_PRICE_ID_STARTER,
        highlight: false,
        buttonText: 'Elegir Starter'
    },
    {
        id: 'pro',
        name: 'Pro',
        description: 'Para instaladores profesionales establecidos',
        price: 149,
        currency: 'EUR',
        features: [
            'Usuarios Ilimitados',
            'Clientes Ilimitados',
            'SolarBrain AI (Beta)',
            'Gestión de Equipo y Roles',
            'Soporte Prioritario'
        ],
        stripePriceId: process.env.STRIPE_PRICE_ID_PRO,
        highlight: true,
        buttonText: 'Elegir Pro'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Para grandes operadoras y franquicias',
        price: null, // Contactar
        currency: 'EUR',
        features: [
            'Todo lo incluido en Pro',
            'API Dedicada',
            'SLA 99.9%',
            'Gestor de Cuenta Dedicado',
            'Integraciones a Medida'
        ],
        stripePriceId: '', // Contactar ventas
        highlight: false,
        buttonText: 'Contactar'
    }
]
