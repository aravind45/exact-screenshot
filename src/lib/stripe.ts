import { loadStripe, Stripe } from '@stripe/stripe-js';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!publishableKey) {
    console.warn('⚠️ Stripe Publishable Key is missing. Stripe integration will be disabled. Check your .env file.');
}

// Initialize Stripe with publishable key (or null if missing)
const stripePromise: Promise<Stripe | null> = publishableKey
    ? loadStripe(publishableKey)
    : Promise.resolve(null);

export default stripePromise;
