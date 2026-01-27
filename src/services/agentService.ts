import { api } from "../lib/api";

export interface AgentMessage {
    role: "user" | "assistant";
    content: string;
}

export const agentService = {
    /**
     * Send a message to the Estate Settlement Agent.
     */
    async chat(params: {
        message: string;
        estateId: string;
        phase?: string;
        history?: AgentMessage[];
    }) {
        const response = await api.post("/agent/chat", params);
        return response.data;
    },
};
