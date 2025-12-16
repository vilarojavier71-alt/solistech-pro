'use client'

import { useState, useEffect } from 'react'
import { getTrialBalance } from '@/lib/actions/accounting'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export function TrialBalanceReport({ initialData = [] }: { initialData?: any[] }) {
    const [data, setData] = useState<any[]>(initialData)
    const [loading, setLoading] = useState(initialData.length === 0)

    useEffect(() => {
        if (initialData.length === 0) {
            getTrialBalance().then(res => {
                if (res.success && res.data) setData(res.data)
                setLoading(false)
            })
        } else {
            setData(initialData)
            setLoading(false)
        }
    }, [initialData])

    if (loading) return <div>Generando reporte...</div>

    const totalDebit = data.reduce((sum, item) => sum + item.debit, 0)
    const totalCredit = data.reduce((sum, item) => sum + item.credit, 0)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Balance de Comprobación</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Cuenta</TableHead>
                            <TableHead className="text-right">Débito</TableHead>
                            <TableHead className="text-right">Crédito</TableHead>
                            <TableHead className="text-right">Saldo Neto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id}>
                                <TableCell className="font-mono">{row.code}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell className="text-right font-mono text-slate-500">
                                    {row.debit > 0 ? `€${row.debit.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-mono text-slate-500">
                                    {row.credit > 0 ? `€${row.credit.toFixed(2)}` : '-'}
                                </TableCell>
                                <TableCell className={`text-right font-mono font-bold ${row.netBalance < 0 ? 'text-red-500' : ''}`}>
                                    €{row.netBalance.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                        <TableRow className="bg-muted font-bold">
                            <TableCell colSpan={2}>TOTALES</TableCell>
                            <TableCell className="text-right">€{totalDebit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">€{totalCredit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">-</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
