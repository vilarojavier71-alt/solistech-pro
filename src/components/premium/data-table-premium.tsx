'use client'

import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    Eye,
    Download,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown
} from 'lucide-react'

// ============================================
// TYPES
// ============================================

export interface DataTableColumn<T = any> {
    id: string
    label: string
    accessor: keyof T | ((row: T) => any)
    sortable?: boolean
    width?: number
    render?: (value: any, row: T) => React.ReactNode
}

export interface DataTablePremiumProps<T = any> {
    columns: DataTableColumn<T>[]
    data: T[]
    features?: {
        virtualScroll?: boolean
        stickyHeader?: boolean
        compactView?: boolean
        export?: boolean
        search?: boolean
        sort?: boolean
    }
    onRowClick?: (row: T) => void
    className?: string
    rowHeight?: number
    maxHeight?: string
}

// ============================================
// DATA TABLE PREMIUM COMPONENT
// ============================================

export function DataTablePremium<T extends Record<string, any>>({
    columns,
    data,
    features = {
        virtualScroll: true,
        stickyHeader: true,
        compactView: true,
        export: false,
        search: true,
        sort: true
    },
    onRowClick,
    className,
    rowHeight = 60,
    maxHeight = '600px'
}: DataTablePremiumProps<T>) {
    const [isCompact, setIsCompact] = useState(features.compactView)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortConfig, setSortConfig] = useState<{
        key: string
        direction: 'asc' | 'desc'
    } | null>(null)

    const parentRef = useRef<HTMLDivElement>(null)

    // Filter data based on search
    const filteredData = useMemo(() => {
        if (!searchQuery || !features.search) return data

        return data.filter(row => {
            return Object.values(row).some(value =>
                String(value).toLowerCase().includes(searchQuery.toLowerCase())
            )
        })
    }, [data, searchQuery, features.search])

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortConfig || !features.sort) return filteredData

        return [...filteredData].sort((a, b) => {
            const column = columns.find(col => col.id === sortConfig.key)
            if (!column) return 0

            const aValue = typeof column.accessor === 'function'
                ? column.accessor(a)
                : a[column.accessor]
            const bValue = typeof column.accessor === 'function'
                ? column.accessor(b)
                : b[column.accessor]

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
            return 0
        })
    }, [filteredData, sortConfig, columns, features.sort])

    // Virtualization
    const virtualizer = useVirtualizer({
        count: sortedData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => rowHeight,
        overscan: 5,
        enabled: features.virtualScroll
    })

    const handleSort = (columnId: string) => {
        if (!features.sort) return

        setSortConfig(current => {
            if (current?.key === columnId) {
                return current.direction === 'asc'
                    ? { key: columnId, direction: 'desc' }
                    : null
            }
            return { key: columnId, direction: 'asc' }
        })
    }

    const handleExport = () => {
        if (!features.export) return

        const csv = [
            columns.map(col => col.label).join(','),
            ...sortedData.map(row =>
                columns.map(col => {
                    const value = typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : row[col.accessor]
                    return `"${String(value).replace(/"/g, '""')}"`
                }).join(',')
            )
        ].join('\n')

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `export-${Date.now()}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // Display columns (compact mode shows fewer)
    const displayColumns = isCompact
        ? columns.slice(0, Math.min(columns.length, 5))
        : columns

    const hiddenColumnsCount = columns.length - displayColumns.length

    return (
        <div className={cn('space-y-4', className)}>
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                    {features.search && (
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    )}
                    <Badge variant="outline">
                        {sortedData.length} {sortedData.length === 1 ? 'registro' : 'registros'}
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    {features.compactView && hiddenColumnsCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsCompact(!isCompact)}
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            {isCompact ? `Mostrar ${hiddenColumnsCount} más` : 'Vista compacta'}
                        </Button>
                    )}
                    {features.export && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="glass-strong rounded-lg border border-navy-700/20 overflow-hidden">
                <div
                    ref={parentRef}
                    className="overflow-auto"
                    style={{ maxHeight }}
                >
                    <table className="table-premium w-full">
                        {/* Header */}
                        <thead
                            className={cn(
                                'bg-slate-50 dark:bg-navy-800',
                                features.stickyHeader && 'sticky top-0 z-10 glass-strong'
                            )}
                        >
                            <tr>
                                {displayColumns.map((column) => {
                                    const isSorted = sortConfig?.key === column.id
                                    const SortIcon = isSorted
                                        ? sortConfig.direction === 'asc'
                                            ? ChevronUp
                                            : ChevronDown
                                        : ChevronsUpDown

                                    return (
                                        <th
                                            key={column.id}
                                            className={cn(
                                                'text-left',
                                                column.sortable && features.sort && 'cursor-pointer hover:bg-slate-100 dark:hover:bg-navy-700/50'
                                            )}
                                            style={{ width: column.width }}
                                            onClick={() => column.sortable && handleSort(column.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span>{column.label}</span>
                                                {column.sortable && features.sort && (
                                                    <SortIcon className={cn(
                                                        'h-4 w-4',
                                                        isSorted ? 'text-teal-600' : 'text-slate-400'
                                                    )} />
                                                )}
                                            </div>
                                        </th>
                                    )
                                })}
                            </tr>
                        </thead>

                        {/* Body */}
                        <tbody>
                            {features.virtualScroll ? (
                                <tr style={{ height: `${virtualizer.getTotalSize()}px` }}>
                                    <td colSpan={displayColumns.length} className="p-0">
                                        <div className="relative">
                                            {virtualizer.getVirtualItems().map((virtualRow) => {
                                                const row = sortedData[virtualRow.index]
                                                return (
                                                    <div
                                                        key={virtualRow.index}
                                                        className={cn(
                                                            'absolute top-0 left-0 w-full flex border-b border-slate-100 dark:border-navy-700/50',
                                                            'hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors',
                                                            onRowClick && 'cursor-pointer'
                                                        )}
                                                        style={{
                                                            height: `${virtualRow.size}px`,
                                                            transform: `translateY(${virtualRow.start}px)`
                                                        }}
                                                        onClick={() => onRowClick?.(row)}
                                                    >
                                                        {displayColumns.map((column) => {
                                                            const value = typeof column.accessor === 'function'
                                                                ? column.accessor(row)
                                                                : row[column.accessor]

                                                            return (
                                                                <div
                                                                    key={column.id}
                                                                    className="px-6 py-4 flex items-center"
                                                                    style={{ width: column.width || 'auto', flex: column.width ? 'none' : 1 }}
                                                                >
                                                                    {column.render ? column.render(value, row) : value}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sortedData.map((row, index) => (
                                    <tr
                                        key={index}
                                        className={cn(
                                            onRowClick && 'cursor-pointer'
                                        )}
                                        onClick={() => onRowClick?.(row)}
                                    >
                                        {displayColumns.map((column) => {
                                            const value = typeof column.accessor === 'function'
                                                ? column.accessor(row)
                                                : row[column.accessor]

                                            return (
                                                <td key={column.id}>
                                                    {column.render ? column.render(value, row) : value}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Hidden columns indicator */}
            {isCompact && hiddenColumnsCount > 0 && (
                <div className="text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsCompact(false)}
                        className="text-slate-600 dark:text-slate-400"
                    >
                        + {hiddenColumnsCount} columnas adicionales ocultas
                    </Button>
                </div>
            )}
        </div>
    )
}
