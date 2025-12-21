import { Metadata } from 'next'
import { HelpCenter } from '@/components/help/help-center'
import { TourButton } from '@/components/help/tour-button'
import { SystemStatus } from '@/components/help/system-status'

export const metadata: Metadata = {
    title: 'Centro de Ayuda | MotorGap',
    description: 'Guías rápidas y ayuda contextual',
}

export default function HelpPage() {
    return (
        <div className="container max-w-7xl py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">Centro de Ayuda</h1>
                <p className="text-lg text-muted-foreground">
                    Guías rápidas para las tareas más comunes en MotorGap
                </p>
            </div>

            {/* System Status + Tour Button Row */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <TourButton />
                </div>
                <SystemStatus />
            </div>

            {/* Interactive Help Center */}
            <HelpCenter />

            {/* Additional Resources */}
            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                    Recursos Adicionales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium mb-1">📧 Soporte Técnico</p>
                        <a href="mailto:soporte@motorgap.es" className="text-muted-foreground hover:text-primary transition-colors">
                            soporte@motorgap.es
                        </a>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium mb-1">📚 Documentación</p>
                        <a href="https://motorgap.es/docs" className="text-muted-foreground hover:text-primary transition-colors">
                            motorgap.es/docs
                        </a>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium mb-1">💬 Chat en Vivo</p>
                        <p className="text-muted-foreground">L-V 9:00-18:00</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30">
                        <p className="font-medium mb-1">🎓 Academia</p>
                        <p className="text-muted-foreground">Cursos y tutoriales</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
