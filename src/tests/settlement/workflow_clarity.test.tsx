import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { api } from "@/lib/api";
import { ProbateHub } from "@/components/ProbateHub";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock the API
vi.mock("@/lib/api", () => ({
    api: {
        getMyEstate: vi.fn(),
        getAssets: vi.fn(),
        updateMyEstate: vi.fn(),
        generateLetter: vi.fn(),
    }
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe("Workflow Clarity Improvements", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = createTestQueryClient();
    });

    it("Visual Distinction: Probate Hub shows explicit Estate-Level branding", async () => {
        const mockEstate = {
            probateStatus: "NOT_STARTED", // Blocking state to check counter
            authorityStatus: "NOT_STARTED",
            deceasedFirstName: "John",
            deceasedLastName: "Doe"
        };
        (api.getMyEstate as any).mockResolvedValue(mockEstate);
        (api.getAssets as any).mockResolvedValue([
            { id: "1", institution: "Robinhood", ownershipType: "INDIVIDUAL" }
        ]);

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <ProbateHub />
                </QueryClientProvider>
            </MemoryRouter>
        );

        // Verify Header Change
        expect(await screen.findByText("Estate-Level Probate Process")).toBeInTheDocument();

        // Verify Badge
        expect(screen.getByText("REQUIRED FIRST")).toBeInTheDocument();

        // Verify "Blocked Assets" counter (Dependency Indicator)
        expect(screen.getByText(/1 Asset Waiting for Authority/i)).toBeInTheDocument();
    });

    it("Visual Distinction: Settlement Workflow shows Asset-Specific branding", async () => {
        const mockAsset = {
            id: "1",
            institution: "Robinhood",
            ownershipType: "INDIVIDUAL" // Makes it require probate
        };

        const mockWorkflow = {
            steps: [
                { id: "notify", title: "Notify", description: "Desc" },
                // Add a step that triggers the alert logic (e.g., beneficiary_claim or similar if we were testing logic, 
                // but for header we just need render)
                { id: "beneficiary_claim", title: "Claim", description: "Desc" }
            ]
        };

        // Mock Estate as NOT started so we can see the alert
        (api.getMyEstate as any).mockResolvedValue({
            probateStatus: "NOT_STARTED",
            authorityStatus: "NOT_STARTED"
        });

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={mockWorkflow as any}
                        currentStepId="notify"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            </MemoryRouter>
        );

        // Verify Header Change
        expect(screen.getByText("Institution Settlement Guide")).toBeInTheDocument();

        // Verify Badge
        expect(screen.getByText("ASSET-SPECIFIC")).toBeInTheDocument();
    });

    it("Dependency Indicator: Shows Alert when Probate is not done", async () => {
        const mockAsset = {
            id: "1",
            institution: "Robinhood",
            ownershipType: "INDIVIDUAL"
        };
        const mockWorkflow = {
            steps: [
                { id: "beneficiary_claim", title: "Claim", description: "Desc", condition: () => true }
            ]
        };

        (api.getMyEstate as any).mockResolvedValue({
            probateStatus: "NOT_STARTED",
            authorityStatus: "NOT_STARTED"
        });

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={mockWorkflow as any}
                        currentStepId="beneficiary_claim" // This step triggers the alert logic in the component
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            </MemoryRouter>
        );

        // Wait for estate query to resolve
        await waitFor(() => {
            expect(screen.getByText(/Estate-Level Authority Required/i)).toBeInTheDocument();
        });

        // Verify the link text
        expect(screen.getByText("Complete the Estate-Level Probate Process first")).toBeInTheDocument();
    });
});
