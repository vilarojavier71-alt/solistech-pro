'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Users, Crown, ExternalLink } from 'lucide-react'
import { createCheckoutSession, createCustomerPortalSession } from '@/lib/actions/subscriptions'
import { SUBSCRIPTION_PLANS } from '@/lib/config/plans'
import { toast } from 'sonner'

interface SubscriptionCardProps {
    subscription: {
        subscription_status: string | null
        subscription_plan: string | null
        max_employees: number | null
        current_employee_count: number | null
        subscription_ends_at: Date | string | null
        stripe_subscription_id: string | null
        is_god_mode?: boolean | null
    } | null
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
    const [upgrading, setUpgrading] = useState(false)
    const [openingPortal, setOpeningPortal] = useState(false)

    const plan = subscription?.subscription_plan || 'basic'
    const status = subscription?.subscription_status || 'basic'
    const maxEmployees = subscription?.max_employees ?? 0
    const currentEmployees = subscription?.current_employee_count ?? 0

    // Check if subscription is active via Stripe OR God Mode
    const isGodMode = subscription?.is_god_mode
    const hasActiveSubscription = (subscription?.stripe_subscription_id && status === 'active') || isGodMode

    const handleUpgrade = async () => {
        setUpgrading(true)
        try {
            const proPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'pro')
            if (!proPlan?.stripePriceId) {
                toast.error('Configuración de precio no encontrada')
                return
            }

            const result = await createCheckoutSession(proPlan.stripePriceId)
            if (result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.error || 'Error al crear la sesión de pago')
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud')
        } finally {
            setUpgrading(false)
        }
    }

    const handleManageSubscription = async () => {
        if (isGodMode) {
            toast.info('Tu plan tiene gestión especial. Contacta con soporte.')
            return
        }

        setOpeningPortal(true)
        try {
            const result = await createCustomerPortalSession()
            if (result.url) {
                window.location.href = result.url
            } else {
                toast.error(result.error || 'Error al abrir el portal')
            }
        } catch (error) {
            toast.error('Error al procesar la solicitud')
        } finally {
            setOpeningPortal(false)
        }
    }

    const getStatusBadge = () => {
        if (isGodMode) return <Badge className="bg-purple-600 text-white hover:bg-purple-700">God Mode</Badge>

        switch (status) {
            case 'active':
                return <Badge className="bg-emerald-500 text-white">Activo</Badge>
            case 'past_due':
                return <Badge variant="destructive">Pago pendiente</Badge>
            case 'canceled':
                return <Badge variant="secondary">Cancelado</Badge>
            default:
                return <Badge variant="outline">Plan Básico</Badge>
        }
    }

    return (
        <Card className="border-2">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {plan === 'pro' || isGodMode ? (
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                                <Crown className="h-6 w-6 text-white" />
                            </div>
                        ) : (
                            <div className="p-2 rounded-lg bg-muted">
                                <CreditCard className="h-6 w-6 text-muted-foreground" />
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-xl">
                                {isGodMode ? 'Plan Fundador' : plan === 'pro' ? 'Plan Pro' : 'Plan Básico'}
                            </CardTitle>
                            <CardDescription>
                                {isGodMode
                                    ? 'Acceso ilimitado de por vida'
                                    : plan === 'pro' ? '€150/mes' : 'Gratis - Solo gestión de datos'}
                            </CardDescription>
                        </div>
                    </div>
                    {getStatusBadge()}
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Employee usage */}
                <div className="p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Empleados</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {currentEmployees} / {maxEmployees === -1 ? '∞' : maxEmployees}
                        </span>
                    </div>
                    {plan === 'basic' && !isGodMode && (
                        <p className="text-xs text-muted-foreground">
                            El plan básico no incluye empleados. Actualiza a Pro para añadir tu equipo.
                        </p>
                    )}
                    {(plan === 'pro' || isGodMode) && maxEmployees === -1 && (
                        <p className="text-xs text-muted-foreground">
                            Empleados ilimitados incluidos en tu plan {isGodMode ? 'Fundador' : 'Pro'}.
                        </p>
                    )}
                </div>

                {/* Subscription end date */}
                {subscription?.subscription_ends_at && status === 'active' && !isGodMode && (
                    <div className="text-sm text-muted-foreground">
                        Próxima renovación:{' '}
                        <span className="font-medium text-foreground">
                            {new Date(subscription.subscription_ends_at).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </span>
                    </div>
                )}
                {isGodMode && (
                    <div className="text-sm text-muted-foreground">
                        Suscripción vitalicia activa.
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {!hasActiveSubscription ? (
                        <Button
                            onClick={handleUpgrade}
                            disabled={upgrading}
                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                            {upgrading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Crown className="mr-2 h-4 w-4" />
                                    Actualizar a Pro - €150/mes
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={handleManageSubscription}
                            disabled={openingPortal || !!isGodMode}
                            className="flex-1"
                        >
                            {openingPortal ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Abriendo...
                                </>
                            ) : (
                                <>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {isGodMode ? 'Cuenta Gestionada' : 'Gestionar Suscripción'}
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Past due warning */}
                {status === 'past_due' && !isGodMode && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-600 dark:text-red-400">
                            ⚠️ Tu pago ha fallado. Por favor, actualiza tu método de pago para evitar la interrupción del servicio.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
