import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getOrganizationSubscription } from '@/lib/actions/subscriptions'
import { SubscriptionCard } from '@/components/billing/subscription-card'
import { PromoCodeForm } from '@/components/billing/promo-code-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Receipt, Shield, HelpCircle } from 'lucide-react'

export const metadata: Metadata = {
    title: 'Facturación | MotorGap',
    description: 'Gestiona tu suscripción y facturación'
}

export default async function BillingPage() {
    const session = await auth()
    if (!session?.user) redirect('/auth/login')

    const subscription = await getOrganizationSubscription()

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Facturación</h1>
                <p className="text-muted-foreground mt-1">
                    Gestiona tu plan de suscripción y métodos de pago
                </p>
            </div>

            {/* URL params feedback */}
            <SuccessFeedback />

            {/* Main subscription card */}
            <SubscriptionCard subscription={subscription as any} />

            {/* Promo Code */}
            <PromoCodeForm />

            {/* Additional info cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Payment security */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-base">Pagos Seguros</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Todos los pagos se procesan de forma segura a través de Stripe.
                            Nunca almacenamos los datos de tu tarjeta en nuestros servidores.
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <Badge variant="outline" className="text-xs">PCI DSS</Badge>
                            <Badge variant="outline" className="text-xs">SSL</Badge>
                            <Badge variant="outline" className="text-xs">3D Secure</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Invoices info */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Receipt className="h-5 w-5 text-blue-500" />
                            <CardTitle className="text-base">Facturas</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Las facturas se envían automáticamente a tu email registrado
                            al inicio de cada ciclo de facturación.
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Puedes descargar todas tus facturas desde el portal de Stripe
                            haciendo clic en "Gestionar Suscripción".
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* FAQ */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-base">Preguntas Frecuentes</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium text-sm">¿Puedo cancelar en cualquier momento?</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sí, puedes cancelar tu suscripción en cualquier momento. Tu acceso Pro
                            continuará hasta el final del período de facturación actual.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm">¿Qué pasa con mis datos si cancelo?</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Tus datos se mantienen seguros. Al volver al plan básico, perderás
                            el acceso a las funciones de equipo pero tus datos permanecerán intactos.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-medium text-sm">¿Ofrecen descuentos para pago anual?</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Contacta con nuestro equipo de ventas para obtener información sobre
                            planes anuales con descuento.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Client component for URL feedback
function SuccessFeedback() {
    return (
        <script
            dangerouslySetInnerHTML={{
                __html: `
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('success') === 'true') {
                        // Show success toast if sonner is available
                        if (window.sonner?.toast) {
                            window.sonner.toast.success('¡Suscripción activada! Bienvenido a Pro 🎉');
                        }
                        // Clean URL
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                    if (params.get('canceled') === 'true') {
                        if (window.sonner?.toast) {
                            window.sonner.toast.info('Proceso de pago cancelado');
                        }
                        window.history.replaceState({}, '', window.location.pathname);
                    }
                `
            }}
        />
    )
}
