'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/services/stripe'
import { revalidatePath } from 'next/cache'

/**
 * Get list of invoices for the organization
 */
export async function getInvoices() {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: 'Organización no encontrada' }

    const org = await prisma.organizations.findUnique({
        where: { id: user.organization_id },
        select: { stripe_customer_id: true }
    })

    if (!org?.stripe_customer_id) return { data: [] }

    try {
        const invoices = await stripe.invoices.list({
            customer: org.stripe_customer_id,
            limit: 10,
            status: 'paid'
        })

        const formattedInvoices = invoices.data.map(invoice => ({
            id: invoice.id,
            amount: invoice.total,
            currency: invoice.currency,
            status: invoice.status,
            date: new Date(invoice.created * 1000),
            pdf_url: invoice.invoice_pdf || invoice.hosted_invoice_url
        }))

        return { data: formattedInvoices }
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return { error: 'Error al recuperar facturas' }
    }
}

/**
 * Get payment methods for the organization
 */
export async function getPaymentMethods() {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true }
    })

    if (!user?.organization_id) return { error: 'Organización no encontrada' }

    const org = await prisma.organizations.findUnique({
        where: { id: user.organization_id },
        select: { stripe_customer_id: true }
    })

    if (!org?.stripe_customer_id) return { data: [] }

    try {
        const paymentMethods = await stripe.paymentMethods.list({
            customer: org.stripe_customer_id,
            type: 'card'
        })

        const formattedMethods = paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card?.brand,
            last4: pm.card?.last4,
            exp_month: pm.card?.exp_month,
            exp_year: pm.card?.exp_year,
            is_default: false // Stripe doesn't easily expose this in list, would need customer retrieval
        }))

        return { data: formattedMethods }
    } catch (error) {
        console.error('Error fetching payment methods:', error)
        return { error: 'Error al recuperar métodos de pago' }
    }
}

/**
 * Update billing details (Tax ID, Address)
 */
export async function updateBillingDetails(data: {
    taxId?: string
    billingEmail?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
}) {
    const session = await auth()
    if (!session?.user?.id) return { error: 'No autenticado' }

    const user = await prisma.users.findUnique({
        where: { id: session.user.id },
        select: { organization_id: true, role: true }
    })

    if (!user?.organization_id) return { error: 'Organización no encontrada' }
    if (user.role !== 'admin' && user.role !== 'owner') return { error: 'No tienes permisos' }

    try {
        // Update local organization data
        await prisma.organizations.update({
            where: { id: user.organization_id },
            data: {
                email: data.billingEmail, // Using main email as billing email for now
                tax_id: data.taxId,
                address: data.address ? {
                    address: data.address,
                    city: data.city,
                    postal_code: data.postalCode,
                    country: data.country
                } : undefined
            }
        })

        // Update Stripe Customer if exists
        const org = await prisma.organizations.findUnique({
            where: { id: user.organization_id },
            select: { stripe_customer_id: true }
        })

        if (org?.stripe_customer_id) {
            await stripe.customers.update(org.stripe_customer_id, {
                email: data.billingEmail,
                address: {
                    line1: data.address,
                    city: data.city,
                    postal_code: data.postalCode,
                    country: data.country || 'ES'
                },
                metadata: {
                    tax_id: data.taxId || ''
                }
            })
        }

        revalidatePath('/dashboard/settings')
        return { success: true }
    } catch (error) {
        console.error('Error updating billing details:', error)
        return { error: 'Error al actualizar datos de facturación' }
    }
}
