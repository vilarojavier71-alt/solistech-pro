import Stripe from 'stripe';

// Lazy-loaded singleton to avoid build-time initialization errors
let _stripe: Stripe | null = null;
let _stripeInitialized = false;

/**
 * Obtiene el cliente de Stripe con inicialización lazy
 * Evita errores durante el build de Next.js
 */
export function getStripe(): Stripe | null {
    if (_stripeInitialized) {
        return _stripe;
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
        if (process.env.NODE_ENV === 'production') {
            console.error('STRIPE_SECRET_KEY is required in production.');
        }
        _stripeInitialized = true;
        return null;
    }

    _stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2024-12-18.acacia',
        typescript: true,
    });
    _stripeInitialized = true;
    return _stripe;
}

/**
 * Export for backwards compatibility - aliased to getStripe()
 * @deprecated Use getStripe() instead
 */
export const stripe = {
    get webhooks() { return getStripe()?.webhooks; },
    get subscriptions() { return getStripe()?.subscriptions; },
    get checkout() { return getStripe()?.checkout; },
} as unknown as Stripe | null;

export async function createCheckoutSession(priceId: string, userId: string): Promise<string | null> {
    const stripeClient = getStripe();

    // Validación estricta - no permite operaciones sin cliente válido
    if (!stripeClient) {
        const errorMsg = process.env.NODE_ENV === 'production'
            ? 'Stripe is not configured. Contact support.'
            : 'Stripe Secret Key missing. Set STRIPE_SECRET_KEY in .env.local';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        const session = await stripeClient.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            metadata: {
                userId: userId,
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
            subscription_data: {
                metadata: {
                    userId: userId
                }
            }
        });

        return session.url;
    } catch (error) {
        console.error('Error creating stripe checkout session:', error);
        throw error;
    }
}
