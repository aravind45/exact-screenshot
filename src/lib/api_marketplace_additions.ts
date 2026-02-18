
// ============================================================
// Advisor Marketplace API Functions
// ADD these to the existing api.ts file inside the `api` export object,
// or import/extend as needed.
// ============================================================

// ---- Types for Marketplace API ----

export interface MarketplaceFilters {
  specialty?: string;
  state?: string;
  maxPriceCents?: number;
  advisorType?: string;
  minRating?: number;
  availableFrom?: string;  // ISO date
  availableTo?: string;
  page?: number;
  limit?: number;
}

export interface BookingCreateData {
  advisorId: string;
  ratePlanId: string;
  startTime: string;       // ISO UTC datetime
  timezone: string;
  estateId?: string;
  intakeAnswers?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface CancelBookingData {
  reason?: string;
}

export interface AdvisorProfileData {
  bio?: string;
  specialties?: string[];
  statesServed?: string[];
  languages?: string[];
  advisorType?: string;
  hourlyRate?: number;
  timezone?: string;
  requiresApproval?: boolean;
  cancellationHours?: number;
  maxSessionsPerDay?: number;
  bufferMinutes?: number;
  meetingLink?: string;
  publicNotes?: string;
  profileImage?: string;
  noShowPolicy?: string;
}

export interface RatePlanData {
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
  description?: string;
  currency?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface AdminApproveData {
  reason: string;
}

export interface AdminQueueParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  adminId?: string;
  targetType?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ResolveDisputeData {
  resolution: string;
  refundAmount?: number;   // cents, 0 = no refund, null = full refund
  action: 'REFUND' | 'RELEASE' | 'CLOSE';
}

// ---- Marketplace API Functions ----

/**
 * Browse approved advisors with filters and pagination.
 * GET /api/advisors/marketplace
 */
getMarketplaceAdvisors: async (filters?: MarketplaceFilters) => {
  const query = new URLSearchParams();
  if (filters?.specialty) query.append('specialty', filters.specialty);
  if (filters?.state) query.append('state', filters.state);
  if (filters?.maxPriceCents) query.append('maxPriceCents', filters.maxPriceCents.toString());
  if (filters?.advisorType) query.append('advisorType', filters.advisorType);
  if (filters?.minRating) query.append('minRating', filters.minRating.toString());
  if (filters?.availableFrom) query.append('availableFrom', filters.availableFrom);
  if (filters?.availableTo) query.append('availableTo', filters.availableTo);
  if (filters?.page) query.append('page', filters.page.toString());
  if (filters?.limit) query.append('limit', filters.limit.toString());
  const qs = query.toString() ? `?${query.toString()}` : '' ;
  const response = await fetch(`${API_URL}/advisors/marketplace${qs}`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Get a single advisor's public profile (approved advisors only).
 * GET /api/advisors/:id
 */
getAdvisorPublicProfile: async (id: string) => {
  const response = await fetch(`${API_URL}/advisors/${id}`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Get available booking slots for an advisor on a specific date.
 * GET /api/advisors/:id/slots?date=YYYY-MM-DD&ratePlanId=
 */
getAdvisorSlots: async (id: string, date: string, ratePlanId?: string) => {
  const query = new URLSearchParams({ date });
  if (ratePlanId) query.append('ratePlanId', ratePlanId);
  const response = await fetch(`${API_URL}/advisors/${id}/slots?${query.toString()}`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Create a new booking (executor only).
 * POST /api/bookings
 */
createBooking: async (data: BookingCreateData) => {
  const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
},

/**
 * Get all bookings for the authenticated executor.
 * GET /api/bookings/my-bookings
 */
getMyBookings: async () => {
  const response = await fetch(`${API_URL}/bookings/my-bookings`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Get all bookings for the authenticated advisor.
 * GET /api/bookings/advisor-bookings
 */
getAdvisorBookings: async () => {
  const response = await fetch(`${API_URL}/bookings/advisor-bookings`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Cancel a booking by ID.
 * POST /api/bookings/:id/cancel
 */
cancelBooking: async (id: string, reason?: string) => {
  const response = await fetch(`${API_URL}/bookings/${id}/cancel`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
},

/**
 * Create or update the advisor's own profile.
 * POST /api/advisors/profile
 */
createAdvisorProfile: async (data: AdvisorProfileData) => {
  const response = await fetch(`${API_URL}/advisors/profile`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
},

/**
 * Get the authenticated advisor's own profile.
 * GET /api/advisors/me
 */
getAdvisorProfile: async () => {
  const response = await fetch(`${API_URL}/advisors/me`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Create or update the advisor's rate plans.
 * POST /api/advisors/rates  (bulk upsert)
 */
updateAdvisorRates: async (plans: RatePlanData[]) => {
  const response = await fetch(`${API_URL}/advisors/rates`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ plans }),
  });
  return parseResponse(response);
},

/**
 * Submit advisor profile for admin review.
 * POST /api/advisors/submit-review
 */
submitAdvisorForReview: async () => {
  const response = await fetch(`${API_URL}/advisors/submit-review`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({}),
  });
  return parseResponse(response);
},

/**
 * Get the admin advisor review queue.
 * GET /api/admin/advisors/queue
 */
getAdminAdvisorQueue: async (params?: AdminQueueParams) => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.search) query.append('search', params.search);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_URL}/admin/advisors/queue${qs}`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Approve an advisor (admin only).
 * POST /api/admin/advisors/:id/approve
 */
approveAdvisor: async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/admin/advisors/${id}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
},

/**
 * Reject an advisor (admin only).
 * POST /api/admin/advisors/:id/reject
 */
rejectAdvisor: async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/admin/advisors/${id}/reject`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
},

/**
 * Pause an advisor (admin only).
 * POST /api/admin/advisors/:id/pause
 */
pauseAdvisor: async (id: string, reason: string) => {
  const response = await fetch(`${API_URL}/admin/advisors/${id}/pause`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ reason }),
  });
  return parseResponse(response);
},

/**
 * Get the admin audit log (paginated).
 * GET /api/admin/audit-log
 */
getAuditLog: async (params?: AuditLogParams) => {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());
  if (params?.action) query.append('action', params.action);
  if (params?.adminId) query.append('adminId', params.adminId);
  if (params?.targetType) query.append('targetType', params.targetType);
  if (params?.fromDate) query.append('fromDate', params.fromDate);
  if (params?.toDate) query.append('toDate', params.toDate);
  const qs = query.toString() ? `?${query.toString()}` : '';
  const response = await fetch(`${API_URL}/admin/audit-log${qs}`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Get disputes list (admin only).
 * GET /api/admin/disputes
 */
getDisputes: async (status?: string) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const response = await fetch(`${API_URL}/admin/disputes${qs}`, { headers: getHeaders() });
  return parseResponse(response);
},

/**
 * Resolve a dispute (admin only).
 * POST /api/admin/disputes/:id/resolve
 */
resolveDispute: async (id: string, data: ResolveDisputeData) => {
  const response = await fetch(`${API_URL}/admin/disputes/${id}/resolve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return parseResponse(response);
},

// ---- End of Marketplace API additions ----
