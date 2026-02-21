import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { EnhancedOnboardingWizard } from '../EnhancedOnboardingWizard';
import { api } from '@/lib/api';

// Mock dependencies
vi.mock('@/lib/api');
vi.mock('@/contexts/AuthContext');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        useLocation: () => ({ state: { state: 'CA' } })
    };
});

const mockApi = api as any;
const mockNavigate = vi.fn();

// Mock AuthContext
const mockAuthContext = {
    user: { state: 'CA' } as any,
    loading: false,
    isAdmin: false,
    isAdvisor: false,
    isAttorney: false,
    isExecutor: false,
    isHeir: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    refreshUser: vi.fn()
};

const createTestComponent = (props = {}) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false }
        }
    });

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <EnhancedOnboardingWizard {...props} />
            </BrowserRouter>
        </QueryClientProvider>
    );
};

describe('EnhancedOnboardingWizard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApi.updateMyEstate = vi.fn().mockResolvedValue({});
    });

    it('renders the first question correctly', () => {
        render(createTestComponent());
        
        expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
        expect(screen.getByText('Was there a valid will?')).toBeInTheDocument();
        expect(screen.getByText('A legal document that specifies how assets should be distributed')).toBeInTheDocument();
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('No')).toBeInTheDocument();
        expect(screen.getByText("I'm not sure")).toBeInTheDocument();
    });

    it('shows help text when help button is clicked', async () => {
        render(createTestComponent());
        
        const helpButton = screen.getByLabelText('Show help');
        fireEvent.click(helpButton);
        
        await waitFor(() => {
            expect(screen.getByText(/A will is a legal document/)).toBeInTheDocument();
        });
    });

    it('progresses through questions when Next is clicked', async () => {
        render(createTestComponent());
        
        // Answer first question
        const yesButton = screen.getByText('Yes');
        fireEvent.click(yesButton);
        
        // Click Next
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
            expect(screen.getByText('Was there a trust?')).toBeInTheDocument();
        });
    });

    it('displays progress bar correctly', () => {
        render(createTestComponent());
        
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-valuenow', '20');
    });

    it('shows summary view after all questions are answered', async () => {
        render(createTestComponent());
        
        // Answer all questions
        const answers = ['Yes', 'No', 'No', 'No', 'No'];
        
        for (let i = 0; i < answers.length; i++) {
            const answerButton = screen.getByText(answers[i]);
            fireEvent.click(answerButton);
            
            if (i < answers.length - 1) {
                const nextButton = screen.getByText('Next Question');
                fireEvent.click(nextButton);
            }
        }
        
        // Click Next on last question
        const nextButton = screen.getByText('Review Path');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            expect(screen.getByText('Review Your Path')).toBeInTheDocument();
            expect(screen.getByText('Summary')).toBeInTheDocument();
        });
    });

    it('displays path result with confidence score', async () => {
        render(createTestComponent());
        
        // Answer all questions
        const answerButton = screen.getByText('Yes');
        fireEvent.click(answerButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            expect(screen.getByText(/Confidence:/)).toBeInTheDocument();
        });
    });

    it('shows error message when submission fails', async () => {
        mockApi.updateMyEstate.mockRejectedValue(new Error('API Error'));
        
        render(createTestComponent());
        
        // Complete the wizard
        const answerButton = screen.getByText('Yes');
        fireEvent.click(answerButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            const reviewButton = screen.getByText('Review Path');
            fireEvent.click(reviewButton);
        });
        
        await waitFor(() => {
            const confirmButton = screen.getByText(/Continue with/);
            fireEvent.click(confirmButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText('Error:')).toBeInTheDocument();
            expect(screen.getByText('Failed to save your selections. Please try again.')).toBeInTheDocument();
        });
    });

    it('allows user to reassess their answers', async () => {
        render(createTestComponent());
        
        // Answer first question
        const yesButton = screen.getByText('Yes');
        fireEvent.click(yesButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
        });
        
        // Click Start Over
        const startOverButton = screen.getByText('Start Over');
        fireEvent.click(startOverButton);
        
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
            expect(screen.getByText('Was there a valid will?')).toBeInTheDocument();
        });
    });

    it('navigates back to previous question', async () => {
        render(createTestComponent());
        
        // Answer first question
        const yesButton = screen.getByText('Yes');
        fireEvent.click(yesButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
        });
        
        // Click Back
        const backButton = screen.getByText('Back');
        fireEvent.click(backButton);
        
        await waitFor(() => {
            expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
            expect(screen.getByText('Was there a valid will?')).toBeInTheDocument();
        });
    });

    it('disables navigation buttons during submission', async () => {
        // Mock a slow API call
        mockApi.updateMyEstate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
        
        render(createTestComponent());
        
        // Complete the wizard
        const answerButton = screen.getByText('Yes');
        fireEvent.click(answerButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            const reviewButton = screen.getByText('Review Path');
            fireEvent.click(reviewButton);
        });
        
        await waitFor(() => {
            const confirmButton = screen.getByText(/Continue with/);
            fireEvent.click(confirmButton);
        });
        
        // Check that buttons are disabled during submission
        await waitFor(() => {
            expect(screen.getByText(/Continue with/)).toBeDisabled();
            expect(screen.getByText('Reassess My Situation')).toBeDisabled();
        });
    });

    it('shows loading spinner during submission', async () => {
        // Mock a slow API call
        mockApi.updateMyEstate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
        
        render(createTestComponent());
        
        // Complete the wizard
        const answerButton = screen.getByText('Yes');
        fireEvent.click(answerButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            const reviewButton = screen.getByText('Review Path');
            fireEvent.click(reviewButton);
        });
        
        await waitFor(() => {
            const confirmButton = screen.getByText(/Continue with/);
            fireEvent.click(confirmButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText(/Continue with/)).toContainHTML('animate-spin');
        });
    });

    it('handles "I\'m not sure" answers correctly', async () => {
        render(createTestComponent());
        
        // Select "I'm not sure" for first question
        const notSureButton = screen.getByText("I'm not sure");
        fireEvent.click(notSureButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            expect(screen.getByText('Question 2 of 5')).toBeInTheDocument();
        });
    });

    it('displays path result card with all required information', async () => {
        render(createTestComponent());
        
        // Complete the wizard
        const answerButton = screen.getByText('Yes');
        fireEvent.click(answerButton);
        
        const nextButton = screen.getByText('Next Question');
        fireEvent.click(nextButton);
        
        await waitFor(() => {
            const reviewButton = screen.getByText('Review Path');
            fireEvent.click(reviewButton);
        });
        
        await waitFor(() => {
            expect(screen.getByText('Path Assessment Complete')).toBeInTheDocument();
            expect(screen.getByText('Recommended path for your situation')).toBeInTheDocument();
            expect(screen.getByText('Confidence Score')).toBeInTheDocument();
            expect(screen.getByText('Recommended Next Steps')).toBeInTheDocument();
        });
    });
});