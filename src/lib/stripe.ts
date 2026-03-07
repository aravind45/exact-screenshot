import { loadStripe, Stripe } from "@stripe/stripe-js";

const rawPublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const publishableKey = (rawPublishableKey || "").trim();
const isPlaceholder = publishableKey.toLowerCase().includes("placeholder");

export const isStripeConfigured = publishableKey.length > 0 && !isPlaceholder;

if (!isStripeConfigured) {
    console.warn("Stripe publishable key is missing or placeholder. Billing checkout is disabled.");
}

const stripePromise: Promise<Stripe | null> = isStripeConfigured
    ? loadStripe(publishableKey)
    : Promise.resolve(null);

export default stripePromise;
