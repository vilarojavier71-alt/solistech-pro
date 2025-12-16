import { FileSpreadsheet, Sparkles, MapPin, Calculator, Users, Shield, Receipt, FileText } from 'lucide-react'

export interface HelpTopic {
    id: string
    title: string
    description: string
    category: 'basics' | 'tools' | 'troubleshooting' | 'admin'
    iconName: 'FileSpreadsheet' | 'Sparkles' | 'MapPin' | 'Calculator' | 'Users' | 'Shield' | 'Receipt' | 'FileText'
    steps: string[]
    tips: string[]
    cta: {
        text: string
        link: string
    }
    troubleshooting?: Array<{
        problem: string
        solution: string
    }>
}

export const HELP_TOPICS: HelpTopic[] = [
    {
        id: 'import-excel',
        title: 'Importar Clientes desde Excel',
        description: 'Sube tu archivo y el sistema detecta automáticamente las columnas',
        category: 'tools',
        iconName: 'FileSpreadsheet',
        steps: [
            '1. Ve a "Importar" en el menú lateral',
            '2. Arrastra tu archivo Excel o CSV',
            '3. Revisa la detección automática de columnas',
            '4. Confirma y listo - tus clientes están importados'
        ],
        tips: [
            '✅ Formatos soportados: .xlsx, .xls, .csv',
            '✅ Máximo 10.000 filas por archivo',
            '⚠️ Asegúrate de que la primera fila tiene los nombres de columnas'
        ],
        cta: {
            text: 'Ir a Importar',
            link: '/dashboard/import'
        }
    },
    {
        id: 'ai-presentation',
        title: 'Generar Presentación con IA',
        description: 'Crea una presentación profesional en 1 click',
        category: 'basics',
        iconName: 'Sparkles',
        steps: [
            '1. Abre un proyecto existente',
            '2. Pulsa "Generar Presentación"',
            '3. La IA analiza los datos y crea las diapositivas',
            '4. Descarga el PDF o envíalo por email al cliente'
        ],
        tips: [
            '✅ Incluye: ROI, ahorro anual, gráficos de producción',
            '✅ Personalizado con tu logo y colores corporativos',
            '⚡ Generación en menos de 10 segundos'
        ],
        cta: {
            text: 'Ver Ejemplo',
            link: '/dashboard/projects'
        }
    },
    {
        id: 'gps-troubleshooting',
        title: 'Problemas con el GPS',
        description: 'Soluciones rápidas para el control horario',
        category: 'troubleshooting',
        iconName: 'MapPin',
        steps: [
            '1. Verifica que has dado permisos de ubicación a la app',
            '2. Activa el GPS en los ajustes del móvil',
            '3. Si estás en interior, sal al exterior para mejor señal',
            '4. En modo offline, los fichajes se sincronizan automáticamente'
        ],
        tips: [
            '✅ Precisión típica: 10-50 metros',
            '✅ Funciona offline - se sincroniza al recuperar conexión',
            '⚠️ En tejados metálicos la señal puede ser débil'
        ],
        troubleshooting: [
            {
                problem: '"Ubicación no disponible"',
                solution: 'Ve a Ajustes > Privacidad > Ubicación > Solistech Pro > "Siempre"'
            },
            {
                problem: '"Fuera del área permitida"',
                solution: 'Estás a más de 500m de la obra. Acércate o contacta con tu supervisor.'
            },
            {
                problem: 'Fichajes no se sincronizan',
                solution: 'Verifica tu conexión a internet. Los fichajes están guardados y se subirán automáticamente.'
            }
        ],
        cta: {
            text: 'Configurar GPS',
            link: '/dashboard/time-tracking'
        }
    },
    {
        id: 'solar-calculator',
        title: 'Calculadora Solar Básica',
        description: 'Cómo realizar un estudio de viabilidad rápido',
        category: 'tools',
        iconName: 'Calculator',
        steps: [
            '1. Introduce la dirección del cliente en la calculadora',
            '2. Dibuja el polígono sobre el tejado en el mapa',
            '3. Ajusta el número de paneles y su orientación',
            '4. Obtén la producción estimada y el presupuesto preliminar'
        ],
        tips: [
            '✅ Usa la vista de satélite para mayor precisión',
            '✅ Puedes ajustar el consumo anual del cliente',
            '💡 La inclinación óptima en España suele ser 30-35 grados'
        ],
        cta: {
            text: 'Abrir Calculadora',
            link: '/dashboard/calculator'
        }
    },
    {
        id: 'user-management',
        title: 'Gestión de Usuarios y Roles',
        description: 'Añadir empleados y asignar permisos',
        category: 'admin',
        iconName: 'Users',
        steps: [
            '1. Ve a Administración > Gestión de Usuarios',
            '2. Haz clic en "Invitar Usuario"',
            '3. Introduce el email y selecciona el rol (Comercial, Instalador, etc.)',
            '4. El usuario recibirá un email para establecer su contraseña'
        ],
        tips: [
            '✅ Los roles definen qué puede ver y hacer cada usuario',
            '✅ Puedes desactivar usuarios sin borrarlos',
            '🔒 Solo los administradores pueden gestionar usuarios'
        ],
        cta: {
            text: 'Gestionar Usuarios',
            link: '/dashboard/admin/users'
        }
    }
]
