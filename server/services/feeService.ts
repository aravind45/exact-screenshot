/**
 * California Statutory Fee Calculator
 *
 * Prob. Code §10800 (personal representative compensation) and
 * §10810 (attorney compensation) — both use the same graduated schedule.
 *
 * NOTE: tier data lives in the single source of truth
 * (src/lib/jurisdictionData.ts). This file re-exports for server-side
 * consumers; do not duplicate tier values here.
 */
import { calculateCAStatutoryFee } from "../../src/lib/jurisdictionData.js";

export const FeeService = {
    calculateStatutoryFee(inventoryValue: number): number {
        return calculateCAStatutoryFee(inventoryValue);
    }
};
