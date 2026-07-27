
export type CommunicationType = 'CALL' | 'EMAIL' | 'FACE_TO_FACE' | 'POSTAL_MAIL' | 'FAX' | 'NOTE' | 'OTHER';
export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';

export interface CommunicationAttachment {
    id: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
}

export interface Estate {
    id: string;
    name: string;
    deceasedFirstName: string;
    deceasedLastName: string;
    deceasedState: string;
    deceasedDateOfBirth?: string;
    deceasedDateOfDeath?: string;
    deceasedAddress?: string;
    deceasedSsn?: string;
    probateCounty?: string;
    probateStatus: string;
    courtCaseNumber?: string;
    estateType?: string;
    administrationType?: string;
    certifiedCopies?: number;
    inboundEmail?: string;
    handle?: string;

    // Hearing Info
    hearingDate?: string;
    hearingTime?: string;
    hearingDept?: string;
    hearingAddress?: string;

    // DE-150
    iaeaType?: 'FULL' | 'LIMITED';
    appointedDate?: string;

    roadmapProgress?: {
        completedTaskIds: string[];
        completedPhases: string[];
    };

    // Will & Codicil
    hasWill?: boolean;
    willDate?: string;
    hasCodicil?: boolean;
    codicilDate?: string;
    codicilDates?: string[];
    publicationNewspaper?: string;

    // Petitioner
    petitionerPhone?: string;
    petitionerIsAttorney?: boolean;

    // Financials
    estimatedPersonalProperty?: number;
    estimatedRealProperty?: number;
    estimatedAnnualIncome?: number;
    bondAmount?: number;
    bondWaived?: boolean;

    // Estate Assessment
    isSurvivingSpouse?: boolean;
    isSpouse?: boolean;
    hasTODDeed?: boolean;
    hasOutOfStateProperty?: boolean;
    hasUnknownHeirs?: boolean;
    isTrustRevocable?: boolean | null;
    hasContest?: boolean;

    // Financials continued
    estimatedLiabilities?: number;

    // Custom
    userRole?: string;
    user?: {
        fullName: string;
        state: string;
    };
    heirs?: Array<{
        id: string;
        name: string;
        relationship?: string;
        isAdult?: boolean;
        email?: string;
        phone?: string;
    }>;

    // Completeness
    completenessLevel?: string;
    estateStatus?: 'DRAFT' | 'MINIMUM_READY' | 'ACTIVE' | 'CLOSED';

    // Paths
    authorityType?: string;
    estateAuthorityType?: string;
    authorityDecision?: any;
    settlementPath?: string;
    userSelectedEstateAuthorityType?: string;
}

export interface Communication {
    id: string;
    assetId: string;
    type: CommunicationType;
    direction: CommunicationDirection;
    occurredAt: string;
    institutionName?: string;
    contactName?: string;
    contactChannel?: string;
    subject?: string;
    notes: string;
    followUpDueAt?: string;
    followUpCompletedAt?: string;
    statusChange?: string;
    attachments?: CommunicationAttachment[];
    asset?: {
        name: string;
        institution: string;
    };
}

export interface Liability {
    id: string;
    estateId: string;
    name: string;
    amount: number;
    status: 'DISCOVERED' | 'NOTICE_SENT' | 'CLAIM_FILED' | 'APPROVED' | 'REJECTED' | 'PAID' | 'DISPUTED';

    // Claims
    dateClaimFiled?: string;
    rejectionReason?: string;
    allowedAmount?: number;

    invoiceDate?: string;
    dueDate?: string;
    accountNumber?: string;
    notes?: string;
    contactPhone?: string;
    contactEmail?: string;
    priority?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    priorityClass: string;
    createdAt: string;
}

export interface Asset {
    id: string;
    estateId: string;
    name?: string;
    institution: string;
    assetType: string;
    value?: number;
    dateOfDeathValue?: number;
    inventoryValue?: number;
    inventoryNote?: string;
    inventoryCategory?: string;
    institutionPhone?: string;
    institutionEmail?: string;
    notes?: string;
    status?: string;
    priority?: string;
    authorityType?: string;
}

export interface LiabilityStats {
    total: number;
    paid: number;
    count: number;
    openCount: number;
    priorityBreakdown?: Record<string, { total: number, paid: number }>;
}

export interface DiscoveryCategory {
    id: string;
    estateId: string;
    category: string;
    status: 'REVIEWED' | 'NOT_FOUND' | 'NOT_CHECKED' | 'NA';
    evidenceSource?: string;
    reviewDate?: string;
    negativeFindings?: NegativeAssurance[];
}

export interface NegativeAssurance {
    id: string;
    discoveryCategoryId: string;
    statement: string;
    createdAt: string;
}

export interface DiscoveryStatus {
    categories: DiscoveryCategory[];
    progress: {
        total: number;
        completed: number;
        percentage: number;
        isComplete: boolean;
    };
}

export interface SolvencyAssessment {
    totalDebt: number;
    totalLiquidAssets: number;
    isSolvent: boolean;
    ratio: number;
    countLiquidAssets: number;
    noticePeriodStatus: 'OPEN' | 'CLOSED' | 'NOT_STARTED';
    daysRemaining: number;
}

export interface DistributionReadiness {
    allowed: boolean;
    status: 'ALLOWED' | 'RESTRICTED' | 'BLOCKED';
    reasons: string[];
    checks: {
        noticePeriodClosed: boolean;
        allClaimsPaid: boolean;
        inventoryFiled: boolean;
        assetsVerified: boolean;
        accountingComplete: boolean;
    };
    daysRemaining?: number;
}

export interface AccountingReadiness {
    status: 'DRAFT' | 'READY_FOR_REVIEW' | 'INCOMPLETE';
    checks: {
        inventoryObtained: boolean;
        assetsVerified: boolean;
        noticePeriodClosed: boolean;
        claimsResolved: boolean;
    };
    details: string[];
}

// ── Letters Dispatch ──────────────────────────────────────────────────────────
export interface LettersDispatch {
    id: string;
    estateId: string;
    institutionName: string;
    institutionType: string;
    needsOriginal: boolean;
    status: "not_sent" | "sent" | "acknowledged" | "na";
    sentAt?: string | null;
    acknowledgedAt?: string | null;
    followUpDueAt?: string | null;
    certifiedCopyRef?: string | null;
    notes?: string | null;
    isCustom: boolean;
    createdAt: string;
    updatedAt: string;
}

export type FormReadiness = Record<string, {
    ready: boolean;
    reason: string;
    status?: string;
    authorityTier?: string;
}>;

export interface RoadmapRevision {
    id: string;
    versionNumber: number;
    versionLabel: string;
    status: string;
    generationReason: string;
    generatedAt: string;
    createdNewVersion: boolean;
    triggerReasons: string[];
    changedInputFields: string[];
    addedTaskIds: string[];
    removedTaskIds: string[];
    changedTaskIds: string[];
    carriedCompletedTaskIds: string[];
    invalidatedCompletedTaskIds: string[];
}

export interface EstateRoadmapVersionHistoryItem {
    id: string;
    versionNumber: number;
    versionLabel: string;
    status: string;
    generationReason: string;
    createdAt: string;
    supersededAt?: string | null;
    changeSummary?: {
        addedTaskIds?: string[];
        removedTaskIds?: string[];
        changedTaskIds?: string[];
        carriedCompletedTaskIds?: string[];
        invalidatedCompletedTaskIds?: string[];
        triggerReasons?: string[];
        changedInputFields?: string[];
    } | null;
}

export interface RoadmapResponse {
    estateId: string;
    phases: any[]; // PhaseTaskList[] from settlementPhases
    triggers: {
        hasMinors: boolean;
        isSmallEstate: boolean;
        isPrimaryResidence: boolean;
        isContested: boolean;
        showBondWaiver: boolean;
        showSpecialNotice: boolean;
        activeEngines?: string[];
    };
    profile: any;
    version: string;
    pinnedAt?: string | null;
    roadmapRevision?: RoadmapRevision;
    versioningEnabled?: boolean;
}

const resolveApiUrl = () => {
    const configured = (import.meta.env.VITE_API_URL || "/api").trim();
    if (/^https?:\/\//i.test(configured)) {
        return configured.replace(/\/+$/, "");
    }

    if (typeof window !== "undefined" && window.location?.origin) {
        return new URL(configured, window.location.origin).toString().replace(/\/+$/, "");
    }

    return configured;
};

const API_URL = resolveApiUrl();

const getToken = () => localStorage.getItem("auth_token");

const ONBOARDING_GATE_REDIRECTS: Record<string, string> = {
    TRACK_SELECTION: "/onboarding",
    STATE_SELECTION: "/onboarding",
    AUTHORITY_SETUP: "/onboarding",
};

const getOnboardingGateRedirect = (step?: string): string => {
    const normalizedStep = (step || "").toUpperCase();
    return ONBOARDING_GATE_REDIRECTS[normalizedStep] || "/onboarding";
};

const getHeaders = () => {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
};

const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
};

const openBlobInNewTab = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
};


