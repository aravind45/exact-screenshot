import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { api } from "@/lib/api";
import Dashboard from "@/pages/Dashboard";
import { Sidebar } from "@/components/Sidebar";
import { WelcomeModal } from "@/components/WelcomeModal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

// Mock API
vi.mock("@/lib/api", () => ({
    api: {
        getMyEstate: vi.fn(),
        getAssets: vi.fn(),
        getFollowUps: vi.fn(),
        updateMyEstate: vi.fn(),
    }
}));

// Mock Auth
vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { fullName: "Test User", email: "test@example.com" },
        signOut: vi.fn(),
        loading: false
    })
}));

const createTestQueryClient = () => new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe("Estate Type Display and Onboarding", () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = createTestQueryClient();
    });

    it("Displays Estate Type Badge in Dashboard Header when set", async () => {
        (api.getMyEstate as any).mockResolvedValue({
            estateType: "PROBATE",
            deceasedFirstName: "John"
        });
        (api.getAssets as any).mockResolvedValue([]);
        (api.getFollowUps as any).mockResolvedValue([]);

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <Dashboard />
                </QueryClientProvider>
            </MemoryRouter>
        );

        expect(await screen.findByText("PROBATE TRACK")).toBeInTheDocument();
    });

    it("Displays Estate Type in Sidebar when set", async () => {
        (api.getMyEstate as any).mockResolvedValue({
            estateType: "TRUST_BASED",
        });

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <Sidebar />
                </QueryClientProvider>
            </MemoryRouter>
        );

        expect(await screen.findByText("TRUST BASED")).toBeInTheDocument();
    });

    it("Shows WelcomeModal when Estate Type is missing (Blocking Flow)", async () => {
        (api.getMyEstate as any).mockResolvedValue({
            estateType: null,
        });

        render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    <WelcomeModal />
                </QueryClientProvider>
            </MemoryRouter>
        );

        expect(await screen.findByText("Welcome to ExpectedEstate")).toBeInTheDocument();
        expect(screen.getByText("Initialize Estate")).toBeDisabled(); // Should be disabled until selection
    });
});
