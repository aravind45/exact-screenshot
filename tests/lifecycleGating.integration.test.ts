/**
 * Estate Lifecycle Gating — Integration Tests
 *
 * These tests go beyond unit-testing checkEstateStatusGate() and exercise
 * the full middleware + gate resolution pipeline:
 *
 *   1. DRAFT estate → GET /api/estates/:id/roadmap → 409 {code:"INCOMPLETE_ESTATE"}
 *   2. DRAFT estate → GET /api/liabilities → 409 (not 500)
 *   3. MINIMUM_READY + PROBATE → GET /api/estates/:id/roadmap → 200, no TRUST tasks
 *
 * Because the project does not include supertest, these tests exercise the
 * middleware factory and gate resolver directly against mock req/res pairs,
 * which is functionally identical to what Express does at runtime.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    checkEstateStatusGate,
    resolveEstateStatusGate,
    requireEstateStatus,
    requireTaskCompletionAllowed,
    ESTATE_GATES,
    SAFE_TASK_IDS_FOR_MINIMUM_READY,
    type EstateStatus,
    type EstateGateConfig,
} from "../server/middleware/estateStatusGating";

// ---------------------------------------------------------------------------
// Helpers: mock Express req / res / next
// ---------------------------------------------------------------------------
function mockReq(overrides: Record<string, any> = {}) {
    return {
        user: { id: "test-user-id" },
        params: {},
        estateId: undefined,
        ...overrides,
    } as any;
}

function mockRes() {
    const res: any = {
        statusCode: 0,
        body: null,
        status(code: number) {
            res.statusCode = code;
            return res;
        },
        json(data: any) {
            res.body = data;
            return res;
        },
    };
    return res;
}

// ---------------------------------------------------------------------------
// Prisma mock — inject controlled estate records
// ---------------------------------------------------------------------------
vi.mock("../server/db", () => {
    let mockEstates: Record<string, any> = {};

    return {
        prisma: {
            estate: {
                findUnique: vi.fn(async ({ where }: any) => mockEstates[where.id] ?? null),
                findFirst: vi.fn(async ({ where }: any) => {
                    const userId = where?.OR?.[0]?.userId ?? where?.userId;
                    return Object.values(mockEstates).find((e: any) => e.userId === userId) ?? null;
                }),
            },
            // Expose setter for tests
            __setMockEstates: (estates: Record<string, any>) => {
                mockEstates = estates;
            },
        },
    };
});

// Import after mock is registered
import { prisma } from "../server/db";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------
const DRAFT_ESTATE = {
    id: "estate-draft-001",
    userId: "test-user-id",
    estateStatus: "DRAFT",
    deceasedState: null,
    userSelectedEstateAuthorityType: null,
    estateAuthorityType: null,
    completenessLevel: "UNSET",
};

const MINIMUM_READY_ESTATE = {
    id: "estate-ready-001",
    userId: "test-user-id",
    estateStatus: "MINIMUM_READY",
    deceasedState: "OH",
    userSelectedEstateAuthorityType: "PROBATE",
    estateAuthorityType: "PROBATE",
    completenessLevel: "MINIMUM_READY",
};

const ACTIVE_ESTATE = {
    id: "estate-active-001",
    userId: "test-user-id",
    estateStatus: "ACTIVE",
    deceasedState: "OH",
    userSelectedEstateAuthorityType: "PROBATE",
    estateAuthorityType: "PROBATE",
    completenessLevel: "PROFILE_READY",
};

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1:  DRAFT estate → Roadmap → 409
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: DRAFT estate → GET /api/estates/:id/roadmap", () => {
    beforeEach(() => {
        (prisma as any).__setMockEstates({
            [DRAFT_ESTATE.id]: DRAFT_ESTATE,
        });
    });

    it("returns 409 with code INCOMPLETE_ESTATE", async () => {
        const middleware = requireEstateStatus(ESTATE_GATES.ROADMAP);
        const req = mockReq({ params: { id: DRAFT_ESTATE.id } });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        // ── Assertions ──────────────────────────────────────────────────
        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({
            code: "INCOMPLETE_ESTATE",
            currentStatus: "DRAFT",
            requiredStatus: "MINIMUM_READY",
            requiredStep: expect.any(String),
        });
    });

    it("409 body matches expected response shape", async () => {
        const middleware = requireEstateStatus(ESTATE_GATES.ROADMAP);
        const req = mockReq({ params: { id: DRAFT_ESTATE.id } });
        const res = mockRes();
        await middleware(req, res, vi.fn());

        /**
         * ── Sample 409 Response Body ─────────────────────────────────
         * {
         *   "error": "Complete estate setup to access the roadmap",
         *   "code": "INCOMPLETE_ESTATE",
         *   "currentStatus": "DRAFT",
         *   "requiredStatus": "MINIMUM_READY",
         *   "requiredStep": "TRACK_SELECTION"
         * }
         */
        expect(res.body.error).toBeDefined();
        expect(res.body.code).toBe("INCOMPLETE_ESTATE");
        expect(res.body.requiredStep).toBe("TRACK_SELECTION");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2:  DRAFT estate → Liabilities → 409 (not 500)
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: DRAFT estate → GET /api/liabilities", () => {
    beforeEach(() => {
        (prisma as any).__setMockEstates({
            [DRAFT_ESTATE.id]: DRAFT_ESTATE,
        });
    });

    it("returns 409, never 500", async () => {
        // liabilityRoutes.ts uses: router.use(requireEstateStatus(ESTATE_GATES.ROADMAP))
        // ESTATE_GATES.ROADMAP requires MINIMUM_READY
        const middleware = requireEstateStatus(ESTATE_GATES.ROADMAP);
        const req = mockReq({}); // No estate ID in params — middleware looks up by userId
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body.code).toBe("INCOMPLETE_ESTATE");
        // Key assertion: NEVER a 500
        expect(res.statusCode).not.toBe(500);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3:  MINIMUM_READY + PROBATE → Roadmap → 200, no TRUST tasks
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: MINIMUM_READY estate → GET /api/estates/:id/roadmap gate passes", () => {
    beforeEach(() => {
        (prisma as any).__setMockEstates({
            [MINIMUM_READY_ESTATE.id]: MINIMUM_READY_ESTATE,
        });
    });

    it("middleware calls next() — gate opens for MINIMUM_READY", async () => {
        const middleware = requireEstateStatus(ESTATE_GATES.ROADMAP);
        const req = mockReq({ params: { id: MINIMUM_READY_ESTATE.id } });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        // ── The gate MUST open ──────────────────────────────────────
        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBe(0); // status() never called
        expect(res.body).toBeNull(); // json() never called
    });

    it("ACTIVE estate also passes ROADMAP gate", async () => {
        (prisma as any).__setMockEstates({
            [ACTIVE_ESTATE.id]: ACTIVE_ESTATE,
        });

        const middleware = requireEstateStatus(ESTATE_GATES.ROADMAP);
        const req = mockReq({ params: { id: ACTIVE_ESTATE.id } });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 4:  resolveEstateStatusGate — full pipeline
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: resolveEstateStatusGate pipeline", () => {
    beforeEach(() => {
        (prisma as any).__setMockEstates({
            [DRAFT_ESTATE.id]: DRAFT_ESTATE,
            [MINIMUM_READY_ESTATE.id]: MINIMUM_READY_ESTATE,
            [ACTIVE_ESTATE.id]: ACTIVE_ESTATE,
        });
    });

    it("DRAFT → ROADMAP gate → closed", async () => {
        const result = await resolveEstateStatusGate(DRAFT_ESTATE.id, ESTATE_GATES.ROADMAP);
        expect(result.isOpen).toBe(false);
        expect(result.currentStatus).toBe("DRAFT");
        expect(result.requiredStatus).toBe("MINIMUM_READY");
        expect(result.code).toBe("INCOMPLETE_ESTATE");
    });

    it("MINIMUM_READY → ROADMAP gate → open", async () => {
        const result = await resolveEstateStatusGate(MINIMUM_READY_ESTATE.id, ESTATE_GATES.ROADMAP);
        expect(result.isOpen).toBe(true);
        expect(result.currentStatus).toBe("MINIMUM_READY");
        expect(result.code).toBe("ACCESS_GRANTED");
    });

    it("MINIMUM_READY → ACTIVE_FEATURES gate → closed", async () => {
        const result = await resolveEstateStatusGate(MINIMUM_READY_ESTATE.id, ESTATE_GATES.ACTIVE_FEATURES);
        expect(result.isOpen).toBe(false);
        expect(result.currentStatus).toBe("MINIMUM_READY");
        expect(result.requiredStatus).toBe("ACTIVE");
    });

    it("ACTIVE → ACTIVE_FEATURES gate → open", async () => {
        const result = await resolveEstateStatusGate(ACTIVE_ESTATE.id, ESTATE_GATES.ACTIVE_FEATURES);
        expect(result.isOpen).toBe(true);
        expect(result.code).toBe("ACCESS_GRANTED");
    });

    it("nonexistent estate → closed with ESTATE_NOT_FOUND", async () => {
        const result = await resolveEstateStatusGate("does-not-exist", ESTATE_GATES.ROADMAP);
        expect(result.isOpen).toBe(false);
        expect(result.code).toBe("ESTATE_NOT_FOUND");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 5:  PROBATE estate → no TRUST-only tasks in roadmap config
// ═══════════════════════════════════════════════════════════════════════════
import { SETTLEMENT_PHASE_TASKS } from "../src/config/settlementPhases";
import { filterTasksByAuthorityScope } from "../src/shared/filterByJurisdiction";

const TRUST_ONLY_TASK_IDS = new Set([
    "locate_trust",
    "identify_successor_trustee",
    "sign_trustee_acceptance",
    "prepare_certification_of_trust",
    "issue_cert_trust",
    "notify_trust_beneficiaries",
    "distribute_trust_assets",
    "file_trust_tax_return",
    "close_trust_accounts",
    "complete_trust_administration",
]);

describe("Integration: PROBATE authority → roadmap contains zero TRUST-only tasks", () => {
    it("filterTasksByAuthorityScope('PROBATE') excludes all TRUST-only tasks", () => {
        const allPhases = Object.values(SETTLEMENT_PHASE_TASKS);
        const allTasks = allPhases.flatMap((phase: any) =>
            Array.isArray(phase.tasks) ? phase.tasks : []
        );

        const { kept: probateTasks } = filterTasksByAuthorityScope(allTasks, "PROBATE" as any);
        const leakedTrustTasks = probateTasks.filter((t: any) =>
            TRUST_ONLY_TASK_IDS.has(t.id)
        );

        /**
         * ── Expected: zero TRUST-only tasks in PROBATE roadmap ──────
         * If this test fails, a TRUST task leaked into the PROBATE view.
         */
        expect(leakedTrustTasks).toEqual([]);
        expect(leakedTrustTasks.length).toBe(0);
    });

    it("all phases after filtering have at least 0 tasks (no crashes)", () => {
        const allPhases = Object.values(SETTLEMENT_PHASE_TASKS);
        for (const phase of allPhases) {
            const tasks = Array.isArray((phase as any).tasks) ? (phase as any).tasks : [];
            const { kept } = filterTasksByAuthorityScope(tasks, "PROBATE" as any);
            // Should not throw, and kept should be an array
            expect(Array.isArray(kept)).toBe(true);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 6:  Middleware application evidence (static assertions)
// ═══════════════════════════════════════════════════════════════════════════
describe("Middleware application evidence", () => {
    it("ESTATE_GATES.ROADMAP requires MINIMUM_READY", () => {
        expect(ESTATE_GATES.ROADMAP.requiredStatus).toBe("MINIMUM_READY");
        expect(ESTATE_GATES.ROADMAP.wizardStep).toBe("TRACK_SELECTION");
    });

    it("ESTATE_GATES.ACTIVE_FEATURES requires ACTIVE", () => {
        expect(ESTATE_GATES.ACTIVE_FEATURES.requiredStatus).toBe("ACTIVE");
    });

    it("ESTATE_GATES.FULL_ADMINISTRATION requires ACTIVE", () => {
        expect(ESTATE_GATES.FULL_ADMINISTRATION.requiredStatus).toBe("ACTIVE");
    });

    it("ESTATE_GATES.READ_ONLY requires MINIMUM_READY", () => {
        expect(ESTATE_GATES.READ_ONLY.requiredStatus).toBe("MINIMUM_READY");
    });

    /**
     * ── Where middleware is applied ────────────────────────────────
     *
     * FILE: server/routes/liabilityRoutes.ts
     * LINE: 33-34
     *   router.use(requireEstateStatus(ESTATE_GATES.ROADMAP));
     *   → Applies to ALL routes in liabilityRoutes
     *   → Requires: MINIMUM_READY
     *
     * FILE: server/routes/discoveryRoutes.ts
     * LINE: 13-14
     *   router.use(requireEstateStatus(ESTATE_GATES.ROADMAP));
     *   → Applies to ALL routes in discoveryRoutes
     *   → Requires: MINIMUM_READY
     *
     * FILE: server/routes/estateRoutes.ts
     * LINE: 1125 (roadmap)
     *   router.get("/:id/roadmap", requireSubscription,
     *     requireEstateStatus(ESTATE_GATES.ROADMAP), ...)
     *   → Per-route, requires MINIMUM_READY
     *
     * LINE: ~1401 (task completion)
     *   router.post("/:id/tasks/:taskId/complete", requireSubscription,
     *     requireEstateStatus(ESTATE_GATES.ROADMAP), ...)
     *   → Per-route, requires MINIMUM_READY
     *
     * LINE: 995 (accounting-readiness)
     *   router.get("/my/accounting-readiness",
     *     requireEstateStatus({ requiredStatus: "MINIMUM_READY", ... }), ...)
     *   → Per-route, requires MINIMUM_READY
     *
     * FILE: server/routes/assetRoutes.ts
     *   → NO estate status gating applied
     *   → Assets are accessible regardless of estate status
     */
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 7:  MINIMUM_READY safety - tightened hasMinimumSetup
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: MINIMUM_READY safety - hasMinimumSetup", () => {
    beforeEach(() => {
        (prisma as any).__setMockEstates({});
    });

    it("legacy estate with completenessLevel='MINIMUM_READY' but no authority type → treated as DRAFT", async () => {
        const legacyEstateWithCompletenessOnly = {
            id: "estate-legacy-001",
            userId: "test-user-id",
            estateStatus: null, // legacy estate
            deceasedState: "OH",
            userSelectedEstateAuthorityType: null,
            estateAuthorityType: null,
            completenessLevel: "MINIMUM_READY",
        };

        (prisma as any).__setMockEstates({
            [legacyEstateWithCompletenessOnly.id]: legacyEstateWithCompletenessOnly,
        });

        const result = await resolveEstateStatusGate(legacyEstateWithCompletenessOnly.id, ESTATE_GATES.ROADMAP);
        // TIGHTENED: should NOT be treated as MINIMUM_READY since no authority type selected
        expect(result.isOpen).toBe(false);
        expect(result.currentStatus).toBe("DRAFT");
    });

    it("legacy estate with completenessLevel='PROFILE_READY' but no authority type → treated as DRAFT", async () => {
        const legacyEstateProfileReady = {
            id: "estate-legacy-002",
            userId: "test-user-id",
            estateStatus: null,
            deceasedState: "OH",
            userSelectedEstateAuthorityType: null,
            estateAuthorityType: null,
            completenessLevel: "PROFILE_READY",
        };

        (prisma as any).__setMockEstates({
            [legacyEstateProfileReady.id]: legacyEstateProfileReady,
        });

        const result = await resolveEstateStatusGate(legacyEstateProfileReady.id, ESTATE_GATES.ROADMAP);
        expect(result.isOpen).toBe(false);
        expect(result.currentStatus).toBe("DRAFT");
    });

    it("legacy estate with state AND authority type → treated as MINIMUM_READY", async () => {
        const legacyEstateWithAuthority = {
            id: "estate-legacy-003",
            userId: "test-user-id",
            estateStatus: null,
            deceasedState: "OH",
            userSelectedEstateAuthorityType: "PROBATE",
            estateAuthorityType: "PROBATE",
            completenessLevel: "UNSET",
        };

        (prisma as any).__setMockEstates({
            [legacyEstateWithAuthority.id]: legacyEstateWithAuthority,
        });

        const result = await resolveEstateStatusGate(legacyEstateWithAuthority.id, ESTATE_GATES.ROADMAP);
        expect(result.isOpen).toBe(true);
        expect(result.currentStatus).toBe("MINIMUM_READY");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 8:  Task completion allowlist for MINIMUM_READY estates
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: Task completion allowlist for MINIMUM_READY estates", () => {
    const MINIMUM_READY_ESTATE_NO_AUTH = {
        id: "estate-min-001",
        userId: "test-user-id",
        estateStatus: "MINIMUM_READY",
        deceasedState: "OH",
        userSelectedEstateAuthorityType: "PROBATE",
        estateAuthorityType: null,
        completenessLevel: "MINIMUM_READY",
    };

    beforeEach(() => {
        (prisma as any).__setMockEstates({
            [MINIMUM_READY_ESTATE_NO_AUTH.id]: MINIMUM_READY_ESTATE_NO_AUTH,
        });
    });

    it("MINIMUM_READY estate CAN complete allowlisted tasks (preliminary_asset_scan)", async () => {
        // Simulate the estateGate being attached by requireEstateStatus middleware
        const estateGate = await resolveEstateStatusGate(MINIMUM_READY_ESTATE_NO_AUTH.id, ESTATE_GATES.ROADMAP);
        expect(estateGate.isOpen).toBe(true);

        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "preliminary_asset_scan" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBe(0);
    });

    it("MINIMUM_READY estate CAN complete allowlisted tasks (secure_property)", async () => {
        const estateGate = await resolveEstateStatusGate(MINIMUM_READY_ESTATE_NO_AUTH.id, ESTATE_GATES.ROADMAP);
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "secure_property" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it("MINIMUM_READY estate CANNOT complete non-allowlisted tasks (file_probate_petition)", async () => {
        const estateGate = await resolveEstateStatusGate(MINIMUM_READY_ESTATE_NO_AUTH.id, ESTATE_GATES.ROADMAP);
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "file_probate_petition" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body).toMatchObject({
            error: "This task requires legal authority to be established",
            code: "AUTHORITY_REQUIRED",
            taskId: "file_probate_petition",
            requiredStep: "AUTHORITY_SETUP",
        });
    });

    it("MINIMUM_READY estate CANNOT complete non-allowlisted tasks (open_estate_account)", async () => {
        const estateGate = await resolveEstateStatusGate(MINIMUM_READY_ESTATE_NO_AUTH.id, ESTATE_GATES.ROADMAP);
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "open_estate_account" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body.code).toBe("AUTHORITY_REQUIRED");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 9:  ACTIVE estate can complete any task
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: ACTIVE estate can complete any task", () => {
    beforeEach(() => {
        (prisma as any).__setMockEstates({
            [ACTIVE_ESTATE.id]: ACTIVE_ESTATE,
        });
    });

    it("ACTIVE estate can complete allowlisted tasks", async () => {
        const estateGate = await resolveEstateStatusGate(ACTIVE_ESTATE.id, ESTATE_GATES.ROADMAP);
        expect(estateGate.currentStatus).toBe("ACTIVE");

        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "preliminary_asset_scan" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });

    it("ACTIVE estate can complete non-allowlisted tasks (file_probate_petition)", async () => {
        const estateGate = await resolveEstateStatusGate(ACTIVE_ESTATE.id, ESTATE_GATES.ROADMAP);
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "file_probate_petition" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(res.statusCode).toBe(0);
    });

    it("ACTIVE estate can complete any task (receive_letters_testamentary)", async () => {
        const estateGate = await resolveEstateStatusGate(ACTIVE_ESTATE.id, ESTATE_GATES.ROADMAP);
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "receive_letters_testamentary" },
            estateGate,
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 10:  Safe task allowlist constants
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: Safe task allowlist constants", () => {
    it("SAFE_TASK_IDS_FOR_MINIMUM_READY contains expected safe tasks", () => {
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("preliminary_asset_scan")).toBe(true);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("locate_will")).toBe(true);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("secure_property")).toBe(true);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("notify_ssa")).toBe(true);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("cancel_cards")).toBe(true);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("check_small_estate")).toBe(true);
    });

    it("SAFE_TASK_IDS_FOR_MINIMUM_READY does NOT contain authority-requiring tasks", () => {
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("file_probate_petition")).toBe(false);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("open_estate_account")).toBe(false);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("receive_letters_testamentary")).toBe(false);
        expect(SAFE_TASK_IDS_FOR_MINIMUM_READY.has("distribute_assets")).toBe(false);
    });

    it("ESTATE_GATES.TASK_COMPLETION exists and requires MINIMUM_READY", () => {
        expect(ESTATE_GATES.TASK_COMPLETION).toBeDefined();
        expect(ESTATE_GATES.TASK_COMPLETION.requiredStatus).toBe("MINIMUM_READY");
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 11:  requireTaskCompletionAllowed without estateGate
// ═══════════════════════════════════════════════════════════════════════════
describe("Integration: requireTaskCompletionAllowed edge cases", () => {
    it("returns 409 if estateGate is not present on request", async () => {
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({ params: { taskId: "some_task" } }); // No estateGate
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body.code).toBe("INCOMPLETE_ESTATE");
    });

    it("returns 409 if estateGate.isOpen is false", async () => {
        const middleware = requireTaskCompletionAllowed("taskId");
        const req = mockReq({
            params: { taskId: "some_task" },
            estateGate: { isOpen: false, wizardStep: "TRACK_SELECTION" },
        });
        const res = mockRes();
        const next = vi.fn();

        await middleware(req, res, next);

        expect(next).not.toHaveBeenCalled();
        expect(res.statusCode).toBe(409);
        expect(res.body.requiredStep).toBe("TRACK_SELECTION");
    });
});
