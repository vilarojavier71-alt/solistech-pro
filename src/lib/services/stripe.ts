import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
    // In production this should be a critical error, but for build safety we allow it to warn 
    // and fail at runtime if the key is missing.
    console.warn('STRIPE_SECRET_KEY is missing. Stripe functionality will not work.');
}

export const stripe = new Stripe(stripeSecretKey || 'sk_test_dummy_key_for_build', {
    apiVersion: '2024-12-18.acacia', // Ensure this version matches your Stripe dashboard or latest supported
    typescript: true,
});

export async function createCheckoutSession(priceId: string, userId: string): Promise<string | null> {
    if (!stripeSecretKey) {
        console.error('Stripe Secret Key missing');
        return null;
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
