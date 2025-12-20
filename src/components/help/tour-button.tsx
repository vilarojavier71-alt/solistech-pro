'use client'

import { Button } from '@/components/ui/button'
import { PlayCircle } from 'lucide-react'

export function TourButton() {
    const handleStartTour = () => {
        if (typeof window !== 'undefined') {
            // Importar dinámicamente para evitar SSR
            import('@/lib/onboarding/tour-config').then(({ restartOnboardingTour }) => {
                restartOnboardingTour()
            })
        }
    }

    return (
        <div className="bg-gradient-to-r from-cyan-900/30 to-teal-900/30 border border-cyan-700/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-100 mb-1">
                        ¿Primera vez en la plataforma?
                    </h3>
                    <p className="text-sm text-slate-400">
                        Realiza el tour guiado de 2 minutos para conocer las funciones principales
                    </p>
                </div>
                <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700"
                    onClick={handleStartTour}
                >
                    <PlayCircle className="mr-2 size-5" />
                    Iniciar Tour
                </Button>
            </div>
        </div>
    )
}
