'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/services/stripe'
import { revalidatePath } from 'next/cache'

// ============================================================================
// SUBSCRIPTION QUERIES
// ============================================================================

/**
 * Get current organization's subscription info
 */
export async function getOrganizationSubscription() {
    const session = await auth()
    if (!session?.user?.id) return null

    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return null

    const org = await prisma.organizations.findUnique({
        where: { id: user.organization_id },
        select: {
            id: true,
            name: true,
            subscription_status: true,
            subscription_plan: true,
            stripe_customer_id: true,
            stripe_subscription_id: true,
            max_employees: true,
            current_employee_count: true,
            subscription_ends_at: true,
            is_god_mode: true
        }
    })

    return org
}

/**
 * Check if organization can add more employees
 */
export async function checkEmployeeLimit(organizationId?: string): Promise<{
    canAdd: boolean
    currentCount: number
    maxAllowed: number
    plan: string
}> {
    const session = await auth()
    if (!session?.user?.id) {
        return { canAdd: false, currentCount: 0, maxAllowed: 0, plan: 'basic' }
    }

    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, is_test_admin: true }
    })

    if (user?.is_test_admin) {
        return { canAdd: true, currentCount: 0, maxAllowed: -1, plan: 'pro' }
    }

    let orgId = organizationId || user?.organization_id || undefined

    if (!orgId) {
        return { canAdd: false, currentCount: 0, maxAllowed: 0, plan: 'basic' }
    }

    const org = await prisma.organizations.findUnique({
        where: { id: orgId },
        select: {
            subscription_plan: true,
            max_employees: true,
            current_employee_count: true,
            is_god_mode: true, // ADDED
            _count: { select: { users: true } }
        }
    })

    if (!org) {
        return { canAdd: false, currentCount: 0, maxAllowed: 0, plan: 'basic' }
    }

    // God Mode Bypass
    if (org.is_god_mode) {
        return { canAdd: true, currentCount: Math.max(0, org._count.users - 1), maxAllowed: -1, plan: 'pro' }
    }

    const plan = org.subscription_plan || 'basic'
    const maxAllowed = org.max_employees || 0
    // Count actual users minus the owner (first user)
    const currentCount = Math.max(0, org._count.users - 1)

    // Basic plan: no employees allowed
    if (plan === 'basic') {
        return { canAdd: false, currentCount, maxAllowed: 0, plan }
    }

    // Pro plan: unlimited employees (max_employees = -1 for unlimited)
    const canAdd = maxAllowed === -1 || currentCount < maxAllowed

    return { canAdd, currentCount, maxAllowed, plan }
}

/**
 * Check if organization can add more customers
 */
export async function checkCustomerLimit(organizationId?: string): Promise<{
    canAdd: boolean
    currentCount: number
    maxAllowed: number
    plan: string
}> {
    const session = await auth()
    if (!session?.user?.id) {
        return { canAdd: false, currentCount: 0, maxAllowed: 0, plan: 'basic' }
    }

    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, is_test_admin: true }
    })

    if (user?.is_test_admin) {
        return { canAdd: true, currentCount: 0, maxAllowed: -1, plan: 'pro' }
    }

    let orgId = organizationId || user?.organization_id || undefined

    if (!orgId) {
        return { canAdd: false, currentCount: 0, maxAllowed: 0, plan: 'basic' }
    }

    const org = await prisma.organizations.findUnique({
        where: { id: orgId },
        select: {
            subscription_plan: true,
            is_god_mode: true,
            _count: { select: { customers: true } }
        }
    })

    if (!org) {
        return { canAdd: false, currentCount: 0, maxAllowed: 0, plan: 'basic' }
    }

    // God Mode Bypass
    if (org.is_god_mode) {
        return { canAdd: true, currentCount: org._count.customers, maxAllowed: -1, plan: 'pro' }
    }

    const plan = org.subscription_plan || 'basic'
    const currentCount = org._count.customers

    // Basic plan: max 5 customers
    const BASIC_LIMIT = 5
    const maxAllowed = plan === 'basic' ? BASIC_LIMIT : -1

    const canAdd = maxAllowed === -1 || currentCount < maxAllowed

    return { canAdd, currentCount, maxAllowed, plan }
}

// ============================================================================
// STRIPE INTEGRATION
// ============================================================================

/**
 * Create or retrieve Stripe customer for organization
 */
