'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createInvoice, type InvoiceLine } from '@/lib/actions/invoices'
import { toast } from 'sonner'
import { SmartPaymentSelector } from './payment-method-selector'
import { PaymentMethod } from '@/lib/actions/payments'

interface CreateInvoiceFormProps {
    customers: Array<{ id: string; name: string; email: string }>
}

export function CreateInvoiceForm({ customers }: CreateInvoiceFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const [customerId, setCustomerId] = useState('')
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
    const [dueDate, setDueDate] = useState('')
    const [notes, setNotes] = useState('')
    const [paymentMethodId, setPaymentMethodId] = useState('')

    const [lines, setLines] = useState<InvoiceLine[]>([
        { description: '', quantity: 1, unitPrice: 0, taxRate: 21, discountPercentage: 0 }
    ])

    const addLine = () => {
        setLines([...lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 21, discountPercentage: 0 }])
    }

    const removeLine = (index: number) => {
        if (lines.length > 1) {
            setLines(lines.filter((_, i) => i !== index))
        }
    }

    const updateLine = (index: number, field: keyof InvoiceLine, value: any) => {
        const newLines = [...lines]
        newLines[index] = { ...newLines[index], [field]: value }
        setLines(newLines)
    }

    const calculateLineTotal = (line: InvoiceLine) => {
        const subtotal = line.quantity * line.unitPrice
        const tax = subtotal * ((line.taxRate || 21) / 100)
        return subtotal + tax
    }

    const calculateTotals = () => {
        let subtotal = 0
        let tax = 0

        lines.forEach(line => {
            const lineSubtotal = line.quantity * line.unitPrice
            subtotal += lineSubtotal
            tax += lineSubtotal * ((line.taxRate || 21) / 100)
        })

        return { subtotal, tax, total: subtotal + tax }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!customerId) {
            toast.error('Selecciona un cliente')
            return
        }

        if (lines.some(line => !line.description || line.unitPrice <= 0)) {
            toast.error('Completa todas las líneas de la factura')
            return
        }

        setLoading(true)

        const { data, error } = await createInvoice({
            customerId,
            issueDate,
            dueDate: dueDate || undefined,
            lines,
            notes: notes || undefined,
            paymentMethodId: paymentMethodId || undefined
        })

        if (error) {
            toast.error(error)
            setLoading(false)
            return
        }

        toast.success('Factura creada correctamente')
        router.push(`/dashboard/invoices/${data.id}`)
    }

    const totals = calculateTotals()

    const handlePaymentMethodSelect = (method: PaymentMethod) => {
        // Auto-inject instructions if present
        if (method.instructions) {
            const separator = notes ? '\n\n' : ''
            // Avoid duplicating if already present (simple check)
            if (!notes.includes(method.instructions)) {
                setNotes(prev => prev + separator + `--- Instrucciones de Pago ---\n${method.instructions}`)
                toast.info("Instrucciones de pago añadidas a las notas")
            }
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Datos del cliente */}
            <Card>
                <CardHeader>
                    <CardTitle>Datos del Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="customer">Cliente *</Label>
                        <Select value={customerId} onValueChange={setCustomerId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un cliente" />
                            </SelectTrigger>
                            <SelectContent>
                                {customers.map(customer => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="issueDate">Fecha de Emisión *</Label>
                            <Input
                                id="issueDate"
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="dueDate">Fecha de Vencimiento</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Líneas de factura */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Conceptos</CardTitle>
                            <CardDescription>Añade los productos o servicios facturados</CardDescription>
                        </div>
                        <Button type="button" onClick={addLine} variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Añadir Línea
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-end p-4 border rounded-lg">
                                <div className="col-span-5">
                                    <Label>Descripción *</Label>
                                    <Input
                                        value={line.description}
                                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                                        placeholder="Ej: Instalación solar 5kW"
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Cantidad</Label>
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={line.quantity}
                                        onChange={(e) => updateLine(index, 'quantity', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Precio Unit.</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={line.unitPrice}
                                        onChange={(e) => updateLine(index, 'unitPrice', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <Label>IVA %</Label>
                                    <Select
                                        value={String(line.taxRate)}
                                        onValueChange={(value) => updateLine(index, 'taxRate', parseFloat(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0%</SelectItem>
                                            <SelectItem value="4">4%</SelectItem>
                                            <SelectItem value="10">10%</SelectItem>
                                            <SelectItem value="21">21%</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-1">
                                    <Label>Total</Label>
                                    <p className="text-sm font-semibold pt-2">
                                        {calculateLineTotal(line).toFixed(2)}€
                                    </p>
                                </div>
                                <div className="col-span-1">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeLine(index)}
                                        disabled={lines.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totales */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal:</span>
                                <span>{totals.subtotal.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>IVA:</span>
                                <span>{totals.tax.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                                <span>TOTAL:</span>
                                <span>{totals.total.toFixed(2)}€</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>



            {/* Detalles de Facturación y Pago */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalles de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label>Método de Pago</Label>
                        <SmartPaymentSelector
                            value={paymentMethodId}
                            onValueChange={setPaymentMethodId}
                            onMethodSelected={handlePaymentMethodSelect}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Las instrucciones del método se añadirán automáticamente a las notas de la factura.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notas */}
            <Card>
                <CardHeader>
                    <CardTitle>Notas</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Notas adicionales para el cliente..."
                        rows={3}
                    />
                </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Creando...' : 'Crear Factura'}
                </Button>
            </div>
        </form >
    )
}
