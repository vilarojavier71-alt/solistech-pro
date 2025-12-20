import { Metadata } from 'next'
import { HelpCenter } from '@/components/help/help-center'
import { TourButton } from '@/components/help/tour-button'

export const metadata: Metadata = {
    title: 'Centro de Ayuda | SolisTech PRO',
    description: 'Guías rápidas y ayuda contextual',
}

export default function HelpPage() {
    return (
        <div className="container max-w-7xl py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Centro de Ayuda</h1>
                <p className="text-lg text-slate-400">
                    Guías rápidas para las tareas más comunes en MotorGap
                </p>
            </div>

            {/* Tour Button */}
            <TourButton />

            {/* Interactive Help Center */}
            <HelpCenter />

            {/* Additional Resources */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">
                    Recursos Adicionales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-slate-300 font-medium mb-1">?? Soporte Técnico</p>
                        <p className="text-slate-500">motorgapvilaro@gmail.com</p>
                    </div>
                    <div>
                        <p className="text-slate-300 font-medium mb-1">?? Documentación</p>
                        <p className="text-slate-500">motorgap.es/docs</p>
                    </div>
                    <div>
                        <p className="text-slate-300 font-medium mb-1">?? Chat en Vivo</p>
                        <p className="text-slate-500">Disponible L-V 9:00-18:00</p>
                    </div>
                    <div>
                        <p className="text-slate-300 font-medium mb-1">?? Academia</p>
                        <p className="text-slate-500">Cursos y tutoriales en vídeo</p>
                    </div>
                </div>
            </div>
        </div >
    )
}
