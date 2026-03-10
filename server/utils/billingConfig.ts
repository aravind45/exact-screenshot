import { TRIAL_DAYS } from "./trialUtils.js";

export interface StripeBillingConfig {
    secretKeyConfigured: boolean;
    publishableKeyConfigured: boolean;
    priceIdConfigured: boolean;
    extraSeatPriceIdConfigured: boolean;
    webhookSecretConfigured: boolean;
    mode: "test" | "live" | "unconfigured";
    trialDays: number;
    subscriptionCheckoutEnabled: boolean;
    extraSeatCheckoutEnabled: boolean;
    missingForSubscription: string[];
    missingForExtraSeat: string[];
}

const normalize = (value: string | undefined): string => (value || "").trim();

const isPlaceholder = (value: string): boolean => {
    const lowered = value.toLowerCase();
    return lowered.includes("placeholder") || lowered === "price_1234567890";
};

const hasRealValue = (value: string | undefined): boolean => {
    const normalized = normalize(value);
    return normalized.length > 0 && !isPlaceholder(normalized);
};

const getMode = (secretKey: string): "test" | "live" | "unconfigured" => {
    if (!secretKey) return "unconfigured";
    if (secretKey.startsWith("sk_live_")) return "live";
    if (secretKey.startsWith("sk_test_")) return "test";
    return "unconfigured";
};

const describeMissing = (token: string): string => {
    switch (token) {
        case "publishable_key":
            return "Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) is missing.";
        case "secret_key":
            return "Stripe secret key (STRIPE_SECRET_KEY) is missing.";
        case "price_id":
            return "Stripe subscription price ID (STRIPE_PRICE_ID) is missing.";
        case "extra_seat_price_id":
            return "Stripe extra seat price ID (STRIPE_EXTRA_SEAT_PRICE_ID) is missing.";
        case "webhook_secret":
            return "Stripe webhook secret (STRIPE_WEBHOOK_SECRET) is missing.";
        default:
            return "Stripe billing configuration is incomplete.";
    }
};

export function getCheckoutDisabledReason(missing: string[]): string {
    if (missing.length === 0) {
        return "Billing checkout is available.";
    }

    if (missing.length === 1) {
        return describeMissing(missing[0]);
    }

    const parts = missing.map(describeMissing);
    return `Billing setup is incomplete: ${parts.join(" ")}`;
}

export function getStripeBillingConfig(env: NodeJS.ProcessEnv = process.env): StripeBillingConfig {
    const secretKey = normalize(env.STRIPE_SECRET_KEY);
    const publishableKey = normalize(env.VITE_STRIPE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || env.STRIPE_PUBLISHABLE_KEY);
    const priceId = normalize(env.STRIPE_PRICE_ID);
    const extraSeatPriceId = normalize(env.STRIPE_EXTRA_SEAT_PRICE_ID);
    const webhookSecret = normalize(env.STRIPE_WEBHOOK_SECRET);

    const secretKeyConfigured = hasRealValue(secretKey);
    const publishableKeyConfigured = hasRealValue(publishableKey);
    const priceIdConfigured = hasRealValue(priceId);
    const extraSeatPriceIdConfigured = hasRealValue(extraSeatPriceId);
    const webhookSecretConfigured = hasRealValue(webhookSecret);

    const missingForSubscription: string[] = [];
    if (!publishableKeyConfigured) missingForSubscription.push("publishable_key");
    if (!secretKeyConfigured) missingForSubscription.push("secret_key");
    if (!priceIdConfigured) missingForSubscription.push("price_id");

    const missingForExtraSeat: string[] = [];
    if (!publishableKeyConfigured) missingForExtraSeat.push("publishable_key");
    if (!secretKeyConfigured) missingForExtraSeat.push("secret_key");
    if (!extraSeatPriceIdConfigured) missingForExtraSeat.push("extra_seat_price_id");

    return {
        secretKeyConfigured,
        publishableKeyConfigured,
        priceIdConfigured,
        extraSeatPriceIdConfigured,
        webhookSecretConfigured,
        mode: getMode(secretKey),
        trialDays: TRIAL_DAYS,
        subscriptionCheckoutEnabled: missingForSubscription.length === 0,
        extraSeatCheckoutEnabled: missingForExtraSeat.length === 0,
        missingForSubscription,
        missingForExtraSeat,
    };
}


