import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { ai } from "../ai.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * documentExtractionTool
 * 
 * Extracts asset and deceased info from uploaded documents.
 */
export const documentExtractionTool = tool(
    async ({ text, imageBase64 }) => {
        const result = await ai.analyzeDocument(text, imageBase64);
        return JSON.stringify(result);
    },
    {
        name: "document_extraction",
        description: "Extract assets and deceased info from documents (PDF text or images).",
        schema: z.object({
            text: z.string().optional(),
            imageBase64: z.string().optional(),
        }),
    }
);

/**
 * communicationTool
 * 
 * Drafts emails/letters to institutions.
 */
export const communicationTool = tool(
    async (params) => {
        const draft = await ai.generateCommunicationDraft(params as any);
        return JSON.stringify(draft);
    },
    {
        name: "communication_drafting",
        description: "Draft professional emails or letters to financial institutions.",
        schema: z.object({
            institutionName: z.string(),
            assetType: z.string(),
            workflowStepTitle: z.string(),
            workflowStepDescription: z.string(),
            deceasedName: z.string().optional(),
        }),
    }
);

/**
 * assetRetrievalTool
 * 
 * Fetches the current asset ledger for the estate.
 */
export const assetRetrievalTool = tool(
    async ({ estateId }) => {
        const assets = await prisma.asset.findMany({
            where: { estateId },
        });
        return JSON.stringify(assets);
    },
    {
        name: "get_asset_ledger",
        description: "Get the current list of assets in the estate.",
        schema: z.object({
            estateId: z.string(),
        }),
    }
);

/**
 * legalRetrievalTool
 * 
 * Searches the California Probate Code and Executor's Guide for relevant rules.
 */
export const legalRetrievalTool = tool(
    async ({ query }) => {
        const lowerQuery = query.toLowerCase();
        if (lowerQuery.includes("priority") || lowerQuery.includes("claim")) {
            return "California Probate Code Section 11420: Debts shall be paid in the following order of priority: (1) Expenses of administration, (2) Obligations secured by mortgage/lien, (3) Funeral expenses, (4) Expenses of last illness, (5) Family allowance, (6) Wage claims...";
        }
        return "Searching knowledge base for: " + query + ". No direct citations found in mock RAG.";
    },
    {
        name: "legal_retrieval",
        description: "Search California Probate Code and legal guides for specific settlement rules.",
        schema: z.object({
            query: z.string(),
        }),
    }
);

export const tools = [documentExtractionTool, communicationTool, assetRetrievalTool, legalRetrievalTool];
