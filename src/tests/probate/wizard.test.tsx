
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PetitionWizard from "../../pages/probate/PetitionWizard";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { api } from "@/lib/api";

// Mock API
vi.mock("@/lib/api", () => ({
    api: {
        getMyEstate: vi.fn(),
        updateMyEstate: vi.fn(),
        createHeir: vi.fn(),
        deleteHeir: vi.fn(),
        getPetitionPdf: vi.fn()
    }
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
});

describe("PetitionWizard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders step 1 (Decedent Info) by default", async () => {
        (api.getMyEstate as any).mockResolvedValue({
            deceasedFirstName: "Alice",
            deceasedLastName: "Smith",
            heirs: []
        });

        render(
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <PetitionWizard />
                </BrowserRouter>
            </QueryClientProvider>
        );

        await waitFor(() => {
            expect(screen.queryByText("Loading Petition...")).not.toBeInTheDocument();
        });

        expect(await screen.findByText("Decedent Information")).toBeInTheDocument();
        expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    });
});
