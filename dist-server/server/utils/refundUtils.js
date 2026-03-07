export function getRefundEligibility(transaction) {
    if (!transaction) {
        return { eligible: false, reason: "Transaction not found" };
    }
    if ((transaction.type || "").toUpperCase() !== "PAYMENT") {
        return { eligible: false, reason: "Only successful payment transactions can be refunded" };
    }
    if ((transaction.status || "").toUpperCase() !== "SUCCESS") {
        return { eligible: false, reason: "Only successful payment transactions can be refunded" };
    }
    const amount = Number(transaction.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { eligible: false, reason: "Refund amount is invalid for this transaction" };
    }
    const paymentIntentId = (transaction.stripePaymentIntentId || "").trim();
    if (!paymentIntentId.startsWith("pi_")) {
        return { eligible: false, reason: "Transaction is missing a valid Stripe payment intent" };
    }
    return { eligible: true };
}
