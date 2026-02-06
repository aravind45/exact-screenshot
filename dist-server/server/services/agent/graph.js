import { ChatGroq } from "@langchain/groq";
import { StateGraph, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { EstateStateAnnotation } from "./state.js";
import { SystemMessage } from "@langchain/core/messages";
import { tools } from "./tools.js";
import "dotenv/config";
const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "llama-3.1-70b-versatile",
    temperature: 0,
}).bindTools(tools);
/**
 * Call Model Node
 *
 * Invokes the LLM with the current state.
 */
async function callModel(state) {
    const systemPrompt = `You are an expert estate settlement assistant, a virtual paralegal specializing in California probate.
  Your role is to help executors navigate the complex 12-18 month settlement process.
  
  CAPABILITIES & TOOLS:
  - document_extraction: Extract assets and deceased info from uploads.
  - get_asset_ledger: View all currently identified assets.
  - communication_drafting: Generate professional drafts to banks/institutions.
  - legal_retrieval: Search California Probate Code for specific rules.
  - probate_form_status: Check if the DE-111 (Petition for Probate) is ready to generate.
  - update_estate_data: Save missing details or add heirs discovered during chat.
  
  Current Estate ID: ${state.estateId}
  Current Phase: ${state.phase}
  
  GUIDELINES:
  1. PROBATE INITIATION: If the user mentions starting probate or "The Petition", use 'probate_form_status' to see what's missing.
  2. DATA COLLECTION: If data is missing (e.g., deceased date, county, heirs), ask the user for it and then call 'update_estate_data' to save it.
  3. PDF LINKS: When the DE-111 is ready, provide a link to the download endpoint: \`/api/estates/my/petition/pdf\`.
  4. EMOTIONAL INTELLIGENCE: Be empathetic and patient. Exhausted/grieving executors are your primary users.
  5. REASONING: Always explain why you are asking for specific info or why a step is necessary.`;
    const response = await model.invoke([
        new SystemMessage(systemPrompt),
        ...state.messages,
    ]);
    return { messages: [response] };
}
/**
 * Define logic for transitions
 */
function shouldContinue(state) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1];
    // If model called a tool, go to 'tools' node
    if (lastMessage.tool_calls && lastMessage.tool_calls.length > 0) {
        return "tools";
    }
    // Otherwise, finish
    return END;
}
// Map the nodes
const workflow = new StateGraph(EstateStateAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", new ToolNode(tools))
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue)
    .addEdge("tools", "agent");
// Compile the graph
export const graph = workflow.compile();
