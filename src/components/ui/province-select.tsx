'use client'

import { useState, useMemo } from 'react'
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { PROVINCES_ALPHABETICAL, PROVINCES_BY_COMMUNITY, Province } from '@/lib/data/spanish-provinces'
import { Search } from 'lucide-react'

interface ProvinceSelectProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    groupByRegion?: boolean
    className?: string
}

export function ProvinceSelect({
    value,
    onValueChange,
    placeholder = 'Selecciona provincia',
    disabled = false,
    groupByRegion = false,
    className
}: ProvinceSelectProps) {
    const [search, setSearch] = useState('')

    // Filter provinces by search
    const filteredProvinces = useMemo(() => {
        if (!search) return PROVINCES_ALPHABETICAL
        const normalized = search.toLowerCase()
        return PROVINCES_ALPHABETICAL.filter(p =>
            p.name.toLowerCase().includes(normalized) ||
            p.community.toLowerCase().includes(normalized)
        )
    }, [search])

    // Group filtered provinces by community
    const groupedProvinces = useMemo(() => {
        return filteredProvinces.reduce((acc, province) => {
            if (!acc[province.community]) {
                acc[province.community] = []
            }
            acc[province.community].push(province)
            return acc
        }, {} as Record<string, Province[]>)
    }, [filteredProvinces])

    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {/* Search input */}
                <div className="px-2 pb-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar provincia..."
                            className="pl-8 h-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>

                {groupByRegion ? (
                    // Grouped by community
                    Object.entries(groupedProvinces)
                        .sort(([a], [b]) => a.localeCompare(b, 'es'))
                        .map(([community, provinces]) => (
                            <SelectGroup key={community}>
                                <SelectLabel className="text-xs font-semibold text-primary">
                                    {community}
                                </SelectLabel>
                                {provinces.map((province) => (
                                    <SelectItem key={province.code} value={province.name}>
                                        {province.name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        ))
                ) : (
                    // Flat alphabetical list
                    filteredProvinces.map((province) => (
                        <SelectItem key={province.code} value={province.name}>
                            <span>{province.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                                ({province.community})
                            </span>
                        </SelectItem>
                    ))
                )}

                {filteredProvinces.length === 0 && (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                        No se encontraron provincias
                    </div>
                )}
            </SelectContent>
        </Select>
    )
}

// Simple variant without search (for forms)
interface SimpleProvinceSelectProps {
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export function SimpleProvinceSelect({
    value,
    onValueChange,
    placeholder = 'Provincia',
    disabled = false,
    className
}: SimpleProvinceSelectProps) {
    return (
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
            <SelectTrigger className={className}>
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
                {PROVINCES_ALPHABETICAL.map((province) => (
                    <SelectItem key={province.code} value={province.name}>
                        {province.name}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}
