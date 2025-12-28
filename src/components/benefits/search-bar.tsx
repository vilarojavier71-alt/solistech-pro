
'use client'

import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    loading?: boolean
    className?: string
}

export function SearchBar({ value, onChange, loading, className }: SearchBarProps) {
    return (
        <div className={cn("relative group", className)}>
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative">
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Busca tu municipio (ej: Madrid, Barcelona...)"
                    className="h-14 pl-12 pr-4 rounded-xl text-lg bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none focus-visible:ring-emerald-500/50 transition-all duration-300"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    ) : (
                        <Search className="h-6 w-6 group-focus-within:text-primary transition-colors duration-300" />
                    )}
                </div>
            </div>
        </div>
    )
}
