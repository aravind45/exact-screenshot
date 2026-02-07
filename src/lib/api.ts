
export type CommunicationType = 'call' | 'email' | 'letter' | 'fax' | 'in-person';
export type CommunicationDirection = 'inbound' | 'outbound';

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
    probateStatus: string;
    courtCaseNumber?: string;
    estateType?: string;
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

    // Custom
    user?: {
        fullName: string;
        state: string;
    };

    // Paths
    authorityType?: string;
    authorityDecision?: any;
    settlementPath?: string;
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
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
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

export type FormReadiness = Record<string, {
    ready: boolean;
    reason: string;
    status?: string;
    authorityTier?: string;
}>;

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
    };
    profile: any;
}

const API_URL = import.meta.env.VITE_API_URL || "/api";

const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
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
        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
            throw new Error(`Authentication required (401): ${text.substring(0, 100)}`);
        }
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
};

export const api = {
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

    register: async (data: { email: string, password: string, fullName: string, state?: string }) => {
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

    logout: () => {
        localStorage.removeItem("auth_token");
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

    admin: {
        getStats: async () => {
            const response = await fetch(`${API_URL}/admin/stats`, { headers: getHeaders() });
            return parseResponse(response);
        },
        getUsers: async () => {
            const response = await fetch(`${API_URL}/admin/users`, { headers: getHeaders() });
            return parseResponse(response);
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
        }
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

    // Liabilities
    generateLetter: async (id: string, overrides?: any) => {
        const response = await fetch(`${API_URL}/assets/${id}/generate-letter`, {
            method: "POST",
            headers: getHeaders(),
            body: overrides ? JSON.stringify(overrides) : undefined
        });
        if (!response.ok) throw new Error("Failed to generate letter");
        return await response.blob();
    },

    batchGenerateLetters: async (assetIds: string[]) => {
        const response = await fetch(`${API_URL}/assets/batch-generate-letters`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ assetIds })
        });
        if (!response.ok) throw new Error("Failed to generate batch letters");
        return await response.blob();
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

    /**
     * Admin Functions
     */
    getAdminStats: async () => {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    getAdminUsers: async () => {
        const response = await fetch(`${API_URL}/admin/users`, {
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

    updateMyEstate: async (data: any) => {
        const response = await fetch(`${API_URL}/estates/my`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return parseResponse(response);
    },

    getPetitionPdf: async () => {
        const response = await fetch(`${API_URL}/estates/my/petition/pdf`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to generate PDF");
        return await response.blob();
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

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                ...(localStorage.getItem("auth_token") ? { "Authorization": `Bearer ${localStorage.getItem("auth_token")}` } : {}),
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

        const token = localStorage.getItem("auth_token");
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

    getEstateDocumentDownloadUrl: (formCode: string) => {
        return `${API_URL}/estates/my/documents/${formCode}/download?token=${localStorage.getItem("auth_token")}`;
    },

    /**
     * Deadline Methods
     */
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
        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${API_URL}/discovery/analyze?estateId=${estateId}`, {
            method: "POST",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
        });
        return parseResponse(response);
    },

    downloadDossier: async () => {
        const response = await fetch(`${API_URL}/estates/my/dossier/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to generate dossier");
        return await response.blob();
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

    async downloadActivityLog(): Promise<Blob> {
        const response = await fetch(`${API_URL}/estates/my/activities/download?token=${localStorage.getItem("auth_token")}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to download activity log");
        return await response.blob();
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

    generateForm: async (formId: string, isPreview: boolean = true) => {
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

    getTemplateFile: async (name: string) => {
        const response = await fetch(`${API_URL}/forms/templates/${name}/download`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to download template");
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
        const response = await fetch(`${API_URL}/pdf/preview`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
        });
        return parseResponse(response);
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
};