export async function getOrCreateStripeCustomer(organizationId: string): Promise<string | null> {
    const org = await prisma.organizations.findUnique({
        where: { id: organizationId },
        select: { stripe_customer_id: true, name: true, email: true }
    })

    if (!org) return null

    // Return existing customer
    if (org.stripe_customer_id) {
        return org.stripe_customer_id
    }

    // Create new Stripe customer
    try {
        const customer = await stripe.customers.create({
            name: org.name,
            email: org.email || undefined,
            metadata: { organizationId }
        })

        // Save customer ID
        await prisma.organizations.update({
            where: { id: organizationId },
            data: { stripe_customer_id: customer.id }
        })

        return customer.id
    } catch (error) {
        console.error('Error creating Stripe customer:', error)
        return null
    }
}

import { SUBSCRIPTION_PLANS } from '@/lib/config/plans'

/**
 * Crea una sesión de checkout para actualizar el plan
 * Recibe el planId (ej: 'starter', 'pro') y resuelve el Price ID en el servidor
 */
export async function createCheckoutSession(planId: string): Promise<{ url: string | null; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { url: null, error: 'No autenticado' }
    }

    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, role: true }
    })

    if (!user?.organization_id) {
        return { url: null, error: 'Organización no encontrada' }
    }

    // Solo admin/owner puede comprar/actualizar
    if (user.role !== 'admin' && user.role !== 'owner') {
        return { url: null, error: 'Solo el administrador puede gestionar la suscripción' }
    }

    const customerId = await getOrCreateStripeCustomer(user.organization_id)
    if (!customerId) {
        return { url: null, error: 'Error al crear cliente en Stripe' }
    }

    // Resolver Price ID desde la configuración (Server-Side)
    const targetPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
    const priceId = targetPlan?.stripePriceId

    if (!priceId) {
        return { url: null, error: 'Configuración de precio no encontrada para este plan' }
    }

    try {
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                organizationId: user.organization_id,
                userId: session.user.id,
                targetPlanId: planId
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
            subscription_data: {
                metadata: {
                    organizationId: user.organization_id
                }
            }
        })

        return { url: checkoutSession.url }
    } catch (error: any) {
        console.error('Error creating checkout session:', error)
        return { url: null, error: error.message }
    }
}

/**
 * Create customer portal session for managing subscription
 */
export async function createCustomerPortalSession(): Promise<{ url: string | null; error?: string }> {
    const session = await auth()
    if (!session?.user?.id) {
        return { url: null, error: 'No autenticado' }
    }

    const user = await prisma.User.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) {
        return { url: null, error: 'Organización no encontrada' }
    }

    const org = await prisma.organizations.findUnique({
        where: { id: user.organization_id },
        select: { stripe_customer_id: true }
    })

    if (!org?.stripe_customer_id) {
        return { url: null, error: 'No hay suscripción activa' }
    }

    try {
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
        })

        return { url: portalSession.url }
    } catch (error: any) {
        console.error('Error creating portal session:', error)
        return { url: null, error: error.message }
    }
}

// ============================================================================
// SUBSCRIPTION MANAGEMENT
// ============================================================================

/**
 * Handle successful subscription (called by webhook)
 */
export async function activateProSubscription(
    organizationId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    periodStart: Date,
    periodEnd: Date
) {
    await prisma.organizations.update({
        where: { id: organizationId },
        data: {
            subscription_status: 'active',
            subscription_plan: 'pro',
            stripe_subscription_id: stripeSubscriptionId,
            max_employees: -1, // Unlimited for Pro
            subscription_ends_at: periodEnd,
            updated_at: new Date()
        }
    })

    // Create subscription record
    await prisma.subscriptions.upsert({
        where: { stripe_subscription_id: stripeSubscriptionId },
        create: {
            organization_id: organizationId,
            stripe_subscription_id: stripeSubscriptionId,
            stripe_price_id: stripePriceId,
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd
        },
        update: {
            status: 'active',
            current_period_start: periodStart,
            current_period_end: periodEnd,
            updated_at: new Date()
        }
    })

    revalidatePath('/dashboard')
}

/**
 * Handle subscription cancellation
 */
export async function cancelSubscription(organizationId: string) {
    await prisma.organizations.update({
        where: { id: organizationId },
        data: {
            subscription_status: 'canceled',
            subscription_plan: 'basic',
            max_employees: 0,
            updated_at: new Date()
        }
    })

    revalidatePath('/dashboard')
}

/**
 * Update employee count for organization
 */
export async function updateEmployeeCount(organizationId: string, count: number) {
    await prisma.organizations.update({
        where: { id: organizationId },
        data: {
            current_employee_count: count,
            updated_at: new Date()
        }
    })
}
