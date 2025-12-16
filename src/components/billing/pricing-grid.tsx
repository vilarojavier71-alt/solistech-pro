'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2 } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/config/plans'
import { createCheckoutSession } from '@/lib/actions/subscriptions'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PricingGridProps {
    currentPlanId: string // 'basic', 'starter', 'pro', 'enterprise'
}

export function PricingGrid({ currentPlanId }: PricingGridProps) {
    const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null)

    const handleSubscribe = async (priceId: string | undefined) => {
        if (!priceId) return

        setLoadingPriceId(priceId)
        try {
            const result = await createCheckoutSession(priceId)
            if (result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.error || 'Error al iniciar suscripción')
            }
        } catch (error) {
            toast.error('Error de conexión')
        } finally {
            setLoadingPriceId(null)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
                const isCurrent = currentPlanId === plan.id
                const isEnterprise = plan.id === 'enterprise'
                const isFree = plan.price === 0

                return (
                    <Card
                        key={plan.id}
                        className={cn(
                            "flex flex-col h-full relative transition-all duration-200",
                            plan.highlight
                                ? "border-primary shadow-xl scale-105 z-10 dark:shadow-primary/20"
                                : "border-border shadow-sm hover:shadow-md"
                        )}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                <Badge className="px-3 py-1 text-sm shadow-sm bg-primary text-primary-foreground hover:bg-primary">
                                    Más Popular
                                </Badge>
                            </div>
                        )}

                        <CardHeader>
                            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                            <CardDescription className="h-10 text-sm line-clamp-2 text-muted-foreground/80">
                                {plan.description}
                            </CardDescription>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-3xl font-bold tracking-tight">
                                    {plan.price !== null ? `€${plan.price}` : 'Consultar'}
                                </span>
                                {plan.price !== null && <span className="ml-1 text-sm text-muted-foreground font-medium">/mes</span>}
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1">
                            <ul className="space-y-3 text-sm">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-muted-foreground">
                                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                                        <span className="text-foreground/90">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>

                        <CardFooter className="pt-4">
                            {isCurrent ? (
                                <Button className="w-full" variant="outline" disabled>
                                    Plan Actual
                                </Button>
                            ) : isEnterprise ? (
                                <Button className="w-full" variant="ghost" asChild>
                                    <a href="mailto:ventas@solistech.pro">Contactar Ventas</a>
                                </Button>
                            ) : isFree ? (
                                <Button className="w-full" variant="outline" disabled>
                                    Incluido
                                </Button>
                            ) : (
                                <Button
                                    className={cn(
                                        "w-full font-semibold shadow-sm transition-all active:scale-95 text-white",
                                        plan.highlight
                                            ? "bg-primary hover:bg-primary/90"
                                            : "bg-primary/90 hover:bg-primary"
                                    )}
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={loadingPriceId === plan.id}
                                >
                                    {loadingPriceId === plan.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0 text-white" />
                                            Procesando
                                        </>
                                    ) : (
                                        plan.buttonText
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                )
            })}
        </div>
    )
}
