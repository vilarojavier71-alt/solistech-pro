'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { registerPayment } from '@/lib/actions/invoices'
import { toast } from 'sonner'

interface PaymentFormProps {
    invoiceId: string
    pendingAmount: number
}

export function PaymentForm({ invoiceId, pendingAmount }: PaymentFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const [amount, setAmount] = useState(pendingAmount.toFixed(2))
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
    const [paymentMethod, setPaymentMethod] = useState('transfer')
    const [reference, setReference] = useState('')
    const [notes, setNotes] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const paymentAmount = parseFloat(amount)

        if (paymentAmount <= 0) {
            toast.error('El monto debe ser mayor a 0')
            return
        }

        if (paymentAmount > pendingAmount) {
            toast.error('El monto no puede ser mayor al pendiente')
            return
        }

        setLoading(true)

        const { error } = await registerPayment(invoiceId, {
            amount: paymentAmount,
            paymentDate,
            paymentMethod,
            reference: reference || undefined,
            notes: notes || undefined
        })

        if (error) {
            toast.error(error)
            setLoading(false)
            return
        }

        toast.success('Pago registrado correctamente')
        setOpen(false)
        setLoading(false)
        router.refresh()
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registrar Pago
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>
                            Pendiente de pago: <span className="font-bold">{pendingAmount.toFixed(2)}€</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="amount">Monto *</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={pendingAmount}
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="paymentDate">Fecha de Pago *</Label>
                                <Input
                                    id="paymentDate"
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="paymentMethod">Método de Pago *</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transfer">Transferencia</SelectItem>
                                    <SelectItem value="card">Tarjeta</SelectItem>
                                    <SelectItem value="cash">Efectivo</SelectItem>
                                    <SelectItem value="check">Cheque</SelectItem>
                                    <SelectItem value="other">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="reference">Referencia</Label>
                            <Input
                                id="reference"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                placeholder="Ej: Nº transferencia, últimos 4 dígitos..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="notes">Notas</Label>
                            <Textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Notas adicionales sobre el pago..."
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Registrando...
                                </>
                            ) : (
                                'Registrar Pago'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
