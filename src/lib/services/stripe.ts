import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * Valida que STRIPE_SECRET_KEY esté configurado
 * En producción, falla si no está presente (no usa dummy keys)
 */
function validateStripeKey(): string {
    if (!stripeSecretKey) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error(
                'STRIPE_SECRET_KEY is required in production. ' +
                'Please set it in your environment variables.'
            );
        }
        // En desarrollo, permite continuar pero con advertencia clara
        console.warn(
            '⚠️  STRIPE_SECRET_KEY is missing. ' +
            'Stripe functionality will not work. ' +
            'Set STRIPE_SECRET_KEY in .env.local for development.'
        );
        // Retornar string vacío - Stripe fallará en runtime si se intenta usar
        return '';
    }
    return stripeSecretKey;
}

const validatedKey = validateStripeKey();

/**
 * Cliente de Stripe - Solo se inicializa si la key está presente
 * En producción, falla si la key no está configurada
 */
export const stripe = validatedKey 
    ? new Stripe(validatedKey, {
          apiVersion: '2024-12-18.acacia',
          typescript: true,
      })
    : null;

export async function createCheckoutSession(priceId: string, userId: string): Promise<string | null> {
    // Validación estricta - no permite operaciones sin key válida
    if (!stripe || !stripeSecretKey) {
        const errorMsg = process.env.NODE_ENV === 'production'
            ? 'Stripe is not configured. Contact support.'
            : 'Stripe Secret Key missing. Set STRIPE_SECRET_KEY in .env.local';
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    try {
        const session = await stripe.checkout.sessions.create({
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
