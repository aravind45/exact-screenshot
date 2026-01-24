
const API_URL = import.meta.env.VITE_API_URL || "/api";

const getHeaders = () => {
    const token = localStorage.getItem("auth_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };
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
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Login failed");
        }
        const data = await response.json();
        localStorage.setItem("auth_token", data.token);
        return data;
    },

    register: async (data: { email: string, password: string, fullName: string, state?: string }) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Registration failed");
        }
        const result = await response.json();
        localStorage.setItem("auth_token", result.token);
        return result;
    },

    getMe: async () => {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch current user");
        return response.json();
    },

    logout: () => {
        localStorage.removeItem("auth_token");
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
        pdfUrl?: string;
        pdfBase64?: string;
        subject?: string;
    }) => {
        // TODO: Move fax logic to Express
        console.warn("sendFax not yet implemented in Express backend");
        return { message: "Not implemented" };
    },

    /**
     * Get all assets from Neon DB
     */
    getAssets: async () => {
        const response = await fetch(`${API_URL}/assets`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch assets");
        return response.json();
    },

    /**
     * Get single asset by ID
     */
    getAsset: async (id: string) => {
        const response = await fetch(`${API_URL}/assets/${id}`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch asset");
        return response.json();
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
        if (!response.ok) throw new Error("Failed to create asset");
        return response.json();
    },

    updateAsset: async (id: string, updates: any) => {
        const response = await fetch(`${API_URL}/assets/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error("Failed to update asset");
        return response.json();
    },

    deleteAsset: async (id: string) => {
        const response = await fetch(`${API_URL}/assets/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to delete asset");
        return response.json();
    },

    getAssetDocuments: async (assetId: string) => {
        const response = await fetch(`${API_URL}/assets/${assetId}/documents`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch documents");
        return response.json();
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
        if (!response.ok) throw new Error("Failed to upload document");
        return response.json();
    },

    enrichAsset: async (id: string) => {
        const response = await fetch(`${API_URL}/assets/${id}/enrich`, {
            method: "POST",
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to enrich asset");
        return response.json();
    },

    searchInstitutions: async (query: string) => {
        if (!query || query.length < 2) return [];
        const response = await fetch(`${API_URL}/institutions?query=${encodeURIComponent(query)}`, {
            headers: getHeaders(),
        });
        if (!response.ok) return [];
        return response.json();
    },

    /**
     * Create a communication log entry for an asset
     */
    createCommunication: async (assetId: string, data: {
        method: string;
        subject: string;
        content?: string;
        communicationDate: string;
        type?: string;
        direction?: string;
        contactPerson?: string;
        nextActionDate?: string;
        nextActionType?: string;
    }) => {
        const response = await fetch(`${API_URL}/assets/${assetId}/communications`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to create communication");
        return response.json();
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
        if (!response.ok) throw new Error("Failed to generate draft");
        return response.json();
    },

    /**
     * User Profiles
     */
    getProfile: async () => {
        const response = await fetch(`${API_URL}/profile`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        return response.json();
    },

    updateProfile: async (data: { fullName?: string; state?: string; role?: string }) => {
        const response = await fetch(`${API_URL}/profile`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to update profile");
        return response.json();
    },

    /**
     * Admin Functions
     */
    getAdminStats: async () => {
        const response = await fetch(`${API_URL}/admin/stats`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch admin stats");
        return response.json();
    },

    getAdminUsers: async () => {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch users");
        return response.json();
    },

    getAdminInstitutions: async () => {
        const response = await fetch(`${API_URL}/admin/institutions`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch institutions");
        return response.json();
    },

    updateAdminInstitution: async (id: string, data: any) => {
        const response = await fetch(`${API_URL}/admin/institutions/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to update institution");
        return response.json();
    },

    getMyEstate: async () => {
        const response = await fetch(`${API_URL}/estates/my`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch estate");
        return response.json();
    },

    updateMyEstate: async (data: any) => {
        const response = await fetch(`${API_URL}/estates/my`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Failed to update estate");
        return response.json();
    },

    getAgentInsights: async () => {
        const response = await fetch(`${API_URL}/agent/insights`, {
            headers: getHeaders(),
        });
        if (!response.ok) throw new Error("Failed to fetch agent insights");
        return response.json();
    },

    /**
     * Processes a document using AI to extract estate information and discover hidden assets.
     */
    processDocument: async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);

        const token = localStorage.getItem("auth_token");
        const response = await fetch(`${API_URL}/documents/scan`, {
            method: "POST",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Failed to process document");
        }
        return response.json();
    },
};
