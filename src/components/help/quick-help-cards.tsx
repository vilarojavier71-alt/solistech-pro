/**
 * Quick Help Cards
 * 
 * Tarjetas de ayuda rápida para el dashboard.
 * Guías paso a paso para tareas comunes.
 * 
 * @author @PM_DOCU
 * @version 1.0.0
 */

"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronRight, FileSpreadsheet, Sparkles, MapPin } from 'lucide-react'
import Link from 'next/link'

interface HelpCardProps {
    icon: React.ReactNode
    title: string
    description: string
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

export function HelpCard({ icon, title, description, steps, tips, cta, troubleshooting }: HelpCardProps) {
    return (
        <Card className="border-slate-700 bg-slate-900/50 hover:bg-slate-900/70 transition-colors">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="text-cyan-500">
                        {icon}
                    </div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Pasos */}
                <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Pasos:</h4>
                    <ol className="space-y-1.5 text-sm text-slate-400">
                        {steps.map((step, i) => (
                            <li key={i} className="leading-relaxed">{step}</li>
                        ))}
                    </ol>
                </div>

                {/* Tips */}
                <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Tips:</h4>
                    <ul className="space-y-1 text-xs text-slate-400">
                        {tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                        ))}
                    </ul>
                </div>

                {/* Troubleshooting (opcional) */}
                {troubleshooting && troubleshooting.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Problemas comunes:</h4>
                        <div className="space-y-2">
                            {troubleshooting.map((item, i) => (
                                <div key={i} className="text-xs">
                                    <p className="text-amber-400 font-medium">{item.problem}</p>
                                    <p className="text-slate-500 mt-0.5">{item.solution}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter>
                <Button asChild variant="outline" className="w-full group">
                    <Link href={cta.link}>
                        {cta.text}
                        <ChevronRight className="ml-2 size-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

// Tarjetas predefinidas
export const quickHelpCards = [
    {
        id: 'import-excel',
        icon: <FileSpreadsheet className="size-8" />,
        title: 'Importar Clientes desde Excel',
        description: 'Sube tu archivo y el sistema detecta automáticamente las columnas',
        steps: [
            '1. Ve a "Importar" en el menÃº lateral',
            '2. Arrastra tu archivo Excel o CSV',
            '3. Revisa la detección automática de columnas',
            '4. Confirma y listo - tus clientes están importados'
        ],
        tips: [
            'âœ… Formatos soportados: .xlsx, .xls, .csv',
            'âœ… MÃ¡ximo 10.000 filas por archivo',
            'âš ï¸ AsegÃºrate de que la primera fila tiene los nombres de columnas'
        ],
        cta: {
            text: 'Ir a Importar',
            link: '/dashboard/import'
        }
    },

    {
        id: 'ai-presentation',
        icon: <Sparkles className="size-8" />,
        title: 'Generar Presentación con IA',
        description: 'Crea una presentación profesional en 1 click',
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
        icon: <MapPin className="size-8" />,
        title: 'Problemas con el GPS',
        description: 'Soluciones rápidas para el control horario',
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
    }
]

// Componente de lista de tarjetas
export function QuickHelpCardsList() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickHelpCards.map((card) => (
                <HelpCard key={card.id} {...card} />
            ))}
        </div>
    )
}
