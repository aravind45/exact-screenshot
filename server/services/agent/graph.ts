import { ChatGroq } from "@langchain/groq";
import { StateGraph, END } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { EstateStateAnnotation, type EstateState } from "./state.js";
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
async function callModel(state: EstateState) {
    const systemPrompt = `You are an expert estate settlement assistant. 
  Your role is to help executors navigate the complex 12-18 month settlement process.
  
  CAPABILITIES:
  - Extract data from documents (death certificates, bank statements, wills)
  - Get current asset ledger
  - Draft professional communications to institutions
  
  Current Estate ID: ${state.estateId}
  Current Phase: ${state.phase}
  
  RULES:
  1. Always explain your reasoning.
  2. Be empathetic.
  3. Suggest next steps.`;

    const response = await model.invoke([
        new SystemMessage(systemPrompt),
        ...state.messages,
    ]);

    return { messages: [response] };
}

/**
 * Define logic for transitions
 */
function shouldContinue(state: EstateState) {
    const { messages } = state;
    const lastMessage = messages[messages.length - 1] as any;

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
