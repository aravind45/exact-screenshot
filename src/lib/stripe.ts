import { loadStripe, Stripe } from "@stripe/stripe-js";

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
export const isStripeConfigured = Boolean(publishableKey);

if (!isStripeConfigured) {
    console.warn("Stripe publishable key is missing. Billing checkout is disabled.");
}

const stripePromise: Promise<Stripe | null> = publishableKey
    ? loadStripe(publishableKey)
    : Promise.resolve(null);

export default stripePromise;
