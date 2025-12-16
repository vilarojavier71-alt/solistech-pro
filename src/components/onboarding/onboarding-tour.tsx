'use client'

import React, { useState, useEffect } from 'react'
import { X, Sparkles, Settings, Plus } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface OnboardingStep {
    title: string
    description: string
    icon: React.ReactNode
    highlightSelector?: string
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        title: '¡Bienvenido a Solistech Pro!',
        description: 'Tu plataforma integral para gestionar proyectos fotovoltaicos. Vamos a hacer un recorrido rápido por las funciones principales.',
        icon: <Sparkles className="h-8 w-8 text-teal-400" />
    },
    {
        title: 'Configuración Inicial',
        description: 'Configura tus API Keys (OpenAI, Replicate) y personaliza tu logo empresarial desde el menú de Configuración. Esto te permitirá generar presentaciones y documentos automáticos.',
        icon: <Settings className="h-8 w-8 text-teal-400" />,
        highlightSelector: '[data-onboarding="settings-menu"]'
    },
    {
        title: 'Crea tu Primera Venta',
        description: 'Haz clic en "Nueva Venta" para comenzar. Podrás importar datos desde Excel, calcular ROI, gestionar subvenciones y generar presentaciones profesionales.',
        icon: <Plus className="h-8 w-8 text-teal-400" />,
        highlightSelector: '[data-onboarding="new-sale-button"]'
    }
]

/**
 * @FRONTEND_COORD - Componente de Onboarding Tour
 * Muestra un tour guiado para usuarios nuevos (sin proyectos)
 * Lógica: Se activa si user.projects.length === 0 y no se ha completado antes
 */
export function OnboardingTour() {
    const [isOpen, setIsOpen] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [shouldShow, setShouldShow] = useState(false)

    useEffect(() => {
        // Verificar si el onboarding ya fue completado
        const completed = localStorage.getItem('onboarding_completed')

        // TODO: @BACKEND_COORD - Integrar con Server Action shouldShowOnboarding()
        // const hasProjects = await shouldShowOnboarding()
        // Por ahora, simulamos que es un usuario nuevo
        const hasProjects = false

        if (!completed && !hasProjects) {
            setShouldShow(true)
            setIsOpen(true)
        }
    }, [])

    const handleNext = () => {
        if (currentStep < ONBOARDING_STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleComplete()
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleSkip = () => {
        localStorage.setItem('onboarding_completed', 'true')
        setIsOpen(false)
    }

    const handleComplete = () => {
        localStorage.setItem('onboarding_completed', 'true')
        setIsOpen(false)
    }

    if (!shouldShow) return null

    const step = ONBOARDING_STEPS[currentStep]
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

    return (
        <>
            {/* Overlay para highlight de elementos */}
            {step.highlightSelector && isOpen && (
                <div className="fixed inset-0 z-40 pointer-events-none">
                    {/* TODO: Implementar lógica de highlight con step.highlightSelector */}
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent
                    className={cn(
                        'sm:max-w-md',
                        // @FRONTEND_DISENOUI - Estilo Dark Industrial Premium
                        'bg-slate-900/95 backdrop-blur-xl',
                        'border border-slate-700',
                        'shadow-2xl shadow-black/40'
                    )}
                >
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {step.icon}
                                <DialogTitle className="text-xl text-slate-100">
                                    {step.title}
                                </DialogTitle>
                            </div>
                            <button
                                onClick={handleSkip}
                                className="text-slate-400 hover:text-slate-200 transition-colors"
                                aria-label="Cerrar tour"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <DialogDescription className="text-slate-300 text-base leading-relaxed pt-4">
                            {step.description}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Progress indicator */}
                    <div className="flex gap-2 mt-4">
                        {ONBOARDING_STEPS.map((_, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'h-1.5 flex-1 rounded-full transition-all duration-300',
                                    index === currentStep
                                        ? 'bg-teal-400'
                                        : index < currentStep
                                            ? 'bg-teal-600'
                                            : 'bg-slate-700'
                                )}
                            />
                        ))}
                    </div>

                    {/* Navigation buttons */}
                    <div className="flex items-center justify-between mt-6">
                        <Button
                            variant="ghost"
                            onClick={handleSkip}
                            className="text-slate-400 hover:text-slate-200"
                        >
                            Saltar Tour
                        </Button>

                        <div className="flex gap-2">
                            {!isFirstStep && (
                                <Button
                                    variant="outline"
                                    onClick={handlePrevious}
                                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                                >
                                    Anterior
                                </Button>
                            )}
                            <Button
                                onClick={handleNext}
                                className="bg-teal-600 hover:bg-teal-700 text-white"
                            >
                                {isLastStep ? 'Finalizar' : 'Siguiente'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
