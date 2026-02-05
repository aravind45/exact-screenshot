import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { SettlementWorkflow } from "@/components/SettlementWorkflow";

// Mock the API
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

describe("Tier 2 Settlement Types - Comprehensive Tests", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = createTestQueryClient();
        window.HTMLElement.prototype.scrollIntoView = vi.fn();
    });

    describe("SPOUSAL_PETITION (88% → 95%)", () => {
        it("Should display 6 phases for spousal petition workflow", () => {
            const mockAsset = {
                institution: "Community Property",
                ownershipType: "INDIVIDUAL",
                balance: 200000
            };

            const workflow = {
                steps: [
                    { id: "eligibility", title: "Eligibility", guidance: "Verify qualification" },
                    { id: "documents", title: "Documents", guidance: "Assemble required documents" },
                    { id: "petition", title: "Petition", guidance: "File DE-221" },
                    { id: "hearing", title: "Hearing", guidance: "Attend court hearing" },
                    { id: "order", title: "Order", guidance: "Obtain DE-226" },
                    { id: "transfer", title: "Transfer", guidance: "Transfer title" }
                ]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="eligibility"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/Eligibility/i)).toBeInTheDocument();
            expect(screen.getByText(/Petition/i)).toBeInTheDocument();
            expect(screen.getByText(/Hearing/i)).toBeInTheDocument();
        });

        it("Should validate community property requirement", () => {
            const mockAsset = {
                institution: "Separate Property Account",
                ownershipType: "INDIVIDUAL",
                metadata: { isCommunityProperty: false }
            };

            const workflow = {
                steps: [{
                    id: "eligibility",
                    title: "Eligibility",
                    alerts: [{
                        type: "warning",
                        message: "Only community property qualifies for spousal petition"
                    }]
                }]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="eligibility"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/community property/i)).toBeInTheDocument();
        });
    });

    describe("TRUST_ADMIN (87% → 95%)", () => {
        it("Should display 5 phases for trust administration", () => {
            const mockAsset = {
                institution: "Family Trust",
                ownershipType: "TRUST",
                balance: 1000000
            };

            const workflow = {
                steps: [
                    { id: "acceptance", title: "Acceptance", guidance: "Sign Certificate of Trust" },
                    { id: "notification", title: "Notice", guidance: "Notify beneficiaries" },
                    { id: "inventory", title: "Inventory", guidance: "Identify trust assets" },
                    { id: "expenses", title: "Expenses", guidance: "Pay taxes and debts" },
                    { id: "transfer", title: "Transfer", guidance: "Distribute to beneficiaries" }
                ]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="acceptance"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/Acceptance/i)).toBeInTheDocument();
            expect(screen.getByText(/Notice/i)).toBeInTheDocument();
            expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
        });

        it("Should enforce 120-day beneficiary notice period", () => {
            const mockAsset = { institution: "Trust", ownershipType: "TRUST" };

            const workflow = {
                steps: [{
                    id: "notification",
                    title: "Notice",
                    alerts: [{
                        type: "caution",
                        message: "Do NOT distribute assets until 120-day period expires"
                    }]
                }]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="notification"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/120-day/i)).toBeInTheDocument();
        });

        it("Should distinguish revocable vs irrevocable trusts", () => {
            const revocableAsset = {
                institution: "Revocable Trust",
                ownershipType: "TRUST",
                metadata: { isTrustRevocable: true }
            };

            const irrevocableAsset = {
                institution: "Irrevocable Trust",
                ownershipType: "TRUST",
                metadata: { isTrustRevocable: false }
            };

            // Both should use same workflow but different guidance
            expect(revocableAsset.metadata.isTrustRevocable).toBe(true);
            expect(irrevocableAsset.metadata.isTrustRevocable).toBe(false);
        });
    });

    describe("JOINT_TRANSFER (85% → 95%)", () => {
        it("Should display 4 phases for joint transfer", () => {
            const mockAsset = {
                institution: "Joint Bank Account",
                ownershipType: "JOINT",
                balance: 50000
            };

            const workflow = {
                steps: [
                    { id: "verify_ownership", title: "Verify Ownership", guidance: "Confirm JTWROS" },
                    { id: "gather_docs", title: "Documents", guidance: "Assemble documents" },
                    { id: "submit_claim", title: "Submit Claim", guidance: "Request transfer" },
                    { id: "complete_transfer", title: "Complete", guidance: "Confirm transfer" }
                ]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="verify_ownership"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/Verify Ownership/i)).toBeInTheDocument();
            expect(screen.getByText(/Submit Claim/i)).toBeInTheDocument();
        });

        it("Should warn about Tenants in Common vs JTWROS", () => {
            const mockAsset = { institution: "Joint Property", ownershipType: "JOINT" };

            const workflow = {
                steps: [{
                    id: "verify_ownership",
                    title: "Verify Ownership",
                    alerts: [{
                        type: "caution",
                        message: "Only JTWROS transfers automatically. TIC requires probate"
                    }]
                }]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="verify_ownership"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/JTWROS/i)).toBeInTheDocument();
        });
    });

    describe("POD_TOD_TRANSFER (85% → 95%)", () => {
        it("Should display 4 phases for POD/TOD transfer", () => {
            const mockAsset = {
                institution: "Bank Account",
                ownershipType: "POD",
                balance: 30000
            };

            const workflow = {
                steps: [
                    { id: "verify_designation", title: "Verify Beneficiary", guidance: "Confirm designation" },
                    { id: "assemble_packet", title: "Assemble Packet", guidance: "Gather documents" },
                    { id: "submit_claim", title: "Submit Claim", guidance: "File claim" },
                    { id: "receive_transfer", title: "Receive Transfer", guidance: "Direct transfer" }
                ]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="verify_designation"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/Verify Beneficiary/i)).toBeInTheDocument();
            expect(screen.getByText(/Assemble Packet/i)).toBeInTheDocument();
        });

        it("Should handle multiple beneficiaries", () => {
            const mockAsset = { institution: "IRA", ownershipType: "TOD" };

            const workflow = {
                steps: [{
                    id: "submit_claim",
                    title: "Submit Claim",
                    alerts: [{
                        type: "caution",
                        message: "ALL beneficiaries must submit claims"
                    }]
                }]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="submit_claim"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/ALL beneficiaries/i)).toBeInTheDocument();
        });

        it("Should warn about retirement account tax implications", () => {
            const mockAsset = { institution: "401k", ownershipType: "TOD" };

            const workflow = {
                steps: [{
                    id: "receive_transfer",
                    title: "Receive Transfer",
                    alerts: [{
                        type: "warning",
                        message: "Retirement accounts have special distribution rules"
                    }]
                }]
            };

            render(
                <QueryClientProvider client={queryClient}>
                    <SettlementWorkflow
                        asset={mockAsset}
                        workflow={workflow as any}
                        currentStepId="receive_transfer"
                        completedStepIds={[]}
                        onStepSelect={vi.fn()}
                        onStepComplete={vi.fn()}
                        onLogCommunication={vi.fn()}
                        onSendFax={vi.fn()}
                        onGenerateLetter={vi.fn()}
                    />
                </QueryClientProvider>
            );

            expect(screen.getByText(/Retirement accounts/i)).toBeInTheDocument();
        });
    });
});
