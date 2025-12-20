'use client'

import { Sale } from '@/types/portal'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail, CreditCard, DollarSign, Banknote } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from 'next/navigation'
import { notifyPaymentReceived } from '@/lib/actions/notifications'

interface PaymentControlProps {
    sale: Sale
    onStatusChange?: () => void
}


export function SalePaymentControl({ sale, onStatusChange }: PaymentControlProps) {
    const router = useRouter()

    // Detectar modalidad (si payment_method es 'cash' asumimos Contado, sino Fraccionado)
    const isCash = sale.payment_method === 'cash'

    const handleRequestPayment = (type: '20' | '60' | 'final' | 'full', amount: number) => {
        const title = type === 'full' ? 'Pago Único' : type === 'final' ? 'Pago Final' : `Pago ${type}%`
        const concept = `${sale.sale_number} - ${title}`

        const subject = `Solicitud de Pago - Instalación Solar ${sale.sale_number}`
        const body = `Hola ${sale.customer_name},%0D%0A%0D%0A
Adjunto enviamos la solicitud de pago correspondiente al ${title} de su instalación.%0D%0A%0D%0A
Importe a abonar: €${amount.toLocaleString('es-ES')}%0D%0A
Concepto: ${concept}%0D%0A%0D%0A
Por favor, realice la transferencia a la cuenta ESXX XXXX XXXX XXXX XXXX.%0D%0A%0D%0A
Gracias,%0D%0A
El equipo de SolisTech.`

        window.open(`mailto:${sale.customer_email}?subject=${subject}&body=${body}`, '_blank')

        // Actualizar estado (si es full usamos el campo final o todos)
        if (type === 'full') {
            updatePaymentStatus('final', 'requested')
        } else {
            updatePaymentStatus(type, 'requested')
        }
    }

    const updatePaymentStatus = async (type: '20' | '60' | 'final' | 'full', status: 'requested' | 'received') => {
        const dbType = type === 'full' ? 'final' : type
        const fieldStatus = `payment_${dbType}_status`
        const fieldDate = `payment_${dbType}_date`

        try {
            const updateData: any = { [fieldStatus]: status }

            if (status === 'received') {
                updateData[fieldDate] = new Date().toISOString()
                if (isCash && dbType === 'final') {
                    updateData['payment_status'] = 'confirmed'
                }

                // Trigger notification email (Non-blocking)
                const title = type === 'full' ? 'Pago Único' : type === 'final' ? 'Pago Final' : `Pago ${type}%`
                const amount = isCash ? sale.amount : (type === '60' ? sale.amount * 0.6 : sale.amount * 0.2)

                notifyPaymentReceived(sale.customer_email, amount, sale.sale_number)
                    .catch((e: any) => console.error("Failed to send notification email", e))
            }

            // TODO: Replace with server action
            console.log('[PaymentControl] TODO: Update payment via server action', {
                saleId: sale.id,
                updateData
            })

            toast.success(`Estado de pago actualizado: ${status} (TODO: implementar server action)`)
            router.refresh()
            if (onStatusChange) onStatusChange()

        } catch (error) {
            console.error('Error updating payment:', error)
            toast.error('Error al actualizar el pago')
        }
    }

    if (isCash) {
        return (
            <div className="max-w-md mx-auto">
                <PaymentCard
                    title="Pago Único (Al Contado)"
                    amount={sale.amount}
                    status={sale.payment_final_status} // Usamos final_status para almacenar el estado del pago único
                    date={sale.payment_final_date}
                    icon={<Banknote className="h-5 w-5" />}
                    onRequest={() => handleRequestPayment('full', sale.amount)}
                    onMarkPaid={() => updatePaymentStatus('final', 'received')}
                    isFullWidth
                />
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <PaymentCard
                title="Firma (20%)"
                amount={sale.amount * 0.20}
                status={sale.payment_20_status}
                date={sale.payment_20_date}
                onRequest={() => handleRequestPayment('20', sale.amount * 0.20)}
                onMarkPaid={() => updatePaymentStatus('20', 'received')}
            />
            <PaymentCard
                title="Material (60%)"
                amount={sale.amount * 0.60}
                status={sale.payment_60_status}
                date={sale.payment_60_date}
                onRequest={() => handleRequestPayment('60', sale.amount * 0.60)}
                onMarkPaid={() => updatePaymentStatus('60', 'received')}
            />
            <PaymentCard
                title="Finalización (20%)"
                amount={sale.amount * 0.20}
                status={sale.payment_final_status}
                date={sale.payment_final_date}
                onRequest={() => handleRequestPayment('final', sale.amount * 0.20)}
                onMarkPaid={() => updatePaymentStatus('final', 'received')}
            />
        </div>
    )
}

function PaymentCard({
    title,
    amount,
    status,
    date,
    onRequest,
    onMarkPaid,
    icon,
    isFullWidth = false
}: {
    title: string,
    amount: number,
    status: string | undefined,
    date: string | undefined | null
    onRequest: () => void
    onMarkPaid: () => void
    icon?: React.ReactNode
    isFullWidth?: boolean
}) {
    const isPaid = status === 'received'
    const isRequested = status === 'requested'

    return (
        <div className={`p-4 rounded-xl border-2 transition-all ${isPaid ? 'border-green-500 bg-green-50' :
            isRequested ? 'border-amber-300 bg-amber-50' :
                'border-slate-100 bg-white hover:border-slate-200'
            } ${isFullWidth ? 'p-8 text-center' : ''}`}>

            <div className={`flex justify-between items-start mb-2 ${isFullWidth ? 'justify-center mb-4' : ''}`}>
                <div className="flex items-center gap-2">
                    {icon && <div className="text-slate-500">{icon}</div>}
                    <p className={`font-medium text-slate-500 ${isFullWidth ? 'text-lg' : 'text-sm'}`}>{title}</p>
                </div>
                {!isFullWidth && (isPaid ? <CreditCard className="h-4 w-4 text-green-600" /> : <DollarSign className="h-4 w-4 text-slate-400" />)}
            </div>

            <p className={`font-bold mb-4 text-slate-800 ${isFullWidth ? 'text-4xl my-6' : 'text-2xl'}`}>€{amount.toLocaleString()}</p>

            {isPaid ? (
                <div className="flex items-center text-green-700 gap-2 font-medium bg-green-100 p-2 rounded-lg justify-center">
                    <CheckCircle2 className="h-5 w-5" />
                    Pagado {date ? new Date(date).toLocaleDateString() : ''}
                </div>
            ) : (
                <div className={`flex flex-col gap-2 ${isFullWidth ? 'max-w-xs mx-auto' : ''}`}>
                    <Button
                        size={isFullWidth ? "lg" : "sm"}
                        variant={isRequested ? "outline" : "default"}
                        className={isRequested ? "text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-slate-900 hover:bg-slate-800"}
                        onClick={onRequest}
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        {isRequested ? 'Reenviar Solicitud' : 'Solicitar Pago'}
                    </Button>

                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={onMarkPaid}
                    >
                        Marcar como Pagado
                    </Button>

                    {isRequested && (
                        <span className="text-xs text-center text-amber-600 font-medium">
                            Solicitado ?
                        </span>
                    )}
                </div>
            )}
        </div>
    )
}
