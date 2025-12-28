import { Metadata } from 'next'
import { DynamicHelpCenter } from '@/components/help/dynamic-help-center'
import { TourButton } from '@/components/help/tour-button'
import { SystemStatus } from '@/components/help/system-status'

export const metadata: Metadata = {
    title: 'Centro de Ayuda Inteligente | MotorGap',
    description: 'Guías, tutoriales y asistente IA.',
}

export default function HelpPage() {
    return (
        <div className="container max-w-[1600px] h-full py-8 space-y-6 flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h1>
                    <p className="text-muted-foreground">
                        Documentación viva y asistencia inteligente.
                    </p>
                </div>
                <div className="flex gap-3">
                    <TourButton />
                    <SystemStatus />
                </div>
            </div>

            {/* Main Content */}
            <DynamicHelpCenter />
        </div>
    )
}
