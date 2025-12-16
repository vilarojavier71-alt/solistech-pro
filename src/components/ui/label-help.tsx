'use client'

import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface LabelHelpProps {
    label: string
    helpText: string
    required?: boolean
    htmlFor?: string
    className?: string
}

/**
 * @FRONTEND_COORD - Componente reutilizable Label + Tooltip
 * Combina un Label estándar con ayuda contextual mediante tooltip
 * Estilo: Dark Industrial Premium
 */
export function LabelHelp({
    label,
    helpText,
    required = false,
    htmlFor,
    className
}: LabelHelpProps) {
    return (
        <div className={cn('flex items-center gap-2', className)}>
            <Label htmlFor={htmlFor} className="flex items-center gap-1.5">
                {label}
                {required && (
                    <span className="text-red-400 text-sm" aria-label="Campo obligatorio">
                        *
                    </span>
                )}
            </Label>

            <TooltipProvider delayDuration={150}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className={cn(
                                'inline-flex items-center justify-center',
                                'text-slate-400 hover:text-teal-400',
                                'transition-colors duration-150',
                                'cursor-help',
                                'focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-full'
                            )}
                            aria-label={`Ayuda: ${label}`}
                        >
                            <HelpCircle className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent
                        side="top"
                        className={cn(
                            'max-w-xs p-3',
                            // @FRONTEND_DISENOUI - Estilo Dark Industrial Premium
                            'bg-slate-900/95 backdrop-blur-xl',
                            'border border-slate-700',
                            'shadow-lg shadow-black/20',
                            'text-slate-200 text-xs leading-relaxed',
                            'font-sans', // Inter font
                            'animate-in fade-in-0 zoom-in-95 duration-150'
                        )}
                    >
                        <div className="whitespace-pre-line">
                            {helpText}
                        </div>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    )
}
