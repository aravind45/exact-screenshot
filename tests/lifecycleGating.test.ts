import { describe, it, expect, vi } from "vitest";
import { checkEstateStatusGate, EstateStatus } from "../server/middleware/estateStatusGating";
import { IncompleteEstateError } from "../server/services/roadmapService";

describe("Estate Lifecycle Gating Logic", () => {
    describe("checkEstateStatusGate", () => {
        it("should allow access if current status is equal to required status", () => {
            expect(checkEstateStatusGate("MINIMUM_READY", "MINIMUM_READY")).toBe(true);
            expect(checkEstateStatusGate("ACTIVE", "ACTIVE")).toBe(true);
        });

        it("should allow access if current status is higher than required status", () => {
            expect(checkEstateStatusGate("ACTIVE", "MINIMUM_READY")).toBe(true);
            expect(checkEstateStatusGate("CLOSED", "ACTIVE")).toBe(true);
        });

        it("should deny access if current status is lower than required status", () => {
            expect(checkEstateStatusGate("DRAFT", "MINIMUM_READY")).toBe(false);
            expect(checkEstateStatusGate("MINIMUM_READY", "ACTIVE")).toBe(false);
        });
    });

    describe("IncompleteEstateError", () => {
        it("should have correct properties", () => {
            const error = new IncompleteEstateError("Missing state", "STATE_SELECTION", "DRAFT");
            expect(error.message).toBe("Missing state");
            expect(error.code).toBe("INCOMPLETE_ESTATE");
            expect(error.requiredStep).toBe("STATE_SELECTION");
            expect(error.currentStatus).toBe("DRAFT");
        });
    });
});
