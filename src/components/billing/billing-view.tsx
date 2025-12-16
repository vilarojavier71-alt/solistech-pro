'use client'

import { SubscriptionCard } from '@/components/billing/subscription-card'
import { PromoCodeForm } from '@/components/billing/promo-code-form'
import { InvoicesTable } from '@/components/billing/invoices-table'
import { PaymentMethodCard } from '@/components/billing/payment-method-card'
import { BillingDetailsForm } from '@/components/billing/billing-details-form'
import { PricingGrid } from '@/components/billing/pricing-grid'
import { Separator } from '@/components/ui/separator'

interface BillingViewProps {
    subscription: any
    orgId?: string
}

export function BillingView({ subscription, orgId }: BillingViewProps) {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <h3 className="text-lg font-medium">Facturación</h3>
                <p className="text-sm text-muted-foreground">
                    Gestiona tu plan de suscripción, métodos de pago y descarga tus facturas.
                </p>
            </div>
            <Separator />

            {/* Main Plan & Promo */}
            <div className="grid gap-6">
                <SubscriptionCard subscription={subscription} />

                {/* Visual grouping for payments and invoices */}
                <div className="grid gap-6 md:grid-cols-2">
                    <PaymentMethodCard />
                    <PromoCodeForm />
                </div>
            </div>

            {/* Admin Section: Details & History */}
            <div className="grid gap-6">
                <PricingGrid currentPlanId={subscription?.subscription_plan || 'basic'} />
                <Separator />
                <BillingDetailsForm />
                <InvoicesTable orgId={orgId} />
            </div>
        </div>
    )
}
