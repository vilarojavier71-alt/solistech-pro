import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/services/stripe'
import { prisma } from '@/lib/db'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string

    let event: Stripe.Event

    try {
        if (!webhookSecret) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing')
        }
        if (!stripe) {
            throw new Error('Stripe client not initialized - STRIPE_SECRET_KEY may be missing')
        }
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`)
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
    }

    // TypeScript type narrowing - stripe is guaranteed non-null after the check above
    const stripeClient = stripe!

    try {
        switch (event.type) {
            // ================================================================
            // CHECKOUT COMPLETED - New subscription
            // ================================================================
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const organizationId = session.metadata?.organizationId

                if (organizationId && session.subscription) {
                    // Fetch the full subscription details (using any to avoid Stripe type issues)
                    const subscription = await stripeClient.subscriptions.retrieve(
                        session.subscription as string
                    ) as any

                    await prisma.organization.update({
                        where: { id: organizationId },
                        data: {
                            subscription_status: 'active',
                            subscription_plan: 'pro',
                            stripe_customer_id: session.customer as string,
                            stripe_subscription_id: subscription.id,
                            max_employees: -1, // Unlimited for Pro
                            subscription_ends_at: new Date(subscription.current_period_end * 1000),
                            updated_at: new Date()
                        }
                    })

                    // Create subscription record
                    await prisma.subscription.upsert({
                        where: { stripe_subscription_id: subscription.id },
                        create: {
                            organization_id: organizationId,
                            stripe_subscription_id: subscription.id,
                            stripe_price_id: subscription.items.data[0]?.price.id || '',
                            status: 'active',
                            current_period_start: new Date(subscription.current_period_start * 1000),
                            current_period_end: new Date(subscription.current_period_end * 1000)
                        },
                        update: {
                            status: 'active',
                            current_period_start: new Date(subscription.current_period_start * 1000),
                            current_period_end: new Date(subscription.current_period_end * 1000),
                            updated_at: new Date()
                        }
                    })

                    console.log(`✅ Organization ${organizationId} upgraded to Pro`)
                } else {
                    console.warn('Webhook: checkout.session.completed without organizationId')
                }
                break
            }

            // ================================================================
            // SUBSCRIPTION UPDATED - Plan change, renewal, etc
            // ================================================================
            case 'customer.subscription.updated': {
                const subscription = event.data.object as any // Stripe.Subscription has type issues
                const organizationId = subscription.metadata?.organizationId

                if (organizationId) {
                    const status = subscription.status === 'active' ? 'active' :
                        subscription.status === 'past_due' ? 'past_due' :
                            subscription.status === 'canceled' ? 'canceled' : 'basic'

                    await prisma.organization.update({
                        where: { id: organizationId },
                        data: {
                            subscription_status: status,
                            subscription_ends_at: new Date(subscription.current_period_end * 1000),
                            updated_at: new Date()
                        }
                    })

                    // Update subscription record
                    await prisma.subscription.update({
                        where: { stripe_subscription_id: subscription.id },
                        data: {
                            status,
                            current_period_start: new Date(subscription.current_period_start * 1000),
                            current_period_end: new Date(subscription.current_period_end * 1000),
                            cancel_at_period_end: subscription.cancel_at_period_end,
                            updated_at: new Date()
                        }
                    })

                    console.log(`📝 Subscription updated for org ${organizationId}: ${status}`)
                }
                break
            }

            // ================================================================
            // SUBSCRIPTION DELETED - Canceled or expired
            // ================================================================
            case 'customer.subscription.deleted': {
                const subscription = event.data.object as any
                const organizationId = subscription.metadata?.organizationId

                if (organizationId) {
                    await prisma.organization.update({
                        where: { id: organizationId },
                        data: {
                            subscription_status: 'canceled',
                            subscription_plan: 'basic',
                            max_employees: 0,
                            stripe_subscription_id: null,
                            subscription_ends_at: null,
                            updated_at: new Date()
                        }
                    })

                    // Update subscription record
                    try {
                        await prisma.subscription.update({
                            where: { stripe_subscription_id: subscription.id },
                            data: {
                                status: 'canceled',
                                updated_at: new Date()
                            }
                        })
                    } catch (e) {
                        // Subscription record might not exist
                    }

                    console.log(`❌ Subscription canceled for org ${organizationId}`)
                }
                break
            }

            // ================================================================
            // INVOICE PAID - Successful payment
            // ================================================================
            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice
                console.log(`💰 Invoice paid: ${invoice.id} - ${invoice.amount_paid / 100}€`)
                // Could log to financial_transactions table if it exists
                break
            }

            // ================================================================
            // INVOICE PAYMENT FAILED - Failed charge
            // ================================================================
            case 'invoice.payment_failed': {
                const invoice = event.data.object as any // Stripe.Invoice has type issues
                const subscriptionId = invoice.subscription as string | null

                if (subscriptionId) {
                    const sub = await stripeClient.subscriptions.retrieve(subscriptionId)
                    const organizationId = sub.metadata?.organizationId

                    if (organizationId) {
                        await prisma.organization.update({
                            where: { id: organizationId },
                            data: {
                                subscription_status: 'past_due',
                                updated_at: new Date()
                            }
                        })
                        console.log(`⚠️ Payment failed for org ${organizationId}`)
                    }
                }
                break
            }

            default:
                // Unhandled event type
                break
        }
    } catch (error) {
        console.error('Error processing webhook:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }

    return new NextResponse(null, { status: 200 })
}
