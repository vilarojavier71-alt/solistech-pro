'use client'

import * as React from 'react'
import { useIsMobile } from '@/hooks/useMediaQuery'
import { Card } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

interface Column<T> {
    key: string
    header: string
    cell: (item: T) => React.ReactNode
    className?: string
}

interface ResponsiveTableProps<T> {
    data: T[]
    columns: Column<T>[]
    renderMobileCard: (item: T, index: number) => React.ReactNode
    emptyMessage?: string
    className?: string
}

/**
 * Tabla responsiva que se convierte en lista de cards en móvil
 * Estilo Holded/Linear - Clean ERP
 */
export function ResponsiveTable<T>({
    data,
    columns,
    renderMobileCard,
    emptyMessage = 'No hay datos para mostrar',
    className
}: ResponsiveTableProps<T>) {
    const isMobile = useIsMobile()

    // Mobile: Card List
    if (isMobile) {
        return (
            <div className={`space-y-3 ${className || ''}`}>
                {data.length === 0 ? (
                    <Card className="p-8 text-center">
                        <p className="text-muted-foreground">{emptyMessage}</p>
                    </Card>
                ) : (
                    data.map((item, index) => (
                        <Card key={index} className="p-4">
                            {renderMobileCard(item, index)}
                        </Card>
                    ))
                )}
            </div>
        )
    }

    // Desktop: Table
    return (
        <div className={`rounded-2xl border bg-card shadow-holded-lg overflow-hidden ${className || ''}`}>
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                <p className="text-muted-foreground">{emptyMessage}</p>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                {columns.map((column) => (
                                    <TableCell key={column.key} className={column.className}>
                                        {column.cell(item)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
