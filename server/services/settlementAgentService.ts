
import { Hyperbrowser } from "@hyperbrowser/sdk";
import "dotenv/config";

/**
 * SettlementAgentService
 * 
 * Uses Hyperbrowser's HyperAgent to perform "Last Mile" estate tasks:
 * 1. Find death notification pages for specific banks.
 * 2. Extract specific form fields or requirements.
 * 3. (Future) Fill out forms using estate data.
 */
export class SettlementAgentService {
    private static client: any;

    private static getClient() {
        if (!this.client) {
            this.client = new Hyperbrowser({
                apiKey: process.env.HYPERBROWSER_API_KEY,
            });
        }
        return this.client;
    }

    /**
     * Finds the death notification/settlement process for a specific bank.
     */
    static async findSettlementProcess(institutionName: string) {
        const client = this.getClient();

        try {
            const result = await client.agents.hyperAgent.startAndWait({
                version: "1.1.0",
                task: `Go to ${institutionName} and find their specific "Death Notification" or "Estate Settlement" process page. 
                       Tell me: 
                       1. The URL of the page.
                       2. The phone number for their estate department.
                       3. A list of required documents (e.g. death certificate, letters testamentary).`,
                llm: "gpt-4o", // High capability model for complex nav
                maxSteps: 15,
            });

            return {
                success: true,
                data: result.data?.finalResult,
                steps: result.data?.steps
            };
        } catch (error: any) {
            console.error("HyperAgent Error:", error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Async pattern for long-running form filling tasks.
     */
    static async startFormFillingTask(institutionUrl: string, estateData: any) {
        const client = this.getClient();

        return await client.agents.hyperAgent.start({
            version: "1.1.0",
            task: `Go to ${institutionUrl} and fill out the death notification form using this data: ${JSON.stringify(estateData)}. 
                   DO NOT SUBMIT the form. Stop after filling and tell me which fields were completed.`,
            llm: "gpt-4o",
            maxSteps: 25,
        });
    }

    static async getTaskStatus(jobId: string) {
        const client = this.getClient();
        return await client.agents.hyperAgent.getStatus(jobId);
    }
}
