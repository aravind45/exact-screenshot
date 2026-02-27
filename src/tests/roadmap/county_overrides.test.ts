import { describe, it, expect, vi, beforeEach } from "vitest";
import { CountyOverrideService } from "../../../server/services/countyOverrideService";
import { prisma } from "../../../server/db";
import { PhaseTask } from "../../config/settlementPhases";

// Mock the prisma client
vi.mock("../../../server/db", () => ({
    prisma: {
        countyOverride: {
            findMany: vi.fn(),
        },
    },
}));

describe("CountyOverrideService", () => {
    const mockTasks: PhaseTask[] = [
        {
            id: "test_task_1",
            scope: "CORE",
            title: "Original Title",
            description: "Original Description",
        } as any,
        {
            id: "test_task_2",
            scope: "CORE",
            title: "Another Task",
            description: "Another Description",
        } as any,
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should apply overrides to whitelisted fields", async () => {
        const mockOverrides = [
            {
                taskId: "test_task_1",
                title: "County Specific Title",
                description: "County Specific Description",
                feeAmount: 50.0,
                primaryActionUrl: "https://county.gov/form",
                formNames: ["Form A"],
                attachments: [{ label: "Manual", url: "https://manual.pdf" }],
                updatedAt: new Date(),
            },
        ];

        (prisma.countyOverride.findMany as any).mockResolvedValue(mockOverrides);

        const result = await CountyOverrideService.applyOverrides("US-NJ", "Essex", mockTasks);

        expect(result[0].title).toBe("County Specific Title");
        expect(result[0].description).toBe("County Specific Description");
        expect((result[0] as any).countyMetadata.feeAmount).toBe(50);
        expect((result[0] as any).countyMetadata.formNames).toEqual(["Form A"]);

        // Task 2 should remain unchanged
        expect(result[1].title).toBe("Another Task");
        expect((result[1] as any).countyMetadata).toBeUndefined();
    });

    it("should generate a consistent hash for overrides", async () => {
        const updatedAt = new Date("2024-01-01T12:00:00Z");
        const mockOverrides = [
            { taskId: "task1", updatedAt },
            { taskId: "task2", updatedAt },
        ];

        (prisma.countyOverride.findMany as any).mockResolvedValue(mockOverrides);

        const hash1 = await CountyOverrideService.getOverrideHash("US-NJ", "Essex");
        const hash2 = await CountyOverrideService.getOverrideHash("US-NJ", "Essex");

        expect(hash1).toBe(hash2);
        expect(hash1).toBeDefined();

        // Check drift detection
        const mockOverridesDrifted = [
            { taskId: "task1", updatedAt: new Date() },
            { taskId: "task2", updatedAt },
        ];
        (prisma.countyOverride.findMany as any).mockResolvedValue(mockOverridesDrifted);
        const hash3 = await CountyOverrideService.getOverrideHash("US-NJ", "Essex");
        expect(hash3).not.toBe(hash1);
    });

    it("should fail safe if database query fails", async () => {
        (prisma.countyOverride.findMany as any).mockRejectedValue(new Error("DB Error"));

        const result = await CountyOverrideService.applyOverrides("US-NJ", "Essex", mockTasks);
        expect(result).toEqual(mockTasks);
    });
});
