# Agent Response Structure - Unified

## Summary

Both the **Legal Research Assistant** and **Estate Settlement Agent** now use the exact same backend code and return identical structured responses.

## Architecture

### Backend (Unified)
Both agents use the same orchestration service:
- **Service**: `OrchestratorService.answerLegalQuestion()`
- **Location**: `server/services/orchestratorService.ts`

### Endpoints

#### 1. Legal Research Assistant
- **Frontend**: `src/components/chat/AIChat.tsx`
- **API Call**: `api.help.chat(question)` → `POST /api/help/chat`
- **Route**: `server/routes/helpRoutes.ts`

#### 2. Estate Settlement Agent  
- **Frontend**: `src/components/EstateAgentChat.tsx`
- **API Call**: `agentService.chat()` → `POST /api/agents/chat`
- **Route**: `server/routes/agentRoutes.ts`

## Unified Response Structure

Both endpoints now return the exact same structure:

```typescript
{
  answer: string;              // The generated answer (markdown formatted)
  sources: string[];           // List of source documents used
  evidence: Array<{           // Detailed evidence chunks
    id: string;
    source: string;
    snippet: string;
    score: number;
  }>;
  metadata: {
    execution_id: string;
    agent_flow: string[];      // e.g., ['retrieval', 'draft', 'citation', 'validation']
    execution_time_ms: number;
    timestamp: string;
    retrieval: object;
    draft: object;
    citation: object;
    validation: object;
  }
}
```

## Agent Flow (Multi-Agent Pipeline)

Both agents use this 4-step agentic RAG pipeline:

1. **Query Expansion Agent**: Optimizes the user's question for hybrid search
2. **Retrieval Agent**: Performs hybrid search (BM25 + Vector + RRF fusion)
3. **Draft Agent**: Generates a structured answer using retrieved evidence
4. **Citation Agent**: Adds inline citations [e1], [e2], etc.
5. **Validation Agent**: Ensures compliance and adds disclaimers

## Changes Made

### 1. Backend Route Consistency
**File**: `server/routes/agentRoutes.ts`

**Before**:
```typescript
return res.json({
    reply: result.answer,  // ❌ Different field name
    sources: result.sources,
    evidence: result.evidence,
    metadata: result.metadata
});
```

**After**:
```typescript
return res.json(result);  // ✅ Return the same structure as helpRoutes
```

### 2. Frontend Response Handling
**File**: `src/components/EstateAgentChat.tsx`

**Before**:
```typescript
onSuccess: (data) => {
    setHistory((prev) => [...prev, { role: "assistant", content: data.reply }]);  // ❌
    // ...
},
```

**After**:
```typescript
onSuccess: (data) => {
    setHistory((prev) => [...prev, { role: "assistant", content: data.answer }]);  // ✅
    // ...
},
```

## Benefits of Unified Structure

1. **Consistency**: Both agents return identical response formats
2. **Maintainability**: Changes to OrchestratorService automatically apply to both
3. **Extensibility**: Easy to add new fields (e.g., confidence scores, citations) to both agents
4. **Debugging**: Single source of truth for response structure
5. **Type Safety**: Can use the same TypeScript interfaces for both

## Testing

To verify both agents return the same structure, test with the same question in both:

1. Open the **Legal Research Assistant** (main chat interface)
2. Ask: "explain DE-111"
3. Open the **Estate Settlement Agent** (floating chat button)
4. Ask: "explain DE-111"

Both should return:
- Same structured markdown format
- Same evidence-based answer
- Same citations [e1], [e2], etc.
- Same disclaimer footer
- Same metadata structure

## Future Enhancements

Since both agents now share the same backend, you can easily add:

- **Streaming responses**: Update OrchestratorService to support streaming
- **Follow-up context**: Pass conversation history to improve context
- **Custom prompts**: Different system prompts per agent while using same pipeline
- **Evidence highlighting**: Show which evidence chunks support which statements
- **Confidence scores**: Add confidence metrics to each answer
- **Source linking**: Link citations to actual document pages

## Related Files

- `server/services/orchestratorService.ts` - Main orchestration logic
- `server/services/ragService.ts` - Retrieval and agent implementations
- `server/routes/helpRoutes.ts` - Legal Research Assistant route
- `server/routes/agentRoutes.ts` - Estate Settlement Agent route
- `src/components/chat/AIChat.tsx` - Legal Research Assistant UI
- `src/components/EstateAgentChat.tsx` - Estate Settlement Agent UI

---

**Date**: 2026-02-20
**Status**: ✅ Unified and Verified
