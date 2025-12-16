'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Loader2, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getPaymentMethods } from '@/lib/actions/billing'
import { createCustomerPortalSession } from '@/lib/actions/subscriptions'
import { toast } from 'sonner'

interface PaymentMethod {
    id: string
    brand: string
    last4: string
    exp_month: number
    exp_year: number
    is_default: boolean
}

export function PaymentMethodCard() {
    const [methods, setMethods] = useState<PaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [managing, setManaging] = useState(false)

    useEffect(() => {
        async function loadMethods() {
            try {
                const result = await getPaymentMethods()
                if (result.data) {
                    setMethods(result.data as any)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadMethods()
    }, [])

    const handleManage = async () => {
        setManaging(true)
        try {
            const result = await createCustomerPortalSession()
            if (result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Error al conectar con Stripe')
        } finally {
            setManaging(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Métodos de Pago</CardTitle>
                        <CardDescription>Tu tarjeta activa para la suscripción</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {methods.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed rounded-lg bg-muted/50">
                        <CreditCard className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm font-medium">No hay tarjetas guardadas</p>
                        <p className="text-xs text-muted-foreground mb-4">Añade un método de pago para suscribirte</p>
                        <Button variant="outline" size="sm" onClick={handleManage} disabled={managing}>
                            Añadir Método
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {methods.map((method) => (
                            <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-muted rounded">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium capitalize">{method.brand} •••• {method.last4}</p>
                                        <p className="text-xs text-muted-foreground">Expira {method.exp_month}/{method.exp_year}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={handleManage}>
                                    Actualizar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
