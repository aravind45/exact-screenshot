import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import OnboardingGuidedWizard from '@/components/OnboardingGuidedWizard';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

vi.mock('@/contexts/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
    api: {
        getMyEstate: vi.fn(),
        updateMyEstate: vi.fn(),
        createHeir: vi.fn(),
        uploadEstateDocument: vi.fn(),
        createAsset: vi.fn(),
        inviteCollaborator: vi.fn(),
        completeTask: vi.fn(),
        selectEstateTrack: vi.fn(),
        pinRoadmap: vi.fn(),
    },
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useTracking', () => ({
    useTracking: () => ({ trackEvent: vi.fn() }),
}));

vi.mock('@/lib/authorityEngine', () => ({
    calculateAuthorityRecommendation: vi.fn(() => ({
        type: 'SMALL_ESTATE',
        activeEngines: [],
        reason: 'Based on the available facts, this appears to be a small estate.',
    })),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockApi = api as unknown as Record<string, ReturnType<typeof vi.fn>>;

const estateFixture = {
    id: 'estate-1',
    deceasedFirstName: 'Test',
    deceasedLastName: 'Person',
    deceasedDateOfDeath: '2026-03-17T00:00:00.000Z',
    deceasedState: 'TX',
    probateCounty: 'Fort Bend',
    estimatedPersonalProperty: 2500000,
    estimatedLiabilities: 50000,
    hasContest: false,
    hasTODDeed: false,
    hasWill: true,
    isSurvivingSpouse: false,
    hasOutOfStateProperty: false,
    hasUnknownHeirs: false,
    isTrustRevocable: false,
};

function LocationEcho() {
    const location = useLocation();
    return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderOnboarding() {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/profile" element={<div>Profile Case Setup</div>} />
                    <Route
                        path="/onboarding"
                        element={
                            <>
                                <OnboardingGuidedWizard />
                                <LocationEcho />
                            </>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

function setHistory(entries: string[]) {
    window.history.replaceState({}, '', entries[0]);
    for (const entry of entries.slice(1)) {
        window.history.pushState({}, '', entry);
    }
}

describe('OnboardingGuidedWizard deep-link step navigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();

        mockUseAuth.mockReturnValue({
            user: { role: 'USER' },
        } as any);

        mockApi.getMyEstate.mockResolvedValue(estateFixture);
        mockApi.updateMyEstate.mockResolvedValue(estateFixture);
        mockApi.createHeir.mockResolvedValue({ id: 'heir-1' });
        mockApi.uploadEstateDocument.mockResolvedValue({ id: 'doc-1' });
        mockApi.createAsset.mockResolvedValue({ id: 'asset-1' });
        mockApi.inviteCollaborator.mockResolvedValue({ id: 'invite-1' });
        mockApi.completeTask.mockResolvedValue({ success: true });
        mockApi.selectEstateTrack.mockResolvedValue({ success: true });
        mockApi.pinRoadmap.mockResolvedValue({ success: true });
    });

    it('opens the requested onboarding step from the URL and backs out to the previous route', async () => {
        setHistory(['/profile?tab=case-setup', '/onboarding?step=1']);
        renderOnboarding();

        expect(await screen.findByText('The basics.')).toBeInTheDocument();
        expect(screen.getByText(/Step 2 of 9/i)).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: /^Back$/i }));

        await waitFor(() => {
            expect(screen.getByText('Profile Case Setup')).toBeInTheDocument();
        });
    });

    it('keeps the query step aligned when moving forward from a deep link', async () => {
        setHistory(['/onboarding?step=1']);
        renderOnboarding();

        expect(await screen.findByText('The basics.')).toBeInTheDocument();

        const continueButton = screen.getByRole('button', { name: /Continue to Quick Assessment/i });

        await waitFor(() => {
            expect(continueButton).not.toBeDisabled();
        });

        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText('Quick Assessment')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.getByTestId('location')).toHaveTextContent('/onboarding?step=2');
        });
    });
});
