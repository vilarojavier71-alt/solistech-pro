import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// ==========================================
// TYPES
// ==========================================

export type PaymentProvider = 'stripe' | 'gocardless' | 'transfer'
export type PaymentMethodType = 'card' | 'sepa_debit'

export interface PaymentIntentRequest {
    amount: number // in CENTS (e.g. 1000 = 10.00 EUR)
    currency: string
    description: string
    customerId?: string
    metadata?: Record<string, string>
}

export interface PaymentResult {
    success: boolean
    transactionId?: string
    clientSecret?: string
    status: 'pending' | 'succeeded' | 'requires_action' | 'failed'
    error?: string
}

export interface IPaymentGateway {
    createCustomer(email: string, name: string): Promise<string>
    createPaymentIntent(req: PaymentIntentRequest): Promise<PaymentResult>
    createSubscription(customerId: string, priceId: string): Promise<PaymentResult>
}

// ==========================================
// STRIPE IMPLEMENTATION (Mock)
// ==========================================

class StripeGateway implements IPaymentGateway {
    private apiKey: string

    constructor() {
        this.apiKey = process.env.STRIPE_SECRET_KEY || ''
        if (!this.apiKey) console.warn('Stripe Key missing')
    }

    async createCustomer(email: string, name: string): Promise<string> {
        return `cus_${Math.random().toString(36).substring(7)}`
    }

    async createPaymentIntent(req: PaymentIntentRequest): Promise<PaymentResult> {
        try {
            const clientSecret = `pi_${Math.random().toString(36)}_secret_${Math.random().toString(36)}`
            return {
                success: true,
                status: 'pending',
                clientSecret,
                transactionId: `pi_${Math.random().toString(36)}`
            }
        } catch (e: any) {
            return { success: false, status: 'failed', error: e.message }
        }
    }

    async createSubscription(customerId: string, priceId: string): Promise<PaymentResult> {
        return { success: true, status: 'succeeded', transactionId: 'sub_123' }
    }
}

// ==========================================
// GOCARDLESS IMPLEMENTATION (Mock)
// ==========================================

class GoCardlessGateway implements IPaymentGateway {
    async createCustomer(email: string, name: string): Promise<string> {
        return `gc_cus_${Math.random().toString(36)}`
    }

    async createPaymentIntent(req: PaymentIntentRequest): Promise<PaymentResult> {
        return {
            success: true,
            status: 'pending',
            transactionId: `gc_pm_${Math.random().toString(36)}`
        }
    }

    async createSubscription(customerId: string, priceId: string): Promise<PaymentResult> {
        return { success: true, status: 'succeeded', transactionId: 'gc_sub_123' }
    }
}

// ==========================================
// FACTORY
// ==========================================

export class PaymentFactory {
    static getGateway(provider: PaymentProvider = 'stripe'): IPaymentGateway {
        switch (provider) {
            case 'stripe': return new StripeGateway()
            case 'gocardless': return new GoCardlessGateway()
            default: return new StripeGateway()
        }
    }
}

// ==========================================
// HIGH LEVEL SERVICE (Migrated to Prisma)
// ==========================================

export async function processPayment(
    invoiceId: string,
    method: PaymentMethodType
) {
    const session = await auth()
    if (!session?.user) throw new Error('No autenticado')

    // 1. Fetch Invoice from Prisma
    const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId }
    })
    if (!invoice) throw new Error('Invoice not found')

    // 2. Select Gateway
    let gateway: IPaymentGateway
    if (method === 'sepa_debit') {
        gateway = PaymentFactory.getGateway('stripe')
    } else {
        gateway = PaymentFactory.getGateway('stripe')
    }

    // 3. Create Intent
    const amountCents = Math.round(Number(invoice.amount_due) * 100)

    const result = await gateway.createPaymentIntent({
        amount: amountCents,
        currency: invoice.currency || 'EUR',
        description: `Invoice ${invoice.number}`,
        metadata: { invoiceId: invoice.id, orgId: invoice.organization_id || '' }
    })

    // Note: financial_transactions table doesn't exist in Prisma schema
    // TODO: Add financial_transactions model for transaction logging

    return result
}
