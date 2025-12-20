'use client'

import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { LucideIcon } from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface AccordionPremiumItem {
    id: string
    title: string
    icon?: React.ReactElement<LucideIcon>
    badge?: string
    content: React.ReactNode
    defaultOpen?: boolean
}

export interface AccordionPremiumProps {
    items: AccordionPremiumItem[]
    type?: 'single' | 'multiple'
    className?: string
}

// ============================================
// ACCORDION PREMIUM COMPONENT
// ============================================

export function AccordionPremium({
    items,
    type = 'multiple',
    className
}: AccordionPremiumProps) {
    const [openItems, setOpenItems] = useState<string[]>(
        items.filter(item => item.defaultOpen).map(item => item.id)
    )

    const toggleItem = (id: string) => {
        if (type === 'single') {
            setOpenItems(openItems.includes(id) ? [] : [id])
        } else {
            setOpenItems(
                openItems.includes(id)
                    ? openItems.filter(itemId => itemId !== id)
                    : [...openItems, id]
            )
        }
    }

    return (
        <div className={cn('space-y-4', className)}>
            {items.map((item) => {
                const isOpen = openItems.includes(item.id)

                return (
                    <div
                        key={item.id}
                        className={cn(
                            'glass border border-navy-700/20 rounded-lg overflow-hidden',
                            'transition-all duration-300',
                            isOpen && 'shadow-premium'
                        )}
                    >
                        {/* Header */}
                        <button
                            onClick={() => toggleItem(item.id)}
                            className={cn(
                                'w-full px-6 py-4 flex items-center justify-between',
                                'hover:bg-slate-50 dark:hover:bg-navy-800/50',
                                'transition-colors duration-200',
                                'focus:outline-none focus:ring-2 focus:ring-navy-500/50 focus:ring-offset-2'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                {item.icon && (
                                    <div className="p-2 rounded-lg bg-navy-500/10 dark:bg-navy-500/20">
                                        {React.cloneElement(item.icon as React.ReactElement<any>, {
                                            className: 'h-5 w-5 text-navy-600 dark:text-navy-400'
                                        })}
                                    </div>
                                )}
                                <span className="text-heading-md font-semibold text-slate-900 dark:text-slate-100">
                                    {item.title}
                                </span>
                                {item.badge && (
                                    <Badge variant="outline" className="ml-2">
                                        {item.badge}
                                    </Badge>
                                )}
                            </div>

                            <ChevronDown
                                className={cn(
                                    'h-5 w-5 text-slate-600 dark:text-slate-400',
                                    'transition-transform duration-300',
                                    isOpen && 'transform rotate-180'
                                )}
                            />
                        </button>

                        {/* Content */}
                        <div
                            className={cn(
                                'overflow-hidden transition-all duration-300',
                                isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                            )}
                        >
                            <div className="px-6 py-4 border-t border-slate-200 dark:border-navy-700/50">
                                {item.content}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ============================================
// ACCORDION ITEM CONTENT HELPERS
// ============================================

export function AccordionGrid({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
    return (
        <div className={cn(
            'grid gap-4',
            cols === 2 && 'grid-cols-1 md:grid-cols-2',
            cols === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            cols === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
        )}>
            {children}
        </div>
    )
}

export function AccordionField({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="space-y-1">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {label}
            </label>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {value}
            </p>
        </div>
    )
}
