
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
    try {
        return JSON.parse(text);
    } catch (e) {
        if (!response.ok) {
            throw new Error(`Server Error (${response.status}): ${text.substring(0, 100)}...`);
        }
        throw new Error(`Invalid response from server: ${text.substring(0, 100)}...`);
    }
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
        const response = await fetch(`${API_URL}/assets/${id}/enrich`, {
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
        const response = await fetch(`${API_URL}/profile`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
    },

    updateProfile: async (data: { fullName?: string; state?: string; role?: string }) => {
        const response = await fetch(`${API_URL}/profile`, {
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

    getAgentInsights: async () => {
        const response = await fetch(`${API_URL}/agent/insights`, {
            headers: getHeaders(),
        });
        return parseResponse(response);
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

        return parseResponse(response);
    },
};
