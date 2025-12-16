'use client'

import { useState, useEffect } from 'react'
import { getAccounts } from '@/lib/actions/accounting'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Folder, FileText } from 'lucide-react'

export function AccountsTree({ initialAccounts = [] }: { initialAccounts?: any[] }) {
    const [accounts, setAccounts] = useState<any[]>(initialAccounts)
    const [loading, setLoading] = useState(initialAccounts.length === 0)

    useEffect(() => {
        if (initialAccounts.length === 0) {
            getAccounts().then(res => {
                if (res.success && res.data) setAccounts(res.data)
                setLoading(false)
            })
        } else {
            setAccounts(initialAccounts) // Ensure sync if prop changes
            setLoading(false)
        }
    }, [initialAccounts])

    if (loading) return <div>Cargando cuentas...</div>

    // Simple flat list for MVP, indented by code length or hierarchy logic could be added
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Plan de Cuentas</CardTitle>
                <Button>Nueva Cuenta</Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-1">
                    {accounts.map((acc) => (
                        <div key={acc.id} className="flex items-center p-2 hover:bg-muted rounded-md text-sm">
                            {acc.is_group ? <Folder className="h-4 w-4 mr-2 text-blue-500" /> : <FileText className="h-4 w-4 mr-2 text-slate-500" />}
                            <span className="font-mono font-bold mr-2">{acc.code}</span>
                            <span>{acc.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground uppercase">{acc.type}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