const blobToBase64 = async (blob: Blob): Promise<string> => {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = String(reader.result || "");
            const commaIndex = result.indexOf(",");
            if (commaIndex === -1) {
                reject(new Error("Failed to convert PDF blob to base64"));
                return;
            }
            resolve(result.slice(commaIndex + 1));
        };
        reader.onerror = () => reject(new Error("Failed to read PDF blob"));
        reader.readAsDataURL(blob);
    });
};
const parseResponse = async (response: Response) => {
    const text = await response.text();
    let data;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (e) {
        if (!response.ok) {
            throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
        }
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}...`);
    }

    if (!response.ok) {
        const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = data;

        // ESTATE LIFECYCLE GATING: Handle incomplete estate errors
        if (response.status === 409 && (data?.code === "INCOMPLETE_ESTATE" || data?.code === "MINIMUM_INTAKE_REQUIRED")) {
            (error as any).isEstateError = true;
            (error as any).requiredStep = data?.requiredStep || data?.wizardStep;
            (error as any).errorCode = data?.code;

            // Redirect to appropriate onboarding step if in browser context
            if (typeof window !== "undefined") {
                const step = data?.requiredStep || data?.wizardStep;
                if (step) {
                    // Use setTimeout to avoid navigation during render/sync operations
                    setTimeout(() => {
                        const currentPath = window.location.pathname;
                        // Only redirect if not already on onboarding pages
                        if (!currentPath.includes("/onboarding") && !currentPath.includes("/welcome")) {
                            const redirectUrl = getOnboardingGateRedirect(step);
                            console.warn(`[EstateGating] Redirecting to ${redirectUrl} due to incomplete estate`);
                            window.location.href = redirectUrl;
                        }
                    }, 0);
                }
            }
        }

        throw error;
    }

    return data;
};

const toArray = <T = any>(payload: any, candidateKeys: string[] = []): T[] => {
    if (Array.isArray(payload)) return payload as T[];

    if (payload && typeof payload === "object") {
        for (const key of candidateKeys) {
            const value = (payload as any)[key];
            if (Array.isArray(value)) return value as T[];
        }

        const data = (payload as any).data;
        if (Array.isArray(data)) return data as T[];

        if (data && typeof data === "object") {
            for (const key of candidateKeys) {
                const value = (data as any)[key];
                if (Array.isArray(value)) return value as T[];
            }
        }
    }

    return [];
};

const toMaybeNumber = (value: unknown): unknown => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed) return value;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : value;
};

const normalizeAdvisorProfile = <T extends Record<string, any> | null | undefined>(profile: T): T => {
    if (!profile || typeof profile !== "object") return profile;
    return {
        ...profile,
        hourlyRate: toMaybeNumber((profile as any).hourlyRate),
    } as T;
};

const normalizeAdvisorProfiles = <T extends Record<string, any>>(profiles: T[]): T[] =>
    profiles.map((profile) => normalizeAdvisorProfile(profile) as T);

const normalizeBookingStatus = (status: unknown): unknown => {
    if (status === "REQUESTED") return "PENDING";
    return status;
};

const normalizeBooking = <T extends Record<string, any> | null | undefined>(booking: T): T => {
    if (!booking || typeof booking !== "object") return booking;

    const normalizedSessionDuration = toMaybeNumber((booking as any).sessionDuration);
    const normalizedDurationMinutes = toMaybeNumber((booking as any).durationMinutes);

    let sessionDuration: unknown = normalizedSessionDuration;
    if (sessionDuration == null) {
        sessionDuration = typeof normalizedDurationMinutes === "number"
            ? normalizedDurationMinutes / 60
            : normalizedDurationMinutes;
    }

    return {
        ...booking,
        sessionDuration,
        sessionDate: (booking as any).sessionDate ?? (booking as any).startTime ?? null,
        status: normalizeBookingStatus((booking as any).status),
        totalAmount: toMaybeNumber((booking as any).totalAmount),
        platformFee: toMaybeNumber((booking as any).platformFee),
        advisorPayout: toMaybeNumber((booking as any).advisorPayout),
    } as T;
};

const normalizeBookings = <T extends Record<string, any>>(bookings: T[]): T[] =>
    bookings.map((booking) => normalizeBooking(booking) as T);
export const api = {
    getToken,
    /**
     * Auth Methods
     */
    login: async (email: string, password: string) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await parseResponse(response);
        if (!response.ok) {
            throw new Error(data.error || "Login failed");
        }

        localStorage.setItem("auth_token", data.token);
        return data;
    },

    register: async (data: { email: string, password: string, fullName: string, state?: string, role?: string, userType?: "EXECUTOR" | "ADVISOR", deceasedName?: string, estimatedValue?: string }) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const result = await parseResponse(response);
        if (!response.ok) {
            throw new Error(result.error || "Registration failed");
        }

        localStorage.setItem("auth_token", result.token);
        return result;
    },

    getMe: async () => {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    logout: async () => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            try {
                // Call server to blacklist token (works even with expired tokens)
                await fetch(`${API_URL}/auth/logout`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                });
            } catch (error) {
                console.error("Logout API call failed:", error);
                // Continue with local logout even if server call fails
            }
        }
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_last_activity");
    },

    refreshToken: async (): Promise<{ token: string } | null> => {
        const token = getToken();
        if (!token) return null;
        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });
            if (!response.ok) return null;
            const data = await response.json();
            if (data.token) {
                localStorage.setItem("auth_token", data.token);
            }
            return data;
        } catch {
            return null;
        }
    },

    forgotPassword: async (email: string) => {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        return parseResponse(response);
    },

    resetPassword: async (data: { email: string, token: string, newPassword: string }) => {
        const response = await fetch(`${API_URL}/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    resendVerificationEmail: async () => {
        const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    verifyEmail: async (data: { email: string, token: string }) => {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    admin: {
        getStats: async () => {
            const response = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getUsers: async (params?: { page?: number, limit?: number, search?: string }) => {
            const query = new URLSearchParams();
            if (params?.page) query.append("page", params.page.toString());
            if (params?.limit) query.append("limit", params.limit.toString());
            if (params?.search) query.append("search", params.search);
            const queryString = query.toString() ? `?${query.toString()}` : "";
            const response = await fetch(`${API_URL}/admin/users${queryString}`, { headers: getHeaders() });
            return parseResponse(response);
        },
        /** Download the admin user-audit CSV (metadata only — no credentials). */
        exportUsersCsv: async () => {
            const response = await fetch(`${API_URL}/admin/users/export`, { headers: getHeaders() });
            if (!response.ok) {
                throw new Error(`Export failed (${response.status})`);
            }
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `user-audit-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        },
        getInstitutions: async () => {
            const response = await fetch(`${API_URL}/admin/institutions`, { headers: getHeaders() });
            return parseResponse(response);
        },
        createInstitution: async (data: any) => {
            const response = await fetch(`${API_URL}/admin/institutions`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return parseResponse(response);
        },
        updateInstitution: async (id: string, data: any) => {
            const response = await fetch(`${API_URL}/admin/institutions/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return parseResponse(response);
        },
        deleteInstitution: async (id: string) => {
            const response = await fetch(`${API_URL}/admin/institutions/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return parseResponse(response);
        },
        resetEstate: async (estateId: string) => {
            const response = await fetch(`${API_URL}/admin/estates/${estateId}/reset`, {
                method: "PUT",
                headers: getHeaders()
            });
            return parseResponse(response);
        },
        waiveFees: async (userId: string, notes?: string) => {
            const response = await fetch(`${API_URL}/admin/waive-fees`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ userId, notes })
            });
            return parseResponse(response);
        },
        getMarketingEvents: async (params?: { page?: number, limit?: number }) => {
            const query = new URLSearchParams();
            if (params?.page) query.append("page", params.page.toString());
            if (params?.limit) query.append("limit", params.limit.toString());
            const queryString = query.toString() ? `?${query.toString()}` : "";
            const response = await fetch(`${API_URL}/admin/marketing/events${queryString}`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getJurisdictionHealth: async () => {
            const response = await fetch(`${API_URL}/admin/jurisdiction/health`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getStateDiagnostics: async (stateCode: string) => {
            const response = await fetch(`${API_URL}/admin/jurisdiction/${stateCode}/diagnostics`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getStateDiagnosticHistory: async (stateCode: string) => {
            const response = await fetch(`${API_URL}/admin/jurisdiction/${stateCode}/history`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getPendingCountyOverrides: async () => {
            const response = await fetch(`${API_URL}/admin/county-overrides/pending`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getCountyOverrides: async () => {
            const response = await fetch(`${API_URL}/admin/county-overrides`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getCountyOverrideDiff: async (id: string) => {
            const response = await fetch(`${API_URL}/admin/county-overrides/${id}/diff`, { headers: getHeaders() });
            return parseResponse(response);
        },
        approveCountyOverride: async (id: string, notes?: string) => {
            const response = await fetch(`${API_URL}/admin/county-overrides/${id}/approve`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ notes }),
            });
            return parseResponse(response);
        },
        rejectCountyOverride: async (id: string, reason: string) => {
            const response = await fetch(`${API_URL}/admin/county-overrides/${id}/reject`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ reason }),
            });
            return parseResponse(response);
        },
        previewRoadmap: async (profile: any) => {
            const response = await fetch(`${API_URL}/admin/jurisdiction/preview-roadmap`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(profile),
            });
            return parseResponse(response);
        },
    },

    /**
     * Triggers the automated follow-up check.
     */
    checkFollowUps: async () => {
        // TODO: Implement logic in Express if needed, or trigger Vercel function
        console.warn("checkFollowUps not yet implemented in Express backend");
        return { message: "Not implemented" };
    },

    /**
     * Sends a fax via PamFax integration.
     */
    sendFax: async (payload: {
        assetId: string;
        faxNumber: string;
        documentType?: string;
        subject?: string;
    }) => {
        const { assetId, ...data } = payload;
        const response = await fetch(`${API_URL}/assets/${assetId}/fax`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    /**
     * Get all assets from Neon DB
     */
    getAssets: async () => {
        const response = await fetch(`${API_URL}/assets`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    /**
     * Get single asset by ID
     */
    getAsset: async (id: string) => {
        const response = await fetch(`${API_URL}/assets/${id}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    /**
     * Create a new asset in Neon DB
     */
    createAsset: async (assetData: any) => {
        const response = await fetch(`${API_URL}/assets`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(assetData),
        });
        return parseResponse(response);
    },

    updateAsset: async (id: string, updates: any) => {
        const response = await fetch(`${API_URL}/assets/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(updates),
        });
        return parseResponse(response);
    },

    deleteAsset: async (id: string) => {
        const response = await fetch(`${API_URL}/assets/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    async downloadEstateDocument(formCode: string, filename: string = "document.pdf") {
        const response = await fetch(`${API_URL}/estates/my/documents/${formCode}/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to download document");
        const blob = await response.blob();
        downloadBlob(blob, filename);
    },

    async viewEstateDocument(formCode: string) {
        const response = await fetch(`${API_URL}/estates/my/documents/${formCode}/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to view document");
        const blob = await response.blob();
        openBlobInNewTab(blob);
    },

    // Liabilities
    async generateLetter(id: string, overrides?: any, filename: string = "settlement-letter.pdf") {
        const response = await fetch(`${API_URL}/assets/${id}/generate-letter`, {
            method: "POST",
            headers: getHeaders(),
            body: overrides ? JSON.stringify(overrides) : undefined
        });
        if (!response.ok) throw new Error("Failed to generate letter");
        const blob = await response.blob();
        downloadBlob(blob, filename);
    },

    async batchGenerateLetters(assetIds: string[], filename: string = "batch-letters.pdf") {
        const response = await fetch(`${API_URL}/assets/batch-generate-letters`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ assetIds })
        });
        if (!response.ok) throw new Error("Failed to generate batch letters");
        const blob = await response.blob();
        downloadBlob(blob, filename);
    },


    getAssetDocuments: async (assetId: string) => {
        const response = await fetch(`${API_URL}/assets/${assetId}/documents`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    uploadAssetDocument: async (assetId: string, file: File, type: string) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${API_URL}/assets/${assetId}/documents`, {
            method: "POST",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        return parseResponse(response);
    },

    enrichAsset: async (id: string) => {
        const response = await fetch(`${API_URL}/enrichment/asset/${id}`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    searchInstitutions: async (query: string) => {
        if (!query || query.length < 2) return [];
        const response = await fetch(`${API_URL}/institutions?query=${encodeURIComponent(query)}`, {
            headers: getHeaders(),
        });
        if (!response.ok) return [];
        return response.json();
    },

    // Admin Settings
    getAdminSettings: async () => {
        const response = await fetch(`${API_URL}/admin/settings`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    updateAdminSetting: async (key: string, value: string, isSecret: boolean = false) => {
        const response = await fetch(`${API_URL}/admin/settings`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ key, value, isSecret }),
        });
        return parseResponse(response);
    },

    /**
     * Generate a smart draft for a communication log
     */
    generateDraft: async (assetId: string, context: {
        workflowStepTitle?: string;
        workflowStepDescription?: string;
    }) => {
        const response = await fetch(`${API_URL}/assets/${assetId}/generate-draft`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(context)
        });
        return parseResponse(response);
    },

    /**
     * User Profiles
     */
    getProfile: async () => {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    updateProfile: async (data: { fullName?: string; state?: string; role?: string }) => {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    changePassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await fetch(`${API_URL}/auth/change-password`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    /**
     * Admin Functions
     */
    getAdminStats: async () => {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getAdminUsers: async (params?: { page?: number, limit?: number, search?: string }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append("page", params.page.toString());
        if (params?.limit) query.append("limit", params.limit.toString());
        if (params?.search) query.append("search", params.search);
        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await fetch(`${API_URL}/admin/users${queryString}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getAdminInstitutions: async () => {
        const response = await fetch(`${API_URL}/admin/institutions`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    updateAdminInstitution: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/admin/institutions/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    getWorkflowMetrics: async () => {
        const response = await fetch(`${API_URL}/admin/workflows/metrics`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getWorkflowDeadLetters: async (params?: {
        page?: number;
        limit?: number;
        status?: "OPEN" | "REPLAYED";
        sourceTable?: "INBOX" | "OUTBOX";
        eventType?: string;
    }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append("page", params.page.toString());
        if (params?.limit) query.append("limit", params.limit.toString());
        if (params?.status) query.append("status", params.status);
        if (params?.sourceTable) query.append("sourceTable", params.sourceTable);
        if (params?.eventType) query.append("eventType", params.eventType);
        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await fetch(`${API_URL}/admin/workflows/dead-letters${queryString}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    replayWorkflowDeadLetter: async (deadLetterId: string, reason?: string) => {
        const response = await fetch(`${API_URL}/admin/workflows/dead-letters/${deadLetterId}/replay`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ reason }),
        });
        return parseResponse(response);
    },

    runWorkflowDrain: async () => {
        const response = await fetch(`${API_URL}/admin/workflows/drain`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({}),
        });
        return parseResponse(response);
    },
    getTemplates: async () => {
        const response = await fetch(`${API_URL}/admin/templates`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    uploadTemplate: async (name: string, file: File, options?: { state?: string, category?: string, title?: string, description?: string, icon?: string }) => {
        const headers = getHeaders();
        headers["Content-Type"] = "application/pdf";

        const url = new URL(`${API_URL}/admin/templates`);
        url.searchParams.append("name", name);
        if (options?.state) url.searchParams.append("state", options.state);
        if (options?.category) url.searchParams.append("category", options.category);
        if (options?.title) url.searchParams.append("title", options.title);
        if (options?.description) url.searchParams.append("description", options.description);
        if (options?.icon) url.searchParams.append("icon", options.icon);

        const response = await fetch(url.toString(), {
            method: "POST",
            headers,
            body: file
        });
        return parseResponse(response);
    },

    getMyEstate: async () => {
        const response = await fetch(`${API_URL}/estates/my`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getEstates: async () => {
        const response = await fetch(`${API_URL}/estates`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    updateMyEstate: async (data: any) => {
        const response = await fetch(`${API_URL}/estates/my`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    async getPetitionPdf(filename: string = "probate-petition.pdf") {
        const response = await fetch(`${API_URL}/estates/my/petition/pdf`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to generate PDF");
        const blob = await response.blob();
        downloadBlob(blob, filename);
    },

    createHeir: async (data: any) => {
        const response = await fetch(`${API_URL}/heirs`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    updateHeir: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/heirs/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    inviteHeir: async (id: string) => {
        const response = await fetch(`${API_URL}/heirs/${id}/invite`, {
            method: "POST",
            headers: getHeaders()
        });
        return parseResponse(response);
    },

    deleteHeir: async (id: string) => {
        const response = await fetch(`${API_URL}/heirs/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getHeirs: async () => {
        const response = await fetch(`${API_URL}/heirs`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getAgentInsights: async () => {
        const response = await fetch(`${API_URL}/agent/insights`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    /**
     * Processes a document using AI to extract estate information and discover hidden assets.
     */
    processDocument: async (file: File, saveToVault: boolean = false, documentType?: string) => {
        const formData = new FormData();
        formData.append("file", file);
        const url = new URL(`${API_URL}/documents/scan`, window.location.origin);
        if (saveToVault) url.searchParams.append("saveToVault", "true");
        if (documentType) url.searchParams.append("documentType", documentType);

        const token = getToken();
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        return parseResponse(response);
    },
    /**
     * Communication Log Methods
     */
    getCommunications: async (assetId: string): Promise<Communication[]> => {
        const response = await fetch(`${API_URL}/communications/asset/${assetId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    createCommunication: async (data: Partial<Communication>): Promise<Communication> => {
        const response = await fetch(`${API_URL}/communications`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    updateCommunication: async (id: string, data: Partial<Communication>): Promise<Communication> => {
        const response = await fetch(`${API_URL}/communications/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    deleteCommunication: async (id: string): Promise<{ success: boolean }> => {
        const response = await fetch(`${API_URL}/communications/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getInbox: async (): Promise<Communication[]> => {
        const response = await fetch(`${API_URL}/communications/inbox`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getOutbox: async (): Promise<Communication[]> => {
        const response = await fetch(`${API_URL}/communications/outbox`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    uploadCommunicationAttachment: async (communicationId: string, file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = getToken();
        const response = await fetch(`${API_URL}/communications/${communicationId}/attachments`, {
            method: "POST",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        return parseResponse(response);
    },

    getFollowUps: async (): Promise<Communication[]> => {
        const response = await fetch(`${API_URL}/communications/follow-ups`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    searchCommunications: async (query: string): Promise<Communication[]> => {
        const response = await fetch(`${API_URL}/communications/search?query=${encodeURIComponent(query)}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getTimeline: async (): Promise<Communication[]> => {
        const response = await fetch(`${API_URL}/communications/timeline`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    sendEmail: async (data: { assetId: string, to: string, subject: string, body: string, ccPersonalEmail?: boolean }) => {
        const response = await fetch(`${API_URL}/communications/send-email`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    // Estate Documents
    getEstateDocuments: async () => {
        const estate = await api.getMyEstate();
        if (!estate) throw new Error("No estate found");

        const response = await fetch(`${API_URL}/estates/${estate.id}/documents`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    uploadEstateDocument: async (documentType: string, name: string, file: File) => {
        const estate = await api.getMyEstate();
        if (!estate) throw new Error("No estate found");

        const headers = getHeaders();
        // Set content type based on file type
        headers["Content-Type"] = file.type || "application/octet-stream";

        const response = await fetch(
            `${API_URL}/estates/${estate.id}/documents?documentType=${encodeURIComponent(documentType)}&name=${encodeURIComponent(name)}`,
            {
                method: "POST",
                headers,
                body: file
            }
        );
        return parseResponse(response);
    },

    uploadEstateDocumentFile: async (id: string, file: File) => {
        const headers = getHeaders();
        headers["Content-Type"] = file.type || "application/octet-stream";

        const response = await fetch(`${API_URL}/estates/my/documents/${id}/upload`, {
            method: "POST",
            headers,
            body: file
        });
        return parseResponse(response);
    },

    createEstateDocument: async (data: any) => {
        const response = await fetch(`${API_URL}/estates/my/documents`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    updateEstateDocument: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/estates/my/documents/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    deleteEstateDocument: async (id: string) => {
        const response = await fetch(`${API_URL}/estates/my/documents/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    // Removed duplicate downloadEstateDocument

    /**
     * Deadline Methods
     */
    getHelpVideos: async () => {
        const response = await fetch(`${API_URL}/help/videos`, { headers: getHeaders() });
        return parseResponse(response);
    },

    // --- MAILING (LOB) ---
    mailCreditor: async (id: string) => {
        const response = await fetch(`${API_URL}/mail/creditor/${id}`, {
            method: 'POST',
            headers: getHeaders(),
        });
        return parseResponse(response);
    },
    mailHeir: async (id: string) => {
        const response = await fetch(`${API_URL}/mail/heir/${id}`, {
            method: 'POST',
            headers: getHeaders(),
        });
        return parseResponse(response);
    },
    getMailingHistory: async () => {
        const response = await fetch(`${API_URL}/mail/history`, { headers: getHeaders() });
        return parseResponse(response);
    },

    getDeadlines: async (estateId: string) => {
        const response = await fetch(`${API_URL}/estates/${estateId}/deadlines`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    createDeadline: async (estateId: string, data: any) => {
        const response = await fetch(`${API_URL}/estates/${estateId}/deadlines`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    updateDeadline: async (estateId: string, id: string, data: any) => {
        const response = await fetch(`${API_URL}/estates/${estateId}/deadlines/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    deleteDeadline: async (estateId: string, id: string) => {
        const response = await fetch(`${API_URL}/estates/${estateId}/deadlines/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    generateDeadlines: async (estateId: string) => {
        const response = await fetch(`${API_URL}/estates/${estateId}/deadlines/generate`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    recomputeDeadlines: async (estateId: string) => {
        const response = await fetch(`${API_URL}/estates/${estateId}/deadlines/recompute`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    /**
     * Discovery Methods
     */
    getDiscoveryStatus: async (estateId: string): Promise<DiscoveryStatus> => {
        const response = await fetch(`${API_URL}/discovery/${estateId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    initializeDiscoveryCategories: async (estateId: string): Promise<DiscoveryCategory[]> => {
        const response = await fetch(`${API_URL}/discovery/${estateId}/initialize`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    updateDiscoveryCategory: async (id: string, data: { status: string, evidenceSource?: string }): Promise<DiscoveryCategory> => {
        const response = await fetch(`${API_URL}/discovery/category/${id}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    addNegativeAssurance: async (categoryId: string, statement: string): Promise<NegativeAssurance> => {
        const response = await fetch(`${API_URL}/discovery/category/${categoryId}/negative-assurance`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ statement }),
        });
        return parseResponse(response);
    },

    getDiscoveryInsights: async (estateId: string): Promise<any[]> => {
        const response = await fetch(`${API_URL}/discovery/${estateId}/insights`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    analyzeDiscoveryDocument: async (file: File, estateId: string): Promise<any> => {
        const formData = new FormData();
        formData.append("file", file);
        const token = getToken();
        const response = await fetch(`${API_URL}/discovery/analyze?estateId=${estateId}`, {
            method: "POST",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        return parseResponse(response);
    },

    downloadDossier: async (filename: string = "estate-dossier.pdf") => {
        const response = await fetch(`${API_URL}/estates/my/dossier/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to generate dossier");
        const blob = await response.blob();
        downloadBlob(blob, filename);
    },


    post: async (path: string, body: any) => {
        const response = await fetch(`${API_URL}${path}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(body),
        });
        const data = await parseResponse(response);
        return { data };
    },

    async getActivities(): Promise<any[]> {
        const response = await fetch(`${API_URL}/estates/my/activities`, { headers: getHeaders() });
        return parseResponse(response);
    },

    async updateActivity(id: string, notes: string): Promise<any> {
        const response = await fetch(`${API_URL}/estates/my/activities/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ notes })
        });
        return parseResponse(response);
    },

    async downloadActivityLog(): Promise<void> {
        const response = await fetch(`${API_URL}/estates/my/activities/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to download activity log");
        const blob = await response.blob();
        downloadBlob(blob, "activity-log.csv");
    },

    updateRoadmap: async (data: { completedTaskIds: string[], completedPhases: string[], taskId?: string, action?: 'COMPLETED' | 'UNCOMPLETED' | 'PHASE_COMPLETED', phase?: string, taskTitle?: string, phaseName?: string }) => {
        const response = await fetch(`${API_URL}/estates/my/roadmap`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    async getFormReadiness(): Promise<FormReadiness> {
        const response = await fetch(`${API_URL}/forms/readiness`, { headers: getHeaders() });
        return parseResponse(response);
    },

    generateForm: async (formId: string, isPreview: boolean = true): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/generate`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ formId, isPreview }),
        });
        if (!response.ok) throw new Error("Failed to generate form");
        return await response.blob();
    },

    getFormTemplates: async () => {
        const response = await fetch(`${API_URL}/forms/templates`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getTemplateFile: async (name: string): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/templates/${name}/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to download template");
        return await response.blob();
    },

    getCAFormSchema: async (formId: string): Promise<{
        formId: string;
        title: string;
        schema: Array<{
            key: string;
            label: string;
            type: string;
            required: boolean;
            description?: string;
            overridable: boolean;
        }>;
    }> => {
        const response = await fetch(`${API_URL}/forms/ca/schema/${formId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    previewCAFormFields: async (formId: string, overrides?: Record<string, any>): Promise<{
        formId: string;
        fieldValues: Record<string, any>;
        validationErrors: string[];
    }> => {
        const response = await fetch(`${API_URL}/forms/ca/preview`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, overrides: overrides || {} }),
        });
        return parseResponse(response);
    },

    generateCAForm: async (formId: string, isPreview: boolean = true, overrides?: Record<string, any>): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/ca/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, isPreview, overrides: overrides || {} }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to generate CA form' }));
            throw new Error(err.error || 'Failed to generate CA form');
        }
        return await response.blob();
    },


    getNYFormSchema: async (formId: string): Promise<{
        formId: string;
        title: string;
        schema: Array<{
            key: string;
            label: string;
            type: string;
            required: boolean;
            description?: string;
            overridable: boolean;
        }>;
    }> => {
        const response = await fetch(`${API_URL}/forms/ny/schema/${formId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    previewNYFormFields: async (formId: string, overrides?: Record<string, any>): Promise<{
        formId: string;
        fieldValues: Record<string, any>;
        validationErrors: string[];
    }> => {
        const response = await fetch(`${API_URL}/forms/ny/preview`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, overrides: overrides || {} }),
        });
        return parseResponse(response);
    },

    generateNYForm: async (formId: string, isPreview: boolean = true, overrides?: Record<string, any>): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/ny/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, isPreview, overrides: overrides || {} }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to generate NY form' }));
            throw new Error(err.error || 'Failed to generate NY form');
        }
        return await response.blob();
    },

    getTXFormSchema: async (formId: string): Promise<{
        formId: string;
        title: string;
        schema: Array<{
            key: string;
            label: string;
            type: string;
            required: boolean;
            description?: string;
            overridable: boolean;
        }>;
    }> => {
        const response = await fetch(`${API_URL}/forms/tx/schema/${formId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    previewTXFormFields: async (formId: string, overrides?: Record<string, any>): Promise<{
        formId: string;
        fieldValues: Record<string, any>;
        validationErrors: string[];
    }> => {
        const response = await fetch(`${API_URL}/forms/tx/preview`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, overrides: overrides || {} }),
        });
        return parseResponse(response);
    },

    generateTXForm: async (formId: string, isPreview: boolean = true, overrides?: Record<string, any>): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/tx/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, isPreview, overrides: overrides || {} }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to generate TX form' }));
            throw new Error(err.error || 'Failed to generate TX form');
        }
        return await response.blob();
    },

    getFLFormSchema: async (formId: string): Promise<{
        formId: string;
        title: string;
        schema: Array<{
            key: string;
            label: string;
            type: string;
            required: boolean;
            description?: string;
            overridable: boolean;
        }>;
    }> => {
        const response = await fetch(`${API_URL}/forms/fl/schema/${formId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    previewFLFormFields: async (formId: string, overrides?: Record<string, any>): Promise<{
        formId: string;
        fieldValues: Record<string, any>;
        validationErrors: string[];
    }> => {
        const response = await fetch(`${API_URL}/forms/fl/preview`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, overrides: overrides || {} }),
        });
        return parseResponse(response);
    },

    generateFLForm: async (formId: string, isPreview: boolean = true, overrides?: Record<string, any>): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/fl/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, isPreview, overrides: overrides || {} }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to generate FL form' }));
            throw new Error(err.error || 'Failed to generate FL form');
        }
        return await response.blob();
    },

    getNJFormSchema: async (formId: string): Promise<{
        formId: string;
        title: string;
        schema: Array<{
            key: string;
            label: string;
            type: string;
            required: boolean;
            description?: string;
            overridable: boolean;
        }>;
    }> => {
        const response = await fetch(`${API_URL}/forms/nj/schema/${formId}`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    previewNJFormFields: async (formId: string, overrides?: Record<string, any>): Promise<{
        formId: string;
        fieldValues: Record<string, any>;
        validationErrors: string[];
    }> => {
        const response = await fetch(`${API_URL}/forms/nj/preview`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, overrides: overrides || {} }),
        });
        return parseResponse(response);
    },

    generateNJForm: async (formId: string, isPreview: boolean = true, overrides?: Record<string, any>): Promise<Blob> => {
        const response = await fetch(`${API_URL}/forms/nj/generate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ formId, isPreview, overrides: overrides || {} }),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ error: 'Failed to generate NJ form' }));
            throw new Error(err.error || 'Failed to generate NJ form');
        }
        return await response.blob();
    },

    inviteCollaborator: async (data: { estateId: string, email: string, role: string }) => {
        const response = await fetch(`${API_URL}/collaboration/invitations`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    acceptInvitation: async (token: string) => {
        const response = await fetch(`${API_URL}/collaboration/invitations/accept`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ token }),
        });
        return parseResponse(response);
    },

    getCollaborators: async (estateId: string) => {
        const response = await fetch(`${API_URL}/collaboration/${estateId}/collaborators`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    createExtraSeatSession: async (data: { estateId: string, email: string, role: string }) => {
        const response = await fetch(`${API_URL}/collaboration/extra-seat-session`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    deleteInvitation: async (id: string) => {
        const response = await fetch(`${API_URL}/collaboration/invitations/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    // Liabilities
    getLiabilities: async () => {
        const response = await fetch(`${API_URL}/liabilities`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getLiabilityStats: async (): Promise<LiabilityStats> => {
        const response = await fetch(`${API_URL}/liabilities/stats`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getSolvency: async (): Promise<SolvencyAssessment> => {
        const response = await fetch(`${API_URL}/liabilities/solvency`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getPriorityOptions: async () => {
        const response = await fetch(`${API_URL}/liabilities/priority-options`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    previewPetition: async (data: any) => {
        const requestedDocumentId = String(
            data?.documentId || data?.formId || data?.formType || "DE-111"
        ).trim().toUpperCase();

        // Legacy aliases used across probate pages.
        const documentAliasMap: Record<string, string> = {
            NOTICE_OF_HEARING: "DE-121",
            RECEIPT_DISTRIBUTION: "RECEIPT_DISTRIBUTION",
            SMALL_ESTATE_AFFIDAVIT: "SMALL_ESTATE_AFFIDAVIT",
            AFFIDAVIT: "SMALL_ESTATE_AFFIDAVIT",
        };

        const documentId = documentAliasMap[requestedDocumentId] || requestedDocumentId;
        const { documentId: _documentId, formId: _formId, formType: _formType, ...overrides } = data || {};

        const toBase64Response = async (response: Response) => {
            const pdfBlob = await response.blob();
            const pdfBase64 = await blobToBase64(pdfBlob);
            return {
                documentId,
                pdfBase64,
                mimeType: "application/pdf",
                filename: `${documentId}_Generated.pdf`,
            };
        };

        // Prefer the CA pipeline for forms with explicit CA auto-fill registries.
        if (["DE-111", "DE-160", "DE-310"].includes(documentId)) {
            const caResponse = await fetch(`${API_URL}/forms/ca/generate`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    formId: documentId,
                    isPreview: true,
                    overrides,
                }),
            });

            if (caResponse.ok) {
                return toBase64Response(caResponse);
            }
        }

        let primaryError: any;
        try {
            const response = await fetch(`${API_URL}/documents/generate`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({
                    documentId,
                    isPreview: true,
                    overrides,
                }),
            });
            return await parseResponse(response);
        } catch (error: any) {
            primaryError = error;
        }

        // Compatibility fallback for environments still using /forms/generate.
        const fallbackResponse = await fetch(`${API_URL}/forms/generate`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
                formId: documentId,
                isPreview: true,
                overrides,
            }),
        });

        if (fallbackResponse.ok) {
            return toBase64Response(fallbackResponse);
        }

        if (primaryError) {
            throw primaryError;
        }

        throw new Error(`Preview generation failed for ${documentId}`);
    },

    createLiability: async (data: Partial<Liability>) => {
        const response = await fetch(`${API_URL}/liabilities`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    updateLiability: async (id: string, data: Partial<Liability>) => {
        const response = await fetch(`${API_URL}/liabilities/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    deleteLiability: async (id: string) => {
        const response = await fetch(`${API_URL}/liabilities/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    async getAccountingReadiness(): Promise<AccountingReadiness> {
        const response = await fetch(`${API_URL}/estates/my/accounting-readiness`, { headers: getHeaders() });
        return parseResponse(response);
    },

    getDistributionReadiness: async (): Promise<DistributionReadiness> => {
        const response = await fetch(`${API_URL}/estates/my/distribution-readiness`, { headers: getHeaders() });
        return parseResponse(response);
    },

    logDistributionActivity: async (data: { eventType: string, notes?: string }): Promise<any> => {
        const response = await fetch(`${API_URL}/estates/my/distribution-activity`, {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    // Document Recommendations
    getDocumentRecommendations: async (assetId: string, params?: {
        workflowStep?: string;
        communicationType?: string;
        institution?: string;
    }) => {
        const queryParams = new URLSearchParams();
        if (params?.workflowStep) queryParams.append('workflowStep', params.workflowStep);
        if (params?.communicationType) queryParams.append('communicationType', params.communicationType);
        if (params?.institution) queryParams.append('institution', params.institution);

        const response = await fetch(
            `${API_URL}/communications/asset/${assetId}/document-recommendations?${queryParams.toString()}`,
            { headers: getHeaders() }
        );
        return parseResponse(response);
    },

    getAvailableDocuments: async () => {
        const response = await fetch(`${API_URL}/communications/estate/available-documents`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    validateDocumentCompleteness: async (assetId: string, attachedDocumentIds: string[]) => {
        const response = await fetch(`${API_URL}/communications/validate-completeness`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ assetId, attachedDocumentIds }),
        });
        return parseResponse(response);
    },

    // Roadmap Methods
    getEstateRoadmap: async (id: string): Promise<RoadmapResponse> => {
        const response = await fetch(`${API_URL}/estates/${id}/roadmap`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    selectEstateTrack: async (id: string, data: {
        estateAuthorityType: "PROBATE" | "TRUST" | "BOTH";
        hasProbateAssets?: boolean;
        hasTrustAssets?: boolean;
        hasBeneficiaryAssets?: boolean;
        assistedDecisionAnswers?: Record<string, unknown>;
    }) => {
        const response = await fetch(`${API_URL}/estates/${id}/select-track`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
    },

    getTaskCompletions: async (id: string) => {
        const response = await fetch(`${API_URL}/estates/${id}/tasks`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    completeTask: async (id: string, taskId: string, notes?: string) => {
        const response = await fetch(`${API_URL}/estates/${id}/tasks/${taskId}/complete`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ notes }),
        });
        return parseResponse(response);
    },

    uncompleteTask: async (id: string, taskId: string) => {
        const response = await fetch(`${API_URL}/estates/${id}/tasks/${taskId}/complete`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    pinRoadmap: async (id: string) => {
        const response = await fetch(`${API_URL}/estates/${id}/pin`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    repinRoadmap: async (id: string, force: boolean = false) => {
        const response = await fetch(`${API_URL}/estates/${id}/repin`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ force }),
        });
        return parseResponse(response);
    },
    getEstateRoadmapVersions: async (id: string): Promise<{ versions: EstateRoadmapVersionHistoryItem[] }> => {
        const response = await fetch(`${API_URL}/estates/${id}/roadmap-versions`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    activateEstateRoadmapVersion: async (id: string, versionId: string) => {
        const response = await fetch(`${API_URL}/estates/${id}/roadmap-versions/${versionId}/activate`, {
            method: "POST",
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    help: {
        getRecommendations: async (estateId: string) => {
            const response = await fetch(`${API_URL}/help/recommendations/${estateId}`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        logReference: async (estateId: string, topic: string) => {
            const response = await fetch(`${API_URL}/help/log`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ estateId, topic }),
            });
            return parseResponse(response);
        },
        chat: async (question: string) => {
            const response = await fetch(`${API_URL}/help/chat`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ question }),
            });
            return parseResponse(response);
        },
        contactSupport: async (subject: string, message: string, estateId?: string) => {
            const response = await fetch(`${API_URL}/help/contact`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ subject, message, estateId }),
            });
            return parseResponse(response);
        },
    },

    /**
     * Billing Methods
     */
    billing: {
        createCheckout: async (options?: { skipTrial?: boolean, successUrl?: string, cancelUrl?: string }) => {
            const response = await fetch(`${API_URL}/billing/checkout`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(options || {}),
            });
            return parseResponse(response);
        },

        getStatus: async () => {
            const response = await fetch(`${API_URL}/billing/status`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },

        createPortalSession: async (options?: { returnUrl?: string }) => {
            const response = await fetch(`${API_URL}/billing/portal`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(options || {}),
            });
            return parseResponse(response);
        },
    },

    /**
     * Admin Billing Methods
     */
    adminBilling: {
        getTransactions: async () => {
            const response = await fetch(`${API_URL}/admin/transactions`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },

        waiveFees: async (userId: string, notes?: string) => {
            const response = await fetch(`${API_URL}/admin/waive-fees`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ userId, notes }),
            });
            return parseResponse(response);
        },

        issueRefund: async (transactionId: string, notes?: string) => {
            const response = await fetch(`${API_URL}/admin/refund`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ transactionId, notes }),
            });
            return parseResponse(response);
        },
    },

    /**
     * Admin Knowledge Management
     */
    adminKnowledge: {
        getStats: async () => {
            const response = await fetch(`${API_URL}/admin/knowledge/stats`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        getDocuments: async (offset = 0, limit = 100) => {
            const response = await fetch(`${API_URL}/admin/knowledge/documents?offset=${offset}&limit=${limit}`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        ingestText: async (text: string, source: string, title?: string, docType: string = 'OTHER', jurisdiction?: string) => {
            const response = await fetch(`${API_URL}/admin/knowledge/ingest`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ text, source, title: title || source, docType, jurisdiction }),
            });
            return parseResponse(response);
        },
        ingestMatrixXlsx: async (file: File) => {
            const formData = new FormData();
            formData.append("file", file);

            const token = localStorage.getItem("auth_token");
            const response = await fetch(`${API_URL}/admin/knowledge/ingest-matrix`, {
                method: "POST",
                headers: {
                    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                },
                body: formData,
            });
            return parseResponse(response);
        },
        deleteDocument: async (id: string) => {
            const response = await fetch(`${API_URL}/admin/knowledge/documents/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
    },
    /**
     * AI Agents
     */
    agents: {
        getChecklist: async (estateId: string, phase: string = 'discovery') => {
            const response = await fetch(`${API_URL}/agent/estates/${estateId}/checklist?phase=${phase}`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        getTimeline: async (estateId: string) => {
            const response = await fetch(`${API_URL}/agent/estates/${estateId}/timeline`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        fillForm: async (estateId: string, formType: string) => {
            const response = await fetch(`${API_URL}/agent/estates/${estateId}/forms/fill`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ formType }),
            });
            return parseResponse(response);
        },
        getAvailableForms: async (estateId: string) => {
            const response = await fetch(`${API_URL}/agent/estates/${estateId}/forms/available`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        }
    },
    estates: {
        list: async () => {
            const response = await fetch(`${API_URL}/estates`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        getById: async (id: string) => {
            const response = await fetch(`${API_URL}/estates/${id}`, {
                headers: getHeaders(),
            });
            return parseResponse(response);
        }
    },
    marketing: {
        submitChecklist: async (data: any) => {
            const response = await fetch(`${API_URL}/marketing/checklist`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            return parseResponse(response);
        },
        submitContact: async (data: { name: string, email: string, message: string, source?: string }) => {
            const response = await fetch(`${API_URL}/marketing/contact`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            return parseResponse(response);
        },
        trackEvent: async (data: any) => {
            // silent fail for tracking
            try {
                await fetch(`${API_URL}/marketing/event`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                });
            } catch (e) {
                console.warn("Tracking failed", e);
            }
        }
    },
    advisors: {
        getMe: async () => {
            const response = await fetch(`${API_URL}/advisors/me`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return normalizeAdvisorProfile(payload);
        },
        updateProfile: async (data: { bio?: string, expertise?: string[], hourlyRate?: number, licenseNumber?: string, licenseDocument?: string, profileImage?: string }) => {
            const response = await fetch(`${API_URL}/advisors/profile`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            const payload = await parseResponse(response);
            return normalizeAdvisorProfile(payload);
        },
        getMarketplace: async (filters?: { expertise?: string, maxRate?: number }) => {
            const url = new URL(`${API_URL}/advisors/marketplace`, window.location.origin);
            if (filters?.expertise) url.searchParams.append('expertise', filters.expertise);
            if (filters?.maxRate) url.searchParams.append('maxRate', filters.maxRate.toString());
            const response = await fetch(url.toString(), { headers: getHeaders() });
            const payload = await parseResponse(response);
            return normalizeAdvisorProfiles(toArray(payload, ['advisors', 'results', 'items']));
        },
        adminList: async () => {
            const response = await fetch(`${API_URL}/advisors/admin/list`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return normalizeAdvisorProfiles(toArray(payload, ['advisors', 'results', 'items']));
        },
        adminVerify: async (id: string, status: 'VERIFIED' | 'REJECTED') => {
            const response = await fetch(`${API_URL}/advisors/${id}/verify`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ status }),
            });
            return parseResponse(response);
        },
        startStripeOnboarding: async (data: { returnUrl: string, refreshUrl: string }) => {
            const response = await fetch(`${API_URL}/advisors/stripe/connect/onboard`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        getStripeStatus: async () => {
            const response = await fetch(`${API_URL}/advisors/stripe/connect/status`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getDashboardStats: async () => {
            const response = await fetch(`${API_URL}/advisors/dashboard/stats`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getDashboardEarnings: async () => {
            const response = await fetch(`${API_URL}/advisors/dashboard/earnings`, { headers: getHeaders() });
            return parseResponse(response);
        }
    },
    bookings: {
        create: async (data: { advisorId: string, estateId?: string, sessionDuration: number, sessionDate: string }) => {
            const response = await fetch(`${API_URL}/bookings`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            const payload = await parseResponse(response);
            return normalizeBooking(payload);
        },
        createPaymentIntent: async (bookingId: string) => {
            const response = await fetch(`${API_URL}/bookings/${bookingId}/payment`, {
                method: "POST",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        confirm: async (bookingId: string) => {
            const response = await fetch(`${API_URL}/bookings/${bookingId}/confirm`, {
                method: "POST",
                headers: getHeaders(),
            });
            const payload = await parseResponse(response);
            return normalizeBooking(payload);
        },
        cancel: async (bookingId: string, reason?: string) => {
            const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ reason }),
            });
            return parseResponse(response);
        },
        getMyBookings: async () => {
            const response = await fetch(`${API_URL}/bookings/my-bookings`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return normalizeBookings(toArray(payload, ['bookings', 'items']));
        },
        getAdvisorBookings: async () => {
            const response = await fetch(`${API_URL}/bookings/advisor-bookings`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return normalizeBookings(toArray(payload, ['bookings', 'items']));
        },
        getById: async (id: string) => {
            const response = await fetch(`${API_URL}/bookings/${id}`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return normalizeBooking(payload);
        }
    },
    /**
     * Marketplace API — two-sided advisor scheduling marketplace
     */
    marketplace: {
        // ── Public / Executor-facing ──────────────────────────────────────────
        /** Search approved advisors with optional filters */
        search: async (filters?: {
            q?: string;
            advisorType?: string;
            specialty?: string;
            state?: string;
            minRate?: number;
            maxRate?: number;
            minRating?: number;
            page?: number;
            limit?: number;
        }) => {
            const q = new URLSearchParams();
            if (filters?.q) q.set("q", filters.q);
            if (filters?.advisorType) q.set("advisorType", filters.advisorType);
            if (filters?.specialty) q.set("specialty", filters.specialty);
            if (filters?.state) q.set("state", filters.state);
            if (filters?.minRate !== undefined) q.set("minRate", filters.minRate.toString());
            if (filters?.maxRate !== undefined) q.set("maxRate", filters.maxRate.toString());
            if (filters?.minRating !== undefined) q.set("minRating", filters.minRating.toString());
            if (filters?.page) q.set("page", filters.page.toString());
            if (filters?.limit) q.set("limit", filters.limit.toString());
            const qs = q.toString() ? `?${q.toString()}` : "";
            const response = await fetch(`${API_URL}/marketplace${qs}`, { headers: getHeaders() });
            return parseResponse(response);
        },
        /** Get a single advisor's public profile */
        getAdvisorProfile: async (advisorId: string) => {
            const response = await fetch(`${API_URL}/marketplace/${advisorId}`, { headers: getHeaders() });
            return parseResponse(response);
        },
        /** Get available slots for a specific date */
        getSlots: async (advisorId: string, date: string, ratePlanId?: string) => {
            const query = new URLSearchParams({ date });
            if (ratePlanId) query.set('ratePlanId', ratePlanId);
            const response = await fetch(API_URL + '/marketplace/' + advisorId + '/slots?' + query.toString(), {
                headers: getHeaders(),
            });
            const payload = await parseResponse(response);
            const rawSlots = Array.isArray(payload) ? payload : (Array.isArray((payload as any)?.slots) ? (payload as any).slots : []);
            return rawSlots
                .map((slot: any) => (typeof slot === 'string' ? slot : slot?.startTime ?? slot?.start ?? null))
                .filter((slot: any): slot is string => typeof slot === 'string');
        },
        /** Get available slots across a date range (up to 60 days) */
        getAvailabilityRange: async (advisorId: string, from: string, to: string, ratePlanId?: string) => {
            const query = new URLSearchParams({ from, to });
            if (ratePlanId) query.set('ratePlanId', ratePlanId);
            const response = await fetch(API_URL + '/marketplace/' + advisorId + '/availability?' + query.toString(), {
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        // ── Advisor self-service profile ───────────────────────────────────────
        /** Get or upsert the current advisor's marketplace profile */
        getMyProfile: async () => {
            const response = await fetch(`${API_URL}/advisor/profile`, { headers: getHeaders() });
            return parseResponse(response);
        },
        upsertMyProfile: async (data: {
            displayName?: string;
            bio?: string;
            advisorType?: string;
            specialties?: string[];
            statesServed?: string[];
            languages?: string[];
            timezone?: string;
            cancellationHours?: number;
            maxSessionsPerDay?: number;
            bufferMinutes?: number;
            meetingLink?: string;
            publicNotes?: string;
            requiresApproval?: boolean;
            hourlyRate?: number;
            licenseNumber?: string;
            expertise?: string[];
        }) => {
            const response = await fetch(`${API_URL}/advisor/profile`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        submitForReview: async () => {
            const response = await fetch(`${API_URL}/advisor/profile/submit`, {
                method: "POST",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },

        // ── Rate Plans ─────────────────────────────────────────────────────────
        getRatePlans: async () => {
            const response = await fetch(`${API_URL}/advisor/rate-plans`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return toArray(payload, ['ratePlans', 'plans', 'items']);
        },
        createRatePlan: async (data: { label: string; durationMinutes: number; amountCents: number; currency?: string; description?: string }) => {
            const response = await fetch(`${API_URL}/advisor/rate-plans`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        updateRatePlan: async (id: string, data: Partial<{ label: string; durationMinutes: number; amountCents: number; isActive: boolean; description: string }>) => {
            const response = await fetch(`${API_URL}/advisor/rate-plans/${id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        deleteRatePlan: async (id: string) => {
            const response = await fetch(`${API_URL}/advisor/rate-plans/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },

        // ── Availability ───────────────────────────────────────────────────────
        getAvailabilityRules: async () => {
            const response = await fetch(`${API_URL}/advisor/availability/rules`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return toArray(payload, ['rules', 'availabilityRules', 'items']);
        },
        setAvailabilityRules: async (rules: Array<{ dayOfWeek: number; startTime: string; endTime: string }>) => {
            const response = await fetch(`${API_URL}/advisor/availability/rules`, {
                method: "PUT",
                headers: getHeaders(),
                body: JSON.stringify({ rules }),
            });
            return parseResponse(response);
        },
        createException: async (data: { date: string; isBlocked?: boolean; startTime?: string; endTime?: string; reason?: string }) => {
            const response = await fetch(`${API_URL}/advisor/availability/exceptions`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        deleteException: async (id: string) => {
            const response = await fetch(`${API_URL}/advisor/availability/exceptions/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },

        // ── License Documents ──────────────────────────────────────────────────
        getLicenseDocs: async () => {
            const response = await fetch(`${API_URL}/advisor/license-documents`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return toArray(payload, ['documents', 'licenseDocuments', 'items']);
        },
        recordLicenseDoc: async (data: { documentType: string; storageKey: string; expiresAt?: string }) => {
            const response = await fetch(`${API_URL}/advisor/license-documents`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        deleteLicenseDoc: async (id: string) => {
            const response = await fetch(`${API_URL}/advisor/license-documents/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },

        // ── Advisor Earnings & Bookings ─────────────────────────────────────────
        getEarnings: async (params?: { from?: string; to?: string }) => {
            const q = new URLSearchParams();
            if (params?.from) q.set("from", params.from);
            if (params?.to) q.set("to", params.to);
            const qs = q.toString() ? `?${q.toString()}` : "";
            const response = await fetch(`${API_URL}/advisor/earnings${qs}`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getAdvisorBookings: async (params?: { status?: string; page?: number }) => {
            const q = new URLSearchParams();
            if (params?.status) q.set("status", params.status);
            if (params?.page) q.set("page", params.page.toString());
            const qs = q.toString() ? `?${q.toString()}` : "";
            const endpoints = [
                `${API_URL}/bookings/marketplace/advisor-bookings${qs}`,
                `${API_URL}/advisor/bookings${qs}`,
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, { headers: getHeaders() });
                    const payload = await parseResponse(response);
                    return toArray(payload, ['bookings', 'items']);
                } catch (error: any) {
                    const status = Number(error?.status || 0);
                    if (status !== 404 && status !== 405) {
                        throw error;
                    }
                }
            }

            return [];
        },

        // ── Marketplace Bookings (Executor) ─────────────────────────────────────
        createBooking: async (data: {
            advisorId: string;
            ratePlanId: string;
            startTime: string;
            timezone: string;
            intakeAnswers?: Record<string, string>;
            idempotencyKey: string;
        }) => {
            const response = await fetch(`${API_URL}/bookings/marketplace`, {
                method: "POST",
                headers: { ...getHeaders(), "Idempotency-Key": data.idempotencyKey },
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        createBookingPaymentIntent: async (bookingId: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/payment`, {
                method: "POST",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        confirmBooking: async (bookingId: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/confirm`, {
                method: "POST",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        cancelBooking: async (bookingId: string, reason?: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/cancel`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ reason }),
            });
            return parseResponse(response);
        },
        completeBooking: async (bookingId: string, advisorNotes?: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/complete`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ advisorNotes }),
            });
            return parseResponse(response);
        },
        rescheduleBooking: async (bookingId: string, newStartTime: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/reschedule`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ newStartTime }),
            });
            return parseResponse(response);
        },
        reviewBooking: async (bookingId: string, data: { rating: number; comment?: string }) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/review`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        openDispute: async (bookingId: string, reason: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/dispute`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ reason }),
            });
            return parseResponse(response);
        },
        getMyMarketplaceBookings: async (params?: { status?: string; page?: number }) => {
            const q = new URLSearchParams();
            if (params?.status) q.set("status", params.status);
            if (params?.page) q.set("page", params.page.toString());
            const qs = q.toString() ? `?${q.toString()}` : "";
            const endpoints = [
                `${API_URL}/bookings/marketplace/my-bookings${qs}`,
                `${API_URL}/bookings/marketplace${qs}`,
            ];

            for (const endpoint of endpoints) {
                try {
                    const response = await fetch(endpoint, { headers: getHeaders() });
                    const payload = await parseResponse(response);
                    return toArray(payload, ['bookings', 'items']);
                } catch (error: any) {
                    const status = Number(error?.status || 0);
                    if (status !== 404 && status !== 405) {
                        throw error;
                    }
                }
            }

            return [];
        },
        getBookingById: async (bookingId: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}`, { headers: getHeaders() });
            return parseResponse(response);
        },

        getBookingMessages: async (bookingId: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/messages`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return toArray(payload, ['messages', 'items']);
        },
        sendBookingMessage: async (bookingId: string, message: string) => {
            const response = await fetch(`${API_URL}/bookings/marketplace/${bookingId}/messages`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify({ message }),
            });
            return parseResponse(response);
        },
        // ── Admin marketplace management ─────────────────────────────────────────
        admin: {
            getQueue: async (params?: { status?: string; page?: number; limit?: number }) => {
                const q = new URLSearchParams();
                if (params?.status) q.set("status", params.status);
                if (params?.page) q.set("page", params.page.toString());
                if (params?.limit) q.set("limit", params.limit.toString());
                const qs = q.toString() ? `?${q.toString()}` : "";
                const response = await fetch(`${API_URL}/admin/marketplace/queue${qs}`, { headers: getHeaders() });
                const payload = await parseResponse(response);
                const advisors = toArray(payload, ["advisors", "items"]);
                const total = Number((payload as any)?.total ?? (payload as any)?.data?.total ?? advisors.length);
                const page = Number((payload as any)?.page ?? (payload as any)?.data?.page ?? params?.page ?? 1);
                const limit = Number((payload as any)?.limit ?? (payload as any)?.data?.limit ?? params?.limit ?? (advisors.length || 20));
                const totalPages = Number((payload as any)?.totalPages ?? (payload as any)?.data?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));
                return { ...(payload as Record<string, unknown>), advisors, total, page, limit, totalPages };
            },
            getAdvisorDetail: async (advisorId: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/advisors/${advisorId}`, { headers: getHeaders() });
                return parseResponse(response);
            },
            approve: async (advisorId: string, reason?: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/advisors/${advisorId}/approve`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ reason }),
                });
                return parseResponse(response);
            },
            reject: async (advisorId: string, reason: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/advisors/${advisorId}/reject`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ reason }),
                });
                return parseResponse(response);
            },
            pause: async (advisorId: string, reason?: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/advisors/${advisorId}/pause`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ reason }),
                });
                return parseResponse(response);
            },
            unpause: async (advisorId: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/advisors/${advisorId}/unpause`, {
                    method: "POST",
                    headers: getHeaders(),
                });
                return parseResponse(response);
            },
            verifyDocument: async (docId: string, status: "VERIFIED" | "REJECTED", reason?: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/documents/${docId}/verify`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ status, reason }),
                });
                return parseResponse(response);
            },
            getDisputes: async (params?: { status?: string; page?: number }) => {
                const q = new URLSearchParams();
                if (params?.status) q.set("status", params.status);
                if (params?.page) q.set("page", params.page.toString());
                const qs = q.toString() ? `?${q.toString()}` : "";
                const response = await fetch(`${API_URL}/admin/marketplace/disputes${qs}`, { headers: getHeaders() });
                const payload = await parseResponse(response);
                const disputes = toArray(payload, ["disputes", "items"]);
                const total = Number((payload as any)?.total ?? (payload as any)?.data?.total ?? disputes.length);
                const page = Number((payload as any)?.page ?? (payload as any)?.data?.page ?? params?.page ?? 1);
                return { ...(payload as Record<string, unknown>), disputes, total, page };
            },
            resolveDispute: async (
                disputeId: string,
                resolution: string,
                refundType: "REFUND" | "RELEASE",
                refundAmount?: number
            ) => {
                const response = await fetch(`${API_URL}/admin/marketplace/disputes/${disputeId}/resolve`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ resolution, refundType, refundAmount }),
                });
                return parseResponse(response);
            },
            getAuditLog: async (advisorId: string) => {
                const response = await fetch(`${API_URL}/admin/marketplace/advisors/${advisorId}/audit-log`, { headers: getHeaders() });
                return parseResponse(response);
            },
            getPayoutQueue: async (params?: { page?: number; limit?: number }) => {
                const q = new URLSearchParams();
                if (params?.page) q.set("page", params.page.toString());
                if (params?.limit) q.set("limit", params.limit.toString());
                const qs = q.toString() ? `?${q.toString()}` : "";
                const response = await fetch(`${API_URL}/admin/marketplace/payouts/queue${qs}`, { headers: getHeaders() });
                const payload = await parseResponse(response);
                const items = toArray(payload, ["items", "bookings"]);
                const total = Number((payload as any)?.total ?? items.length);
                const page = Number((payload as any)?.page ?? params?.page ?? 1);
                const limit = Number((payload as any)?.limit ?? params?.limit ?? (items.length || 25));
                const totalPages = Number((payload as any)?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit))));
                return { ...(payload as Record<string, unknown>), items, total, page, limit, totalPages };
            },
            releaseDuePayouts: async (includeAutoComplete = true) => {
                const response = await fetch(`${API_URL}/admin/marketplace/payouts/release-due`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ includeAutoComplete }),
                });
                return parseResponse(response);
            },
        },

            // ── Jurisdiction Health & Diagnostics ─────────────────────────────────
            getJurisdictionHealth: async () => {
                const response = await fetch(`${API_URL}/admin/jurisdictions/health`, { headers: getHeaders() });
                return parseResponse(response);
            },
            getStateDiagnostics: async (stateCode: string) => {
                const response = await fetch(`${API_URL}/admin/jurisdictions/${stateCode}/diagnostics`, { headers: getHeaders() });
                return parseResponse(response);
            },
            getStateDiagnosticHistory: async (stateCode: string, limit?: number) => {
                const qs = limit ? `?limit=${limit}` : "";
                const response = await fetch(`${API_URL}/admin/jurisdictions/${stateCode}/history${qs}`, { headers: getHeaders() });
                return parseResponse(response);
            },
            getStateHealthTrend: async (stateCode: string, days?: number) => {
                const qs = days ? `?days=${days}` : "";
                const response = await fetch(`${API_URL}/admin/jurisdictions/${stateCode}/trend${qs}`, { headers: getHeaders() });
                return parseResponse(response);
            },
            previewRoadmap: async (profile: {
                stateCode: string;
                authorityType: 'PROBATE' | 'TRUST' | 'BOTH';
                hasRealProperty: boolean;
                estateValue: number;
                hasWill: boolean;
                county?: string;
                characteristics?: Record<string, boolean>;
            }) => {
                const response = await fetch(`${API_URL}/admin/jurisdictions/preview-roadmap`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify(profile),
                });
                return parseResponse(response);
            },
            runStateDiagnostics: async (stateCode: string, options?: { commitSha?: string; branchName?: string }) => {
                const response = await fetch(`${API_URL}/admin/jurisdictions/${stateCode}/run-diagnostics`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify(options || {}),
                });
                return parseResponse(response);
            },

            // ── County Override Governance ────────────────────────────────────────
            getPendingCountyOverrides: async (params?: { page?: number; limit?: number }) => {
                const q = new URLSearchParams();
                if (params?.page) q.set("page", params.page.toString());
                if (params?.limit) q.set("limit", params.limit.toString());
                const qs = q.toString() ? `?${q.toString()}` : "";
                const response = await fetch(`${API_URL}/admin/county-overrides/pending${qs}`, { headers: getHeaders() });
                return parseResponse(response);
            },
            getCountyOverrides: async (params?: { stateCode?: string; status?: string; page?: number; limit?: number }) => {
                const q = new URLSearchParams();
                if (params?.stateCode) q.set("stateCode", params.stateCode);
                if (params?.status) q.set("status", params.status);
                if (params?.page) q.set("page", params.page.toString());
                if (params?.limit) q.set("limit", params.limit.toString());
                const qs = q.toString() ? `?${q.toString()}` : "";
                const response = await fetch(`${API_URL}/admin/county-overrides${qs}`, { headers: getHeaders() });
                return parseResponse(response);
            },
            approveCountyOverride: async (id: string, notes?: string) => {
                const response = await fetch(`${API_URL}/admin/county-overrides/${id}/approve`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ notes }),
                });
                return parseResponse(response);
            },
            rejectCountyOverride: async (id: string, reason: string) => {
                const response = await fetch(`${API_URL}/admin/county-overrides/${id}/reject`, {
                    method: "POST",
                    headers: getHeaders(),
                    body: JSON.stringify({ reason }),
                });
                return parseResponse(response);
            },
            getCountyOverrideDiff: async (id: string) => {
                const response = await fetch(`${API_URL}/admin/county-overrides/${id}/diff`, { headers: getHeaders() });
                return parseResponse(response);
            },
    },

    /**
     * Letters Dispatch — institution letter tracking (DB-backed)
     */
    lettersDispatch: {
        getAll: async (): Promise<LettersDispatch[]> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my`, { headers: getHeaders() });
            return parseResponse(response);
        },
        addCustom: async (data: { institutionName: string; institutionType: string; needsOriginal?: boolean; notes?: string }): Promise<LettersDispatch> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        update: async (id: string, data: { status?: string; notes?: string; certifiedCopyRef?: string; needsOriginal?: boolean }): Promise<LettersDispatch> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my/${id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        remove: async (id: string): Promise<{ success: boolean }> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        reset: async (): Promise<LettersDispatch[]> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my/reset`, {
                method: "POST",
                headers: getHeaders(),
            });
            return parseResponse(response);
        },
        getPendingFollowUps: async (): Promise<LettersDispatch[]> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my/pending-followups`, { headers: getHeaders() });
            return parseResponse(response);
        },
        generateLetter: async (id: string): Promise<void> => {
            const response = await fetch(`${API_URL}/letters-dispatch/my/${id}/generate-letter`, {
                method: "POST",
                headers: getHeaders(),
            });
            if (!response.ok) throw new Error("Failed to generate letter");
            const blob = await response.blob();
            // Extract filename from Content-Disposition if available
            const disposition = response.headers.get("Content-Disposition") || "";
            const match = disposition.match(/filename="?([^"]+)"?/);
            const filename = match ? match[1] : "notification-letter.pdf";
            downloadBlob(blob, filename);
        },
    },

    reviews: {
        create: async (data: { bookingId: string, rating: number, comment?: string }) => {
            const response = await fetch(`${API_URL}/reviews`, {
                method: "POST",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        getAdvisorReviews: async (advisorId: string) => {
            const response = await fetch(`${API_URL}/reviews/advisor/${advisorId}`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return toArray(payload, ["reviews", "items"]);
        },
        getAdvisorStats: async (advisorId: string) => {
            const response = await fetch(`${API_URL}/reviews/advisor/${advisorId}/stats`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getMyReviews: async () => {
            const response = await fetch(`${API_URL}/reviews/my-reviews`, { headers: getHeaders() });
            const payload = await parseResponse(response);
            return toArray(payload, ["reviews", "items"]);
        },
        update: async (id: string, data: { rating?: number, comment?: string }) => {
            const response = await fetch(`${API_URL}/reviews/${id}`, {
                method: "PATCH",
                headers: getHeaders(),
                body: JSON.stringify(data),
            });
            return parseResponse(response);
        },
        delete: async (id: string) => {
            const response = await fetch(`${API_URL}/reviews/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });
            return parseResponse(response);
        }
    },

    /**
     * SSOT Probate Engine — Admin API
     */
    ssot: {
        // Stats & Gap Detection
        getStats: async () => {
            const r = await fetch(`${API_URL}/ssot/stats`, { headers: getHeaders() });
            return parseResponse(r);
        },
        getGaps: async () => {
            const r = await fetch(`${API_URL}/ssot/gaps`, { headers: getHeaders() });
            return parseResponse(r);
        },
        getStateCompleteness: async () => {
            const r = await fetch(`${API_URL}/ssot/state-completeness`, { headers: getHeaders() });
            return parseResponse(r);
        },

        // Jurisdictions
        getJurisdictions: async () => {
            const r = await fetch(`${API_URL}/ssot/jurisdictions`, { headers: getHeaders() });
            return parseResponse(r);
        },
        getJurisdiction: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/jurisdictions/${id}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createJurisdiction: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/jurisdictions`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updateJurisdiction: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/jurisdictions/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        publishJurisdiction: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/jurisdictions/${id}/publish`, { method: "POST", headers: getHeaders() });
            return parseResponse(r);
        },

        // Probate Types
        getProbateTypes: async () => {
            const r = await fetch(`${API_URL}/ssot/probate-types`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createProbateType: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/probate-types`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updateProbateType: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/probate-types/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },

        // Roadmaps
        getRoadmaps: async (jurisdictionId?: string) => {
            const qs = jurisdictionId ? `?jurisdictionId=${jurisdictionId}` : "";
            const r = await fetch(`${API_URL}/ssot/roadmaps${qs}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        getRoadmapFull: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/roadmaps/${id}/full`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createRoadmap: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/roadmaps`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updateRoadmapMeta: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/roadmaps/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        publishRoadmap: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/roadmaps/${id}/publish`, { method: "POST", headers: getHeaders() });
            return parseResponse(r);
        },

        // Phases
        createPhase: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/phases`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updatePhase: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/phases/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        deletePhase: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/phases/${id}`, { method: "DELETE", headers: getHeaders() });
            return parseResponse(r);
        },

        // Steps
        createStep: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/steps`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updateStep: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/steps/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        deleteStep: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/steps/${id}`, { method: "DELETE", headers: getHeaders() });
            return parseResponse(r);
        },

        // Actions
        createAction: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/actions`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updateAction: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/actions/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        deleteAction: async (id: string) => {
            const r = await fetch(`${API_URL}/ssot/actions/${id}`, { method: "DELETE", headers: getHeaders() });
            return parseResponse(r);
        },

        // Forms
        getForms: async (jurisdictionId?: string) => {
            const qs = jurisdictionId ? `?jurisdictionId=${jurisdictionId}` : "";
            const r = await fetch(`${API_URL}/ssot/forms${qs}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createForm: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/forms`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        updateForm: async (id: string, data: any) => {
            const r = await fetch(`${API_URL}/ssot/forms/${id}`, { method: "PUT", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },

        // Asset Types
        getAssetTypes: async () => {
            const r = await fetch(`${API_URL}/ssot/asset-types`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createAssetType: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/asset-types`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },

        // Liability Types
        getLiabilityTypes: async () => {
            const r = await fetch(`${API_URL}/ssot/liability-types`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createLiabilityType: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/liability-types`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },

        // Accounting / Tax / Distribution Rules
        getAccountingRules: async (jurisdictionId?: string) => {
            const qs = jurisdictionId ? `?jurisdictionId=${jurisdictionId}` : "";
            const r = await fetch(`${API_URL}/ssot/accounting-rules${qs}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createAccountingRule: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/accounting-rules`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        getTaxObligations: async (jurisdictionId?: string) => {
            const qs = jurisdictionId ? `?jurisdictionId=${jurisdictionId}` : "";
            const r = await fetch(`${API_URL}/ssot/tax-obligations${qs}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createTaxObligation: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/tax-obligations`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },
        getDistributionRules: async (jurisdictionId?: string) => {
            const qs = jurisdictionId ? `?jurisdictionId=${jurisdictionId}` : "";
            const r = await fetch(`${API_URL}/ssot/distribution-rules${qs}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createDistributionRule: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/distribution-rules`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },

        // Statute References
        getStatuteRefs: async (entityType: string, entityId: string) => {
            const r = await fetch(`${API_URL}/ssot/statute-references?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { headers: getHeaders() });
            return parseResponse(r);
        },
        createStatuteRef: async (data: any) => {
            const r = await fetch(`${API_URL}/ssot/statute-references`, { method: "POST", headers: getHeaders(), body: JSON.stringify(data) });
            return parseResponse(r);
        },

        // Change Logs
        getChangeLogs: async (params?: { entityType?: string; entityId?: string; limit?: number }) => {
            const q = new URLSearchParams();
            if (params?.entityType) q.set("entityType", params.entityType);
            if (params?.entityId) q.set("entityId", params.entityId);
            if (params?.limit) q.set("limit", params.limit.toString());
            const qs = q.toString() ? `?${q.toString()}` : "";
            const r = await fetch(`${API_URL}/ssot/change-logs${qs}`, { headers: getHeaders() });
            return parseResponse(r);
        },
    },
};











