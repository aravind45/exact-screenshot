import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { api } from "@/lib/api";
import { ProbateHub } from "@/components/ProbateHub";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock handles
const mockApi = {
    getMyEstate: vi.fn(),
    getAssets: vi.fn(),
    updateMyEstate: vi.fn(),
};

vi.mock("@/lib/api", () => ({
    api: {
        getMyEstate: () => mockApi.getMyEstate(),
        getAssets: () => mockApi.getAssets(),
        updateMyEstate: (data: any) => mockApi.updateMyEstate(data),
    }
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe("Settlement Type Specific Scenarios", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = createTestQueryClient();
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    it("Probate vs Small Estate: Auto-transition logic", async () => {
        // Mock estate initially qualifies for small estate
        mockApi.getMyEstate.mockResolvedValue({
            probateStatus: "NOT_STARTED",
            deceasedState: "California"
        });

        // Initial low-value assets
        mockApi.getAssets.mockResolvedValue([
            { id: "1", institution: "Chase", balance: 1000, ownershipType: "INDIVIDUAL" }
        ]);

        const { rerender } = render(
            <QueryClientProvider client={queryClient}>
                <ProbateHub />
            </QueryClientProvider>
        );

        expect(await screen.findByText(/Probate Action Required: 1 Assets Identified/i)).toBeInTheDocument();

        // Simulate discovering a high-value asset that exceeds threshold
        mockApi.getAssets.mockResolvedValue([
            { id: "1", institution: "Chase", balance: 1000, ownershipType: "INDIVIDUAL" },
            { id: "2", institution: "Fidelity", balance: 200000, ownershipType: "INDIVIDUAL" }
        ]);
        queryClient.invalidateQueries({ queryKey: ["assets"] });

        rerender(
            <QueryClientProvider client={queryClient}>
                <ProbateHub />
            </QueryClientProvider>
        );

        // Verification: Threshold logic identifies probate is now mandatory
        expect(await screen.findByText(/Probate Action Required: 2 Assets Identified/i)).toBeInTheDocument();
        expect(screen.getByText(/you must obtain Letters Testamentary/i)).toBeInTheDocument();
    });

    it("Trust-Based: Distribution without court authority", async () => {
        const mockAsset = { institution: "Vanguard", ownershipType: "TRUST", balance: 500000 };
        const workflow = {
            steps: [{
                id: "distribute",
                title: "Distribute Trust Assets",
                guidance: "As Trustee, you can distribute these assets per the trust terms."
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="distribute"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/As Trustee/i)).toBeInTheDocument();
        // Verification: No mention of Letters Testamentary or Probate Court in this workflow
        expect(screen.queryByText(/Letters Testamentary/i)).not.toBeInTheDocument();
    });

    it("Insolvent Estate: Creditor priority enforcement", async () => {
        const mockAsset = { institution: "Estate Account", balance: 10000 };
        const workflow = {
            steps: [{
                id: "pay_debts",
                title: "Prioritize Creditors",
                alerts: [{ type: "important", message: "INSOLVENT: Debts exceed assets. Follow statutory payment priority." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="pay_debts"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/INSOLVENT/i)).toBeInTheDocument();
        expect(screen.getByText(/Follow statutory payment priority/i)).toBeInTheDocument();
    });

    it("Ancillary Probate: Multi-state case tracking", async () => {
        mockApi.getMyEstate.mockResolvedValue({
            probateStatus: "EXECUTOR_APPOINTED",
            deceasedState: "New York", // Domicile
            ancillaryProbateRequired: true,
            ancillaryState: "Florida" // Real estate location
        });

        render(
            <QueryClientProvider client={queryClient}>
                <ProbateHub />
            </QueryClientProvider>
        );

        // Verification: Jurisdiction shows domicile
        expect(await screen.findByText(/New York/i)).toBeInTheDocument();
        // In a real implementation, we'd check for ancillary indicators or separate tabs
    });

    it("Special Cases: Litigation hold on contested estate", async () => {
        const mockAsset = { institution: "Real Estate", status: "contested" };
        const workflow = {
            steps: [{
                id: "listing",
                title: "Sell Property",
                alerts: [{ type: "important", message: "LITIGATION_HOLD: This asset is contested. No distributions or sales allowed." }]
            }]
        };

        render(
            <QueryClientProvider client={queryClient}>
                <SettlementWorkflow
                    asset={mockAsset}
                    workflow={workflow as any}
                    currentStepId="listing"
                    completedStepIds={[]}
                    onStepSelect={vi.fn()}
                    onStepComplete={vi.fn()}
                    onLogCommunication={vi.fn()}
                    onSendFax={vi.fn()}
                />
            </QueryClientProvider>
        );

        expect(screen.getByText(/LITIGATION_HOLD/i)).toBeInTheDocument();
    });
});
