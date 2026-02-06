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
export const documentExtractionTool = tool(async ({ text, imageBase64 }) => {
    const result = await ai.analyzeDocument(text, imageBase64);
    return JSON.stringify(result);
}, {
    name: "document_extraction",
    description: "Extract assets and deceased info from documents (PDF text or images).",
    schema: z.object({
        text: z.string().optional(),
        imageBase64: z.string().optional(),
    }),
});
/**
 * communicationTool
 *
 * Drafts emails/letters to institutions.
 */
export const communicationTool = tool(async (params) => {
    const draft = await ai.generateCommunicationDraft(params);
    return JSON.stringify(draft);
}, {
    name: "communication_drafting",
    description: "Draft professional emails or letters to financial institutions.",
    schema: z.object({
        institutionName: z.string(),
        assetType: z.string(),
        workflowStepTitle: z.string(),
        workflowStepDescription: z.string(),
        deceasedName: z.string().optional(),
    }),
});
/**
 * assetRetrievalTool
 *
 * Fetches the current asset ledger for the estate.
 */
export const assetRetrievalTool = tool(async ({ estateId }) => {
    const assets = await prisma.asset.findMany({
        where: { estateId },
    });
    return JSON.stringify(assets);
}, {
    name: "get_asset_ledger",
    description: "Get the current list of assets in the estate.",
    schema: z.object({
        estateId: z.string(),
    }),
});
/**
 * legalRetrievalTool
 *
 * Searches the California Probate Code and Executor's Guide for relevant rules.
 */
export const legalRetrievalTool = tool(async ({ query }) => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("priority") || lowerQuery.includes("claim")) {
        return "California Probate Code Section 11420: Debts shall be paid in the following order of priority: (1) Expenses of administration, (2) Obligations secured by mortgage/lien, (3) Funeral expenses, (4) Expenses of last illness, (5) Family allowance, (6) Wage claims...";
    }
    return "Searching knowledge base for: " + query + ". No direct citations found in mock RAG.";
}, {
    name: "legal_retrieval",
    description: "Search California Probate Code and legal guides for specific settlement rules.",
    schema: z.object({
        query: z.string(),
    }),
});
/**
 * probateFormStatusTool
 *
 * Checks the completeness of the estate data for generating DE-111.
 */
export const probateFormStatusTool = tool(async ({ estateId }) => {
    const estate = await prisma.estate.findUnique({
        where: { id: estateId },
        include: { heirs: true, assets: true },
    });
    if (!estate)
        return "Estate not found.";
    const missing = [];
    if (!estate.deceasedFirstName || !estate.deceasedLastName)
        missing.push("Decedent Name");
    if (!estate.deceasedDateOfDeath)
        missing.push("Date of Death");
    if (!estate.probateCounty)
        missing.push("Probate County");
    if (estate.heirs.length === 0)
        missing.push("Heirs/Beneficiaries");
    if (estate.assets.length === 0)
        missing.push("Asset Inventory (for bond calculation)");
    const personalProperty = estate.assets.reduce((sum, a) => sum + (a.value || 0), 0);
    return JSON.stringify({
        isReady: missing.length === 0,
        missingFields: missing,
        calculatedTotals: {
            personalProperty,
        },
        estateSummary: {
            hasWill: estate.hasWill,
            heirCount: estate.heirs.length,
        }
    });
}, {
    name: "probate_form_status",
    description: "Check if all required information is present to generate the DE-111 Petition for Probate.",
    schema: z.object({
        estateId: z.string(),
    }),
});
/**
 * estateUpdateTool
 *
 * Updates estate details or heirs.
 */
export const estateUpdateTool = tool(async ({ estateId, data, newHeirs }) => {
    if (data) {
        await prisma.estate.update({
            where: { id: estateId },
            data
        });
    }
    if (newHeirs && newHeirs.length > 0) {
        for (const heir of newHeirs) {
            await prisma.heir.create({
                data: {
                    ...heir,
                    estateId
                }
            });
        }
    }
    return "Estate updated successfully.";
}, {
    name: "update_estate_data",
    description: "Update estate details (like date of death, county, will status) or add new heirs.",
    schema: z.object({
        estateId: z.string(),
        data: z.object({
            deceasedFirstName: z.string().optional(),
            deceasedLastName: z.string().optional(),
            deceasedDateOfDeath: z.string().optional(),
            probateCounty: z.string().optional(),
            hasWill: z.boolean().optional(),
            willDate: z.string().optional(),
            bondWaived: z.boolean().optional(),
        }).optional(),
        newHeirs: z.array(z.object({
            name: z.string(),
            relationship: z.string(),
            isAdult: z.boolean().optional(),
            address: z.string().optional(),
        })).optional(),
    }),
});
export const tools = [
    documentExtractionTool,
    communicationTool,
    assetRetrievalTool,
    legalRetrievalTool,
    probateFormStatusTool,
    estateUpdateTool
];
