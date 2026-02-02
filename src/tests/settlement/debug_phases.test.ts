
import { describe, it, expect } from 'vitest';
import { SETTLEMENT_PHASE_TASKS } from '../../config/settlementPhases';
import { generateRoadmap } from '../../config/roadmapGenerator';
import { calculateAuthorityRecommendation } from '../../lib/authorityEngine';

describe("Debug Phases", () => {
    it("should calculate recommendation correctly", () => {
        const assets = [{ id: "1", institution: "Robinhood", ownershipType: "INDIVIDUAL", balance: 200000 }];
        const rec = calculateAuthorityRecommendation(assets, "California");
        console.log("Rec Type:", rec.type);
        expect(rec.type).toBe("FORMAL_PROBATE");
    });
    it("should have populated SETTLEMENT_PHASE_TASKS", () => {
        console.log("Tasks Length:", SETTLEMENT_PHASE_TASKS.length);
        expect(SETTLEMENT_PHASE_TASKS.length).toBeGreaterThan(0);
    });

    it("should generate roadmap for FORMAL_PROBATE CA", () => {
        const roadmap = generateRoadmap("FORMAL_PROBATE", "California");
        console.log("Roadmap Length:", roadmap.length);
        expect(roadmap.length).toBeGreaterThan(0);
    });
});
