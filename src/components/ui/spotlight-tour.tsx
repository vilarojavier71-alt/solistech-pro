'use client'

import React, { useEffect, useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTour } from '@/components/providers/tour-provider'
import { computePosition, offset, shift, arrow, flip, autoUpdate, useFloating } from '@floating-ui/react'
import { X, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react'

export function SpotlightTour() {
    const { isActive, currentStep, nextStep, prevStep, skipTour, currentStepIndex } = useTour()
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [targetEl, setTargetEl] = useState<HTMLElement | null>(null)

    // Floating UI
    const arrowRef = useRef(null)
    const { refs, floatingStyles, middlewareData } = useFloating({
        placement: currentStep?.position || 'bottom',
        middleware: [
            offset(24),
            flip(),
            shift({ padding: 12 }),
            arrow({ element: arrowRef })
        ],
        whileElementsMounted: autoUpdate
    })

    // Target Finder Loop
    useEffect(() => {
        if (!isActive || !currentStep) {
            setTargetRect(null)
            return
        }

        // If 'welcome' step often has no target -> Modal Center logic handled below by null rect
        if (!currentStep.targetId) {
            setTargetRect(null)
            return
        }

        // Polling to find element after route change
        const interval = setInterval(() => {
            const el = document.querySelector(currentStep.targetId!) as HTMLElement
            if (el) {
                setTargetEl(el)
                refs.setReference(el)
                setTargetRect(el.getBoundingClientRect())
                // Don't clear interval immediately if we want to track movement? 
                // Usually autoUpdate handles floating, but spotlight rect needs updates.
                // Let's clear searching interval but set up ResizeObserver ideally.
                clearInterval(interval)
            }
        }, 200)

        return () => clearInterval(interval)
    }, [isActive, currentStep, refs])

    // Update Rect on Window Resize/Scroll if target exists
    useEffect(() => {
        if (!targetEl) return
        const onResize = () => setTargetRect(targetEl.getBoundingClientRect())
        window.addEventListener('resize', onResize)
        window.addEventListener('scroll', onResize, true)
        return () => {
            window.removeEventListener('resize', onResize)
            window.removeEventListener('scroll', onResize, true)
        }
    }, [targetEl])


    if (!isActive || !currentStep) return null

    // Helper to determine if we are in "Modal Mode" (No target) or "Spotlight Mode"
    const isSpotlightMode = !!targetRect

    return (
        <AnimatePresence>
            {/* 1. BACKDROP / SPOTLIGHT */}
            <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none w-screen h-screen">

                {isSpotlightMode ? (
                    // SPOTLIGHT CUTOUT TECHNIQUE: Huge Shadow
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        className="absolute rounded-lg pointer-events-auto"
                        style={{
                            top: targetRect!.top - 8,
                            left: targetRect!.left - 8,
                            width: targetRect!.width + 16,
                            height: targetRect!.height + 16,
                            boxShadow: '0 0 0 9999px rgba(9, 9, 11, 0.85)', // zinc-950/85
                        }}
                    >
                        {/* Optional Parsing Ring/Pulse */}
                        <div className="absolute inset-0 rounded-lg border-2 border-emerald-500/50 animate-pulse" />
                    </motion.div>
                ) : (
                    // MODAL BACKDROP
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm pointer-events-auto"
                    />
                )}


                {/* 2. THE CARD (TOOLTIP / MODAL) */}
                <div
                    ref={refs.setFloating}
                    style={isSpotlightMode ? floatingStyles : {
                        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'
                    }}
                    className="z-[60] pointer-events-auto outline-none"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="w-[380px] bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header Color Line */}
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />

                        <div className="p-6 relative">
                            {/* Icon for non-spotlight steps */}
                            {!isSpotlightMode && (
                                <div className="mb-4 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <Sparkles size={24} />
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-white mb-2">{currentStep.title}</h3>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                {currentStep.content}
                            </p>

                            {/* Controls */}
                            <div className="mt-8 flex items-center justify-between">
                                <button
                                    onClick={skipTour}
                                    className="text-xs font-medium text-zinc-500 hover:text-zinc-300 px-2 py-1 rounded transition-colors"
                                >
                                    Omitir
                                </button>

                                <div className="flex gap-2">
                                    {currentStepIndex > 0 && (
                                        <button
                                            onClick={prevStep}
                                            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                    )}

                                    <button
                                        onClick={nextStep}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                                    >
                                        {currentStepIndex === 2 ? 'Finalizar' : 'Siguiente'}
                                        {currentStepIndex === 2 ? <Check size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-zinc-950 px-6 py-3 flex gap-1.5 border-t border-zinc-800">
                            {[0, 1, 2].map(i => (
                                <div
                                    key={i}
                                    className={`h-1 rounded-full transition-all duration-300 ${i === currentStepIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-zinc-800'}`}
                                />
                            ))}
                        </div>

                    </motion.div>
                </div>

            </div>

        </AnimatePresence>
    )
}
