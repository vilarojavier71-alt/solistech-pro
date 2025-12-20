'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface KPICardProps {
    icon: React.ReactElement<LucideIcon>
    label: string
    value: string | number
    trend?: {
        value: string
        direction: 'up' | 'down' | 'neutral'
    }
    sparkline?: number[]
    subtitle?: string
    className?: string
    variant?: 'default' | 'premium' | 'gold' | 'teal'
}

// ============================================
// KPI CARD PREMIUM COMPONENT
// ============================================

export function KPICardPremium({
    icon,
    label,
    value,
    trend,
    sparkline,
    subtitle,
    className,
    variant = 'default'
}: KPICardProps) {
    const variantStyles = {
        default: 'border-slate-200 dark:border-navy-700',
        premium: 'border-navy-500/20 bg-gradient-to-br from-navy-50 to-white dark:from-navy-900 dark:to-navy-800',
        gold: 'border-gold-500/20 bg-gradient-to-br from-gold-50 to-white dark:from-gold-900/20 dark:to-navy-800',
        teal: 'border-teal-500/20 bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/20 dark:to-navy-800'
    }

    const iconColorStyles = {
        default: 'text-slate-600 dark:text-slate-400',
        premium: 'text-navy-600 dark:text-navy-400',
        gold: 'text-gold-600 dark:text-gold-400',
        teal: 'text-teal-600 dark:text-teal-400'
    }

    const TrendIcon = trend?.direction === 'up'
        ? TrendingUp
        : trend?.direction === 'down'
            ? TrendingDown
            : Minus

    const trendColorStyles = {
        up: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20',
        down: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20',
        neutral: 'text-slate-600 bg-slate-50 dark:bg-slate-800'
    }

    return (
        <Card
            className={cn(
                'card-premium shadow-premium hover:shadow-premium-lg transition-all duration-300',
                'border-2',
                variantStyles[variant],
                className
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            'p-3 rounded-lg bg-white/50 dark:bg-navy-800/50 backdrop-blur-sm',
                            'shadow-sm'
                        )}>
                            {React.cloneElement(icon as React.ReactElement<any>, {
                                className: cn('h-6 w-6', iconColorStyles[variant])
                            })}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                {label}
                            </p>
                            {subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>

                    {trend && (
                        <Badge
                            variant="outline"
                            className={cn(
                                'flex items-center gap-1 px-2 py-1',
                                trendColorStyles[trend.direction]
                            )}
                        >
                            <TrendIcon className="h-3 w-3" />
                            <span className="text-xs font-semibold">{trend.value}</span>
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                            {value}
                        </p>
                    </div>

                    {sparkline && sparkline.length > 0 && (
                        <div className="flex items-end gap-0.5 h-12">
                            {sparkline.map((val, i) => {
                                const maxVal = Math.max(...sparkline)
                                const height = (val / maxVal) * 100
                                return (
                                    <div
                                        key={i}
                                        className={cn(
                                            'w-1.5 rounded-t transition-all duration-300',
                                            variant === 'gold' && 'bg-gold-500',
                                            variant === 'teal' && 'bg-teal-500',
                                            variant === 'premium' && 'bg-navy-500',
                                            variant === 'default' && 'bg-slate-400'
                                        )}
                                        style={{ height: `${height}%` }}
                                    />
                                )
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

// ============================================
// GRID LAYOUT HELPER
// ============================================

export function KPIGrid({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6',
            className
        )}>
            {children}
        </div>
    )
}
