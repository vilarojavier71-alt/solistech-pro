'use client'

import React, { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useOnboarding } from '@/components/providers/onboarding-provider'
import { computePosition, offset, shift, arrow, flip, autoUpdate, useFloating } from '@floating-ui/react'
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react'

/**
 * SPOTLIGHT OVERLAY & TOOLTIP
 */
export function TourOverlay() {
    const { isActive, currentStep, nextStep, prevStep, skipTour, currentStepIndex } = useOnboarding()
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

    // Floating UI logic
    const arrowRef = useRef(null)
    const { refs, floatingStyles, middlewareData } = useFloating({
        placement: currentStep?.position || 'bottom',
        middleware: [
            offset(16),
            flip(),
            shift({ padding: 10 }),
            arrow({ element: arrowRef })
        ],
        whileElementsMounted: autoUpdate,
    })

    // Find Target Logic
    useEffect(() => {
        if (!isActive || !currentStep) {
            setTargetRect(null)
            setTargetElement(null)
            return
        }

        // If no target (Welcome modal), clear rect
        if (!currentStep.targetId) {
            setTargetRect(null)
            setTargetElement(null)
            return
        }

        // Poll for element (retry for 2 seconds)
        let attempts = 0
        const interval = setInterval(() => {
            const el = document.querySelector(currentStep.targetId!) as HTMLElement
            if (el) {
                setTargetElement(el)
                // Use Floating UI reference
                refs.setReference(el)

                // Get rect for spotlight
                const rect = el.getBoundingClientRect()
                setTargetRect(rect)

                clearInterval(interval)
            } else {
                attempts++
                if (attempts > 20) clearInterval(interval) // 2s timeout
            }
        }, 100)

        return () => clearInterval(interval)

    }, [currentStep, isActive, refs])


    // Update rect on scroll/resize
    useEffect(() => {
        if (!targetElement) return
        const handleResize = () => setTargetRect(targetElement.getBoundingClientRect())
        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleResize, true)
        return () => {
            window.removeEventListener('resize', handleResize)
            window.removeEventListener('scroll', handleResize, true)
        }
    }, [targetElement])


    if (!isActive || !currentStep) return null

    const isLastStep = currentStepIndex === 2 // Hardcoded based on TOUR_STEPS length

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden h-screen w-screen">

                {/* 1. SPOTLIGHT EFFECT using CSS CLIP-PATH or BOX SHADOW */}
                {/* Visual Trick: Huge box shadow around the target hole */}
                {targetRect ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 pointer-events-auto"
                        style={{
                            // "Inverted" spotlight using massive shadow
                            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.75)`,
                            // Position the "hole"
                            top: targetRect.top - 4,
                            left: targetRect.left - 4,
                            width: targetRect.width + 8,
                            height: targetRect.height + 8,
                            borderRadius: '8px',
                            position: 'absolute'
                        }}
                    >
                        {/* This div is the "hole" itself, transparent */}
                    </motion.div>
                ) : (
                    // Fallback full overlay for non-targeted steps (Welcome)
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
                    />
                )}

                {/* 2. FLOATING TOOLTIP */}
                <div
                    ref={refs.setFloating}
                    style={targetRect ? floatingStyles : {
                        // Center if no target
                        top: '50%', left: '50%', transform: 'translate(-50%, -50%)', position: 'fixed'
                    }}
                    className="pointer-events-auto z-[60] outline-none"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-[350px] bg-slate-900/90 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl p-6 relative overflow-hidden"
                    >
                        {/* Decorative glow */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-400 to-blue-500" />

                        <div className="mb-4">
                            <h3 className="text-lg font-bold text-white mb-2">{currentStep.title}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">{currentStep.content}</p>
                        </div>

                        <div className="flex items-center justify-between mt-6">
                            <button
                                onClick={skipTour}
                                className="text-slate-500 hover:text-slate-300 text-xs font-medium px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                            >
                                Omitir
                            </button>

                            <div className="flex items-center gap-2">
                                {currentStepIndex > 0 && (
                                    <button
                                        onClick={prevStep}
                                        className="p-2 text-slate-300 hover:bg-slate-800 rounded-full transition-colors"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={nextStep}
                                    className="px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-lg text-sm font-semibold shadow-lg shadow-teal-900/50 flex items-center gap-2 transition-all"
                                >
                                    {isLastStep ? (
                                        <>Finalizar <Check size={14} /></>
                                    ) : (
                                        <>Siguiente <ChevronRight size={14} /></>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Page indicator */}
                        <div className="absolute bottom-6 left-6 flex gap-1.5">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${i === currentStepIndex ? 'w-6 bg-teal-400' : 'w-1.5 bg-slate-700'}`}
                                />
                            ))}
                        </div>

                    </motion.div>
                </div>

            </div>
        </AnimatePresence>
    )
}
