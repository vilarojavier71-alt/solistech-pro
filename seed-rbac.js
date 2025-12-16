const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PERMISSIONS = [
    // Operativa Diaria
    { slug: 'dashboard:view', description: 'Ver Dashboard Principal' },
    { slug: 'calendar:view', description: 'Ver Agenda' },
    { slug: 'calendar:manage', description: 'Gestionar Agenda' },

    // Negocio
    { slug: 'projects:view', description: 'Ver Proyectos' },
    { slug: 'projects:manage', description: 'Gestionar Proyectos' },
    { slug: 'crm:view', description: 'Ver CRM/Clientes' },
    { slug: 'crm:manage', description: 'Gestionar CRM/Clientes' },
    { slug: 'inventory:view', description: 'Ver Inventario' },
    { slug: 'inventory:manage', description: 'Gestionar Inventario' },

    // Herramientas
    { slug: 'calculator:use', description: 'Usar Calculadora Solar' },
    { slug: 'solar-brain:use', description: 'Usar SolarBrain AI' },
    { slug: 'import:use', description: 'Usar Importador' },
    { slug: 'time-tracking:view', description: 'Ver Fichajes' },
    { slug: 'time-tracking:manage', description: 'Gestionar Fichajes' },

    // Administración
    { slug: 'finance:view', description: 'Ver Finanzas' },
    { slug: 'finance:manage', description: 'Gestionar Finanzas' },
    { slug: 'settings:view', description: 'Ver Configuración' },
    { slug: 'settings:manage', description: 'Gestionar Configuración' },
    { slug: 'users:view', description: 'Ver Usuarios' },
    { slug: 'users:manage', description: 'Gestionar Usuarios' },
];

const ROLE_PERMISSIONS = {
    'owner': PERMISSIONS.map(p => p.slug), // All permissions
    'admin': PERMISSIONS.map(p => p.slug), // All permissions
    'ingeniero': [
        'dashboard:view',
        'calendar:view', 'calendar:manage',
        'projects:view', 'projects:manage',
        'crm:view',
        'inventory:view',
        'calculator:use',
        'solar-brain:use',
        'time-tracking:view'
    ],
    'comercial': [
        'dashboard:view',
        'calendar:view',
        'crm:view', 'crm:manage',
        'calculator:use',
        'time-tracking:view'
    ],
    'captador_visitas': [
        'dashboard:view',
        'calendar:view',
        'crm:view', // Solo lectura
        'time-tracking:view'
    ],
    'user': [
        'dashboard:view',
        'time-tracking:view'
    ]
};

async function seed() {
    console.log('--- SEEDING PERMISSIONS ---');

    for (const p of PERMISSIONS) {
        await prisma.permissions.upsert({
            where: { slug: p.slug },
            update: { description: p.description },
            create: { slug: p.slug, description: p.description }
        });
        console.log(`Permission ensured: ${p.slug}`);
    }

    console.log('--- MAPPING ROLES ---');

    for (const [role, slugs] of Object.entries(ROLE_PERMISSIONS)) {
        console.log(`Processing role: ${role}`);
        for (const slug of slugs) {
            try {
                // Try create, ignore if unique constraint fails
                await prisma.role_permissions.create({
                    data: { role, permission_slug: slug }
                });
            } catch (e) {
                // Ignore duplicates
            }
        }
    }

    console.log('--- DONE ---');
}

seed()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
