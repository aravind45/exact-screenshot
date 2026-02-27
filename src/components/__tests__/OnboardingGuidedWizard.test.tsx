import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import OnboardingGuidedWizard from '../OnboardingGuidedWizard';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

// Mock dependencies
vi.mock('@/contexts/AuthContext');
vi.mock('@/lib/api');
vi.mock('@/hooks/use-toast');
vi.mock('@/hooks/use-tracking');
vi.mock('@/lib/authorityEngine');
vi.mock('@tanstack/react-query');

const mockUseAuth = useAuth as any;
const mockApi = api as any;
const mockUseQuery = vi.fn(() => mockUseQueryResult) as any;

const mockNavigate = vi.fn();
const mockToast = { toast: vi.fn() };
const mockTrackEvent = vi.fn();

// Mock calculateAuthorityRecommendation
const mockCalculateAuthorityRecommendation = vi.fn(() => ({
    type: 'SMALL_ESTATE',
    reason: 'Based on your answers, this appears to be a small estate.'
}));

// Mock useQuery
const mockUseQueryResult = {
    data: null,
    isLoading: false,
    error: null
};

// Mock useAuth
const mockUseAuthResult = {
    user: { role: 'USER' }
};

const renderWithProviders = (component: React.ReactElement) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                {component}
                <Toaster />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('OnboardingGuidedWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAuth.mockReturnValue(mockUseAuthResult);
        mockUseQuery.mockReturnValue(mockUseQueryResult);
        mockApi.getMyEstate.mockResolvedValue(null);
        mockApi.updateMyEstate.mockResolvedValue({ id: 'test-estate-id' });
        mockApi.createHeir.mockResolvedValue({ id: 'test-heir-id' });
        mockApi.uploadEstateDocument.mockResolvedValue({ id: 'test-doc-id' });
        mockApi.createAsset.mockResolvedValue({ id: 'test-asset-id' });
        mockApi.inviteCollaborator.mockResolvedValue({ id: 'test-invite-id' });
        mockApi.completeTask.mockResolvedValue({ success: true });
        mockApi.getMyEstate.mockResolvedValue({ id: 'test-estate-id' });
    });

    it('renders the welcome screen with role selection', () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        expect(screen.getByText("We're so sorry for your loss.")).toBeInTheDocument();
        expect(screen.getByText("I am the Executor")).toBeInTheDocument();
        expect(screen.getByText("I am an Heir")).toBeInTheDocument();
    });

    it('shows heir invitation message when heir role is selected', () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        const heirButton = screen.getByText("I am an Heir");
        fireEvent.click(heirButton);

        expect(screen.getByText("Invitation Required")).toBeInTheDocument();
        expect(screen.getByText("Heirs and beneficiaries join existing estates via a secure invitation link")).toBeInTheDocument();
    });

    it('progresses to estate info when executor role is selected', () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        expect(screen.getByText("The basics.")).toBeInTheDocument();
        expect(screen.getByText("Tell us about the person who passed away.")).toBeInTheDocument();
    });

    it('shows guided assessment after estate info', async () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        // Select executor role
        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        // Fill in required fields
        const nameInput = screen.getByLabelText("Full Name");
        fireEvent.change(nameInput, { target: { value: "John Smith" } });

        const dateInput = screen.getByLabelText("Date of Death");
        fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

        const stateSelect = screen.getByLabelText("Deceased's State of Residence");
        fireEvent.change(stateSelect, { target: { value: "CA" } });

        // Click continue
        const continueButton = screen.getByText("Continue to Quick Assessment");
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText("Quick Assessment")).toBeInTheDocument();
            expect(screen.getByText("Answer 5 simple questions to determine your path.")).toBeInTheDocument();
        });
    });

    it('handles clarification prompts correctly', async () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        // Navigate to guided assessment
        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        const nameInput = screen.getByLabelText("Full Name");
        fireEvent.change(nameInput, { target: { value: "John Smith" } });

        const dateInput = screen.getByLabelText("Date of Death");
        fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

        const stateSelect = screen.getByLabelText("Deceased's State of Residence");
        fireEvent.change(stateSelect, { target: { value: "CA" } });

        const continueButton = screen.getByText("Continue to Quick Assessment");
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText("Quick Assessment")).toBeInTheDocument();
        });

        // Click clarification button for Will question
        const clarificationButton = screen.getAllByTitle("HelpCircle")[0];
        fireEvent.click(clarificationButton);

        await waitFor(() => {
            expect(screen.getByText("What is a will?")).toBeInTheDocument();
            expect(screen.getByText("A legal document that specifies how a person's assets should be distributed after death.")).toBeInTheDocument();
        });
    });

    it('handles "Not Sure" options correctly', async () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        // Navigate to guided assessment
        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        const nameInput = screen.getByLabelText("Full Name");
        fireEvent.change(nameInput, { target: { value: "John Smith" } });

        const dateInput = screen.getByLabelText("Date of Death");
        fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

        const stateSelect = screen.getByLabelText("Deceased's State of Residence");
        fireEvent.change(stateSelect, { target: { value: "CA" } });

        const continueButton = screen.getByText("Continue to Quick Assessment");
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText("Quick Assessment")).toBeInTheDocument();
        });

        // Select "Not Sure" for Will question
        const notSureButton = screen.getAllByText("Not Sure")[0];
        fireEvent.click(notSureButton);

        await waitFor(() => {
            expect(notSureButton).toHaveClass("bg-white");
        });
    });

    it('calculates confidence score correctly', async () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        // Navigate to guided assessment
        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        const nameInput = screen.getByLabelText("Full Name");
        fireEvent.change(nameInput, { target: { value: "John Smith" } });

        const dateInput = screen.getByLabelText("Date of Death");
        fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

        const stateSelect = screen.getByLabelText("Deceased's State of Residence");
        fireEvent.change(stateSelect, { target: { value: "CA" } });

        const continueButton = screen.getByText("Continue to Quick Assessment");
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText("Quick Assessment")).toBeInTheDocument();
        });

        // Answer some questions
        const yesButtons = screen.getAllByText("Yes");
        fireEvent.click(yesButtons[0]); // Will question
        fireEvent.click(yesButtons[1]); // Trust question
        fireEvent.click(yesButtons[2]); // Spouse question

        // Check that confidence score is displayed
        await waitFor(() => {
            expect(screen.getByText(/Confidence Score/)).toBeInTheDocument();
        });
    });

    it('shows path recommendation in track scout', async () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        // Navigate through the flow
        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        const nameInput = screen.getByLabelText("Full Name");
        fireEvent.change(nameInput, { target: { value: "John Smith" } });

        const dateInput = screen.getByLabelText("Date of Death");
        fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

        const stateSelect = screen.getByLabelText("Deceased's State of Residence");
        fireEvent.change(stateSelect, { target: { value: "CA" } });

        const continueButton = screen.getByText("Continue to Quick Assessment");
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText("Quick Assessment")).toBeInTheDocument();
        });

        // Answer questions
        const yesButtons = screen.getAllByText("Yes");
        fireEvent.click(yesButtons[0]);
        fireEvent.click(yesButtons[1]);
        fireEvent.click(yesButtons[2]);
        fireEvent.click(yesButtons[3]);
        fireEvent.click(yesButtons[4]);

        // Calculate path
        const calculateButton = screen.getByText("Calculate My Path");
        fireEvent.click(calculateButton);

        await waitFor(() => {
            expect(screen.getByText("Your Path")).toBeInTheDocument();
            expect(screen.getByText("SMALL_ESTATE")).toBeInTheDocument();
        });
    });

    it('handles form submission correctly', async () => {
        renderWithProviders(<OnboardingGuidedWizard />);

        // Navigate through the entire flow
        const executorButton = screen.getByText("I am the Executor");
        fireEvent.click(executorButton);

        const nameInput = screen.getByLabelText("Full Name");
        fireEvent.change(nameInput, { target: { value: "John Smith" } });

        const dateInput = screen.getByLabelText("Date of Death");
        fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

        const stateSelect = screen.getByLabelText("Deceased's State of Residence");
        fireEvent.change(stateSelect, { target: { value: "CA" } });

        const continueButton = screen.getByText("Continue to Quick Assessment");
        fireEvent.click(continueButton);

        await waitFor(() => {
            expect(screen.getByText("Quick Assessment")).toBeInTheDocument();
        });

        // Complete all steps
        const yesButtons = screen.getAllByText("Yes");
        yesButtons.forEach(button => fireEvent.click(button));

        const calculateButton = screen.getByText("Calculate My Path");
        fireEvent.click(calculateButton);

        await waitFor(() => {
            expect(screen.getByText("Your Path")).toBeInTheDocument();
        });

        const continueButton2 = screen.getByText("Understood, Continue");
        fireEvent.click(continueButton2);

        await waitFor(() => {
            expect(screen.getByText("Heirs & Beneficiaries")).toBeInTheDocument();
        });

        // Complete heirs step
        const continueButton3 = screen.getByText("Continue");
        fireEvent.click(continueButton3);

        await waitFor(() => {
            expect(screen.getByText("Upload Vital Document")).toBeInTheDocument();
        });

        // Complete documents step
        const continueButton4 = screen.getByText("Sync & Continue");
        fireEvent.click(continueButton4);

        await waitFor(() => {
            expect(screen.getByText("Key Assets")).toBeInTheDocument();
        });

        // Complete assets step
        const continueButton5 = screen.getByText("Continue to Team");
        fireEvent.click(continueButton5);

        await waitFor(() => {
            expect(screen.getByText("Assemble Your Team")).toBeInTheDocument();
        });

        // Complete team step
        const finishButton = screen.getByText("Finish Setup");
        fireEvent.click(finishButton);

        await waitFor(() => {
            expect(screen.getByText("You're all set.")).toBeInTheDocument();
        });
    });
});