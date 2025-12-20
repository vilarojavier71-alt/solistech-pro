'use client'

import React, { useState } from 'react'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

// ============================================
// TYPES
// ============================================

export interface LoadingStep {
    label: string
    duration?: number
}

export interface LoadingStatePremiumProps {
    type?: 'spinner' | 'skeleton' | 'progress' | 'narrative'
    steps?: LoadingStep[]
    currentStep?: number
    progress?: number
    message?: string
    className?: string
}

// ============================================
// LOADING STATE PREMIUM COMPONENT
// ============================================

export function LoadingStatePremium({
    type = 'spinner',
    steps,
    currentStep = 0,
    progress,
    message,
    className
}: LoadingStatePremiumProps) {
    if (type === 'spinner') {
        return (
            <div className={cn('flex flex-col items-center justify-center p-12 space-y-4', className)}>
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-navy-700 border-t-teal-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-teal-500/20 animate-pulse" />
                    </div>
                </div>
                {message && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">
                        {message}
                    </p>
                )}
            </div>
        )
    }

    if (type === 'skeleton') {
        return (
            <div className={cn('space-y-4', className)}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass rounded-lg p-6 animate-pulse">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-navy-700/20" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-navy-700/20 rounded w-3/4" />
                                <div className="h-3 bg-navy-700/10 rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (type === 'progress') {
        return (
            <div className={cn('flex flex-col items-center justify-center p-12 space-y-6', className)}>
                <div className="w-full max-w-md space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {message || 'Cargando...'}
                        </p>
                        <p className="text-sm font-semibold text-teal-600 dark:text-teal-400">
                            {progress}%
                        </p>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>
        )
    }

    if (type === 'narrative' && steps) {
        return (
            <div className={cn('flex flex-col items-center justify-center p-12 space-y-6', className)}>
                {/* Spinner */}
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-slate-200 dark:border-navy-700 border-t-teal-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-teal-500 animate-pulse" />
                    </div>
                </div>

                {/* Steps */}
                <div className="w-full max-w-md space-y-3">
                    {steps.map((step, index) => {
                        const isCompleted = index < currentStep
                        const isCurrent = index === currentStep
                        const isPending = index > currentStep

                        return (
                            <div
                                key={index}
                                className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg transition-all duration-300',
                                    isCurrent && 'bg-teal-50 dark:bg-teal-900/20 border border-teal-500/20',
                                    isCompleted && 'opacity-60'
                                )}
                            >
                                {isCompleted && (
                                    <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                )}
                                {isCurrent && (
                                    <Loader2 className="h-5 w-5 text-teal-500 animate-spin flex-shrink-0" />
                                )}
                                {isPending && (
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-navy-600 flex-shrink-0" />
                                )}
                                <p className={cn(
                                    'text-sm font-medium',
                                    isCurrent && 'text-teal-900 dark:text-teal-100',
                                    isCompleted && 'text-slate-600 dark:text-slate-400 line-through',
                                    isPending && 'text-slate-500 dark:text-slate-500'
                                )}>
                                    {step.label}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Progress Bar */}
                {progress !== undefined && (
                    <div className="w-full max-w-md">
                        <Progress value={progress} className="h-2" />
                    </div>
                )}
            </div>
        )
    }

    return null
}

// ============================================
// SKELETON COMPONENTS
// ============================================

export function SkeletonCard() {
    return (
        <div className="glass rounded-lg p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-navy-700/20" />
                    <div className="space-y-2">
                        <div className="h-4 bg-navy-700/20 rounded w-32" />
                        <div className="h-3 bg-navy-700/10 rounded w-24" />
                    </div>
                </div>
                <div className="h-6 w-16 bg-navy-700/20 rounded" />
            </div>
            <div className="h-8 bg-navy-700/20 rounded w-24" />
        </div>
    )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {/* Header */}
            <div className="flex gap-4 p-4 bg-slate-50 dark:bg-navy-800 rounded-lg">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-4 bg-navy-700/20 rounded flex-1 animate-pulse" />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 p-4 border-b border-slate-200 dark:border-navy-700">
                    {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="h-4 bg-navy-700/10 rounded flex-1 animate-pulse" />
                    ))}
                </div>
            ))}
        </div>
    )
}
