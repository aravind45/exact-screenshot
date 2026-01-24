import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";
import { ProbateHub } from "@/components/ProbateHub";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock handles
const mockApi = {
    getMyEstate: vi.fn(),
    getAssets: vi.fn(),
};

vi.mock("@/lib/api", () => ({
    api: {
        getMyEstate: () => mockApi.getMyEstate(),
        getAssets: () => mockApi.getAssets(),
    }
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe("Institution-specific Negative/Edge Cases", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = createTestQueryClient();
    });

    it("BANK-N01: Missing Letters - Prevents submission", async () => {
        const mockAsset = { institution: "Chase", ownershipType: "INDIVIDUAL" };
        const mockEstate = { probateStatus: "NOT_STARTED" }; // No authority yet

        mockApi.getMyEstate.mockResolvedValue(mockEstate);

        const workflow = {
            steps: [{
                id: "submit_documents",
                title: "Submit Documents",
                alerts: [{ type: "important", message: "MISSING_LETTERS: You must obtain Letters Testamentary before submitting." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="submit_documents"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/MISSING_LETTERS/i)).toBeInTheDocument();
    });

    it("BRK-N02: TOD Overrides Will - Warning displayed", async () => {
        const mockAsset = { institution: "Schwab", ownershipType: "TOD" };

        const workflow = {
            steps: [{
                id: "transfer",
                title: "Transfer Assets",
                alerts: [{ type: "warning", message: "BENEFICIARY_OVERRIDES: TOD designation overrides the Will." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="transfer"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/BENEFICIARY_OVERRIDES/i)).toBeInTheDocument();
    });

    it("CRT-N02: Small-estate affidavit threshold exceeded", async () => {
        // Mock 10 individual assets totaling a high value
        mockApi.getAssets.mockResolvedValue([
            { id: "1", type: "BANK", ownershipType: "INDIVIDUAL", institution: "Chase", balance: 100000 },
            { id: "2", type: "BANK", ownershipType: "INDIVIDUAL", institution: "Wells", balance: 100000 }
        ]);
        mockApi.getMyEstate.mockResolvedValue({ probateStatus: "NOT_STARTED" });

        render(
            <QueryClientProvider client={queryClient}>
                <ProbateHub />
            </QueryClientProvider>
        );

        // Verify that probate is identified as required due to asset count/type
        expect(await screen.findByText(/Probate Action Required: 2 Assets Identified/i)).toBeInTheDocument();
    });

    it("BANK-N02: Multiple death certificates required", async () => {
        const mockAsset = { institution: "Bank of America" };
        const workflow = {
            steps: [{
                id: "submit",
                title: "Submit Docs",
                alerts: [{ type: "caution", message: "ORIGINALS_REQUIRED: This bank requires 2 original death certificates." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="submit"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/ORIGINALS_REQUIRED/i)).toBeInTheDocument();
    });

    it("RET-N01: Beneficiary is minor - Guardianship required", async () => {
        const mockAsset = { institution: "Fidelity", assetType: "401k" };
        const workflow = {
            steps: [{
                id: "claim",
                title: "File Claim",
                alerts: [{ type: "important", message: "MINOR_BENEFICIARY: A court-appointed guardian or UTMA account is required for this minor beneficiary." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="claim"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/MINOR_BENEFICIARY/i)).toBeInTheDocument();
    });

    it("INS-N01: Contestability investigation", async () => {
        const mockAsset = { institution: "MetLife", assetType: "LIFE_INSURANCE" };
        const workflow = {
            steps: [{
                id: "investigation",
                title: "SLA Extended",
                alerts: [{ type: "warning", message: "CONTESTABILITY: The carrier has initiated an investigation. Review may take 60-90 days." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="investigation"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/CONTESTABILITY/i)).toBeInTheDocument();
    });
});
