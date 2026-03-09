import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('advisor/admin/marketplace smoke contracts', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    localStorage.setItem('auth_token', 'test-token');
    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('normalizes admin advisor queue payloads', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: {
          advisors: [{ id: 'adv_1' }],
          total: 1,
          page: 2,
          limit: 25,
        },
      })
    );

    const queue = await api.marketplace.admin.getQueue();

    expect(Array.isArray(queue.advisors)).toBe(true);
    expect(queue.advisors).toHaveLength(1);
    expect(queue.total).toBe(1);
    expect(queue.page).toBe(2);
    expect(queue.limit).toBe(25);

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/api/admin/marketplace/queue');
  });

  it('uses advisor bookings fallback endpoint when primary is unavailable', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Not found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ bookings: [{ id: 'book_1' }] }));

    const bookings = await api.marketplace.getAdvisorBookings();

    expect(bookings).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/bookings/marketplace/advisor-bookings');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/advisor/bookings');
  });

  it('uses my-bookings fallback endpoint when primary is unavailable', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: 'Not found' }, 404))
      .mockResolvedValueOnce(jsonResponse({ data: { items: [{ id: 'my_1' }] } }));

    const bookings = await api.marketplace.getMyMarketplaceBookings();

    expect(bookings).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/bookings/marketplace/my-bookings');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/api/bookings/marketplace');
  });

  it('targets the marketplace payment-intent endpoint for checkout', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ clientSecret: 'pi_secret_123' }));

    const result = await api.marketplace.createBookingPaymentIntent('booking_123');

    expect(result.clientSecret).toBe('pi_secret_123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/bookings/marketplace/booking_123/payment');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });

  it('targets admin advisor action endpoints correctly', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    await api.marketplace.admin.approve('advisor_999', 'approved in smoke test');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/api/admin/marketplace/advisors/advisor_999/approve');
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ method: 'POST' });
  });
});
