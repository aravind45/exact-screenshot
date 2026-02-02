import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { api } from "@/lib/api";
import Dashboard from "@/pages/Dashboard";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { WorkflowProvider } from "@/contexts/WorkflowContext";

// Mock the API and Auth
vi.mock("@/lib/api", () => ({
    api: {
        getMyEstate: vi.fn(),
        getAssets: vi.fn(),
        updateMyEstate: vi.fn(),
        generateLetter: vi.fn(),
    }
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "user-1", email: "test@test.com" }
    })
}));



vi.mock("@/components/SEO", () => ({
    SEO: () => null
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
            deceasedLastName: "Doe",
            deceasedState: "California",
            estateType: "FORMAL_PROBATE"
        };
        (api.getMyEstate as any).mockResolvedValue(mockEstate);
        (api.getAssets as any).mockResolvedValue([
            { id: "1", institution: "Robinhood", ownershipType: "INDIVIDUAL", balance: 200000 }
        ]);

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <WorkflowProvider>
                        <Dashboard />
                    </WorkflowProvider>
                </QueryClientProvider>
            </MemoryRouter>
        );

        // Verify Header Change
        expect(await screen.findByText("Probate Process Roadmap")).toBeInTheDocument();

        // Verify "Awaiting Verification" counter (Dependency Indicator)
        expect(await screen.findByText(/Guidance Required/i)).toBeInTheDocument();
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
        expect(screen.getByText("Settlement Action Plan")).toBeInTheDocument();
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
            expect(screen.getByText(/Guidance Required/i)).toBeInTheDocument();
        });

        // Verify the link text (from ProbateBlockerAlert)
        expect(screen.getByText(/awaiting your/i)).toBeInTheDocument();
    });

    it("Probate Hub: Shows Interactive Steps with Resources", async () => {
        const mockEstate = {
            probateStatus: "NOT_STARTED",
            authorityStatus: "NOT_STARTED",
            deceasedFirstName: "John",
            deceasedState: "CA"
        };
        (api.getMyEstate as any).mockResolvedValue(mockEstate);
        (api.getAssets as any).mockResolvedValue([
            { id: "1", institution: "Chase", ownershipType: "INDIVIDUAL", value: 200000 } // > 184k triggers Full Probate
        ]);

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <WorkflowProvider>
                        <Dashboard />
                    </WorkflowProvider>
                </QueryClientProvider>
            </MemoryRouter>
        );

        // Verify that the checklist widget is present
        expect(await screen.findByText("Probate Process Roadmap")).toBeInTheDocument();

        // Verify Download Action
        const link = screen.getByText(/Download DE-111/).closest('a');
        expect(link).toHaveAttribute("href", "https://www.courts.ca.gov/documents/de111.pdf");

        // Verify Status Update Button
        expect(screen.getByText("Mark Filed")).toBeInTheDocument();
    });
});
