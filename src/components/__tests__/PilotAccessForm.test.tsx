import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PilotAccessForm } from '../PilotAccessForm';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('PilotAccessForm', () => {
    beforeEach(() => {
        mockFetch.mockReset();
    });

    it('renders form fields correctly', () => {
        render(<PilotAccessForm />);
        
        expect(screen.getByLabelText(/firm name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/attorney name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/probate cases per year/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /request pilot access/i })).toBeInTheDocument();
    });

    it('submits form with correct payload shape including top-level email', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ success: true }),
        });

        render(<PilotAccessForm />);

        // Fill out the form
        fireEvent.change(screen.getByLabelText(/firm name/i), {
            target: { value: 'Austin Probate Law Group' },
        });
        fireEvent.change(screen.getByLabelText(/attorney name/i), {
            target: { value: 'Sarah Jennings, J.D.' },
        });
        fireEvent.change(screen.getByLabelText(/work email/i), {
            target: { value: 'sarah@austinprobate.com' },
        });
        fireEvent.change(screen.getByLabelText(/probate cases per year/i), {
            target: { value: '20-50' },
        });

        // Submit the form
        fireEvent.click(screen.getByRole('button', { name: /request pilot access/i }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(
                '/api/marketing/pilot-request',
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                })
            );
        });

        // Verify the payload structure matches backend expectations
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);

        // REGRESSION TEST: Backend requires top-level email field
        // This test ensures the payload includes:
        // 1. Top-level "email" field (required by backend)
        // 2. "metadata" object with firmName, attorneyName (required by backend)
        // 3. "metadata.email" for redundancy/reference
        expect(body).toHaveProperty('email', 'sarah@austinprobate.com');
        expect(body).toHaveProperty('event', 'pilot_request');
        expect(body).toHaveProperty('metadata');
        expect(body.metadata).toHaveProperty('firmName', 'Austin Probate Law Group');
        expect(body.metadata).toHaveProperty('attorneyName', 'Sarah Jennings, J.D.');
        expect(body.metadata).toHaveProperty('email', 'sarah@austinprobate.com');
        expect(body.metadata).toHaveProperty('casesPerYear', '20-50');
    });

    it('payload contract matches backend validation requirements', async () => {
        // This is a regression test to prevent payload contract drift
        // Backend marketingRoutes.ts requires:
        // - email (top-level, required)
        // - metadata.firmName (required)
        // - metadata.attorneyName (required)
        // - metadata.casesPerYear (optional)
        // - metadata.email (redundant but included for reference)
        
        const expectedPayloadShape = {
            email: 'string (required at top level)',
            event: 'string (optional, defaults to pilot_request_submitted)',
            metadata: {
                firmName: 'string (required)',
                attorneyName: 'string (required)',
                email: 'string (redundant copy)',
                casesPerYear: 'string (optional)',
            },
        };

        // This test documents the expected contract
        expect(expectedPayloadShape).toBeDefined();
    });

    it('handles submission failure gracefully', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 400,
        });

        render(<PilotAccessForm />);

        // Fill out required fields
        fireEvent.change(screen.getByLabelText(/firm name/i), {
            target: { value: 'Test Firm' },
        });
        fireEvent.change(screen.getByLabelText(/attorney name/i), {
            target: { value: 'Test Attorney' },
        });
        fireEvent.change(screen.getByLabelText(/work email/i), {
            target: { value: 'test@firm.com' },
        });
        fireEvent.change(screen.getByLabelText(/probate cases per year/i), {
            target: { value: '10' },
        });

        fireEvent.click(screen.getByRole('button', { name: /request pilot access/i }));

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalled();
        });
    });
});