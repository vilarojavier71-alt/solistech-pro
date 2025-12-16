'use client'

import { useEffect, useState } from 'react'
import { getJournals } from '@/lib/actions/accounting'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { format } from 'date-fns'


export function JournalList({ initialJournals = [] }: { initialJournals?: any[] }) {
    // We can keep state if we want to support client-side filtering later, 
    // but for now relying on props + router.refresh() is cleaner.
    const journals = initialJournals

    if (!journals || journals.length === 0) {
        return <div className="p-4 text-muted-foreground">No hay asientos registrados.</div>
    }

    return (
        <div className="space-y-4">
            {journals.map((journal) => (
                <Card key={journal.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="flex flex-col">
                            <CardTitle className="text-sm font-medium">
                                {format(new Date(journal.date), 'dd/MM/yyyy')} - {journal.description}
                            </CardTitle>
                            <span className="text-xs text-muted-foreground">Ref: {journal.reference || 'N/A'}</span>
                        </div>
                        <Badge variant={journal.status === 'posted' ? 'default' : 'secondary'}>
                            {journal.status === 'posted' ? 'Contabilizado' : 'Borrador'}
                        </Badge>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cuenta</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="text-right">Débito</TableHead>
                                    <TableHead className="text-right">Crédito</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {journal.accounting_transactions.map((tx: any) => (
                                    <TableRow key={tx.id}>
                                        <TableCell className="font-mono text-xs">{tx.account?.code} - {tx.account?.name}</TableCell>
                                        <TableCell>{tx.description || journal.description}</TableCell>
                                        <TableCell className="text-right font-mono">
                                            {Number(tx.debit) > 0 ? `€${Number(tx.debit).toFixed(2)}` : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {Number(tx.credit) > 0 ? `€${Number(tx.credit).toFixed(2)}` : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
