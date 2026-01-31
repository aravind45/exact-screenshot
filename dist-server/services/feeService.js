/**
 * California Statutory Fee Calculator
 * Probate Code § 10800 & 10810
 */
export const FeeService = {
    calculateStatutoryFee(inventoryValue) {
        let remaining = inventoryValue;
        let fee = 0;
        // 4% on first $100k
        const tier1 = Math.min(remaining, 100000);
        fee += tier1 * 0.04;
        remaining -= tier1;
        if (remaining <= 0)
            return fee;
        // 3% on next $100k
        const tier2 = Math.min(remaining, 100000);
        fee += tier2 * 0.03;
        remaining -= tier2;
        if (remaining <= 0)
            return fee;
        // 2% on next $800k
        const tier3 = Math.min(remaining, 800000);
        fee += tier3 * 0.02;
        remaining -= tier3;
        if (remaining <= 0)
            return fee;
        // 1% on next $9M
        const tier4 = Math.min(remaining, 9000000);
        fee += tier4 * 0.01;
        remaining -= tier4;
        if (remaining <= 0)
            return fee;
        // 0.5% on next $15M
        const tier5 = Math.min(remaining, 15000000);
        fee += tier5 * 0.005;
        remaining -= tier5;
        // Over $25M is reasonable amount determined by court
        // detailed logic omitted for simplicity
        return fee;
    }
};
