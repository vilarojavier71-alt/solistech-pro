'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createJournalEntry, getAccounts } from '@/lib/actions/accounting'
import { CreateJournalEntrySchema } from '@/lib/schemas/accounting'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

// Extend schema for frontend to include 'accountId' as string (actions handles validation)
// We reuse the backend schema which is good practice.

export function NewJournalEntryForm() {
    const router = useRouter()
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getAccounts().then(res => {
            if (res.success && res.data) setAccounts(res.data)
        })
    }, [])

    const form = useForm<z.infer<typeof CreateJournalEntrySchema>>({
        resolver: zodResolver(CreateJournalEntrySchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            description: '',
            reference: '',
            lines: [
                { accountId: '', debit: 0, credit: 0, description: '' },
                { accountId: '', debit: 0, credit: 0, description: '' }
            ]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lines"
    })

    // Calculate totals for UI
    const watchedLines = form.watch("lines")
    const totalDebit = watchedLines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0)
    const totalCredit = watchedLines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0)
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

    async function onSubmit(data: z.infer<typeof CreateJournalEntrySchema>) {
        setLoading(true)
        if (!isBalanced) {
            toast.error("El asiento no está cuadrado")
            setLoading(false)
            return
        }

        const res = await createJournalEntry(data)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Asiento registrado correctamente")
            form.reset({
                date: new Date().toISOString().split('T')[0],
                description: '',
                reference: '',
                lines: [
                    { accountId: '', debit: 0, credit: 0, description: '' },
                    { accountId: '', debit: 0, credit: 0, description: '' }
                ]
            })
            // Force server re-fetch to update sibling components (JournalList, TrialBalance)
            router.refresh()
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha</FormLabel>
                                <FormControl>
                                    <Input type="date" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Descripción General</FormLabel>
                                <FormControl>
                                    <Input placeholder="Pago de facturas..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Movimientos</h3>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ accountId: '', debit: 0, credit: 0, description: '' })}>
                            <Plus className="mr-2 h-4 w-4" /> Añadir Línea
                        </Button>
                    </div>

                    {fields.map((field, index) => (
                        <Card key={field.id} className="p-4">
                            <div className="grid grid-cols-12 gap-2 items-end">
                                <div className="col-span-4">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.accountId`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Cuenta</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Seleccionar cuenta" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {accounts.map(acc => (
                                                            <SelectItem key={acc.id} value={acc.id}>
                                                                {acc.code} - {acc.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-3">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.description`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Detalle (Opcional)</FormLabel>
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.debit`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Débito</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name={`lines.${index}.credit`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className={index !== 0 ? "sr-only" : ""}>Crédito</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium">Totales</div>
                    <div className="flex gap-8">
                        <div className="text-sm">Débito: <span className="font-mono font-bold">€{totalDebit.toFixed(2)}</span></div>
                        <div className="text-sm">Crédito: <span className="font-mono font-bold">€{totalCredit.toFixed(2)}</span></div>
                        <div className={isBalanced ? "text-green-600 font-bold" : "text-destructive font-bold"}>
                            {isBalanced ? "CUADRADO" : `DESCUADRE: €${(totalDebit - totalCredit).toFixed(2)}`}
                        </div>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={!isBalanced || loading}>
                    Registrar Asiento
                </Button>
            </form>
        </Form>
    )
}
