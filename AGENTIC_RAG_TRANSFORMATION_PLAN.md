# AGENTIC RAG TRANSFORMATION PLAN
**Project:** ExpectedEstate - Multi-Agent Legal AI Architecture  
**Date:** February 11, 2026  
**Status:** Planning Phase

---

## EXECUTIVE SUMMARY

### Current State: Monolithic RAG Pipeline
Your `ragService.ts` is a **single-function RAG system**:
```
searchKnowledge() → answerLegalQuestion()
     ↓                      ↓
  Vector Search    LLM generates answer
```

**Problems:**
- ❌ No separation of concerns (retrieval + drafting + citation merged)
- ❌ Cannot enforce grounding (LLM can hallucinate)
- ❌ No audit trail for compliance
- ❌ Cannot extend to multi-agent workflows
- ❌ Hard threshold (0.45) causes silent failures
- ❌ No evidence tracking for legal liability

### Target State: Multi-Agent Architecture
```
Orchestrator
    ↓
Retrieval Agent (vector search + evidence tracking)
    ↓
Draft Agent (LLM reasoning)
    ↓
Citation Agent (grounding enforcement)
    ↓
Validation Agent (compliance check)
```

**Benefits:**
- ✅ Each agent has single responsibility
- ✅ Enforced grounding prevents hallucinations
- ✅ Full audit trail for legal compliance
- ✅ Extensible to Form-Filling, Checklist, Timeline agents
- ✅ Better recall with dynamic relevance scoring
- ✅ Evidence-based answers for liability protection

---

## PHASE 1: AGENT DECOMPOSITION (Week 1)

### 1.1 Retrieval Agent
**Current Code:**
```typescript
static async searchKnowledge(query: string, limit = 5) {
    // ... embedding logic
    const results = await prisma.$queryRawUnsafe(`
        SELECT content, source, 1 - (embedding <=> $1::vector) as similarity
        FROM knowledge_chunks
        WHERE 1 - (embedding <=> $1::vector) > 0.45
        ORDER BY similarity DESC
        LIMIT $2
    `, vectorSql, limit);
    return searchResults;
}
```

**New Agent Code:**
```typescript
static async retrieveLegalChunks(query: string, limit = 5) {
    if (!embeddings) {
        logger.error("RAG Error: OPENAI_API_KEY missing");
        return { chunks: [], evidence: [], metadata: { query, timestamp: new Date() } };
    }

    try {
        const queryVector = await embeddings.embedQuery(query);
        const vectorSql = `[${queryVector.join(',')}]`;

        // CRITICAL CHANGE: Remove hard threshold, use ORDER BY only
        const results = await prisma.$queryRawUnsafe(`
            SELECT 
                id,
                content, 
                source, 
                metadata,
                1 - (embedding <=> $1::vector) as similarity
            FROM knowledge_chunks
            ORDER BY similarity DESC
            LIMIT $2
        `, vectorSql, limit);

        const rows = results as {
            id: string;
            content: string;
            source: string;
            metadata: any;
            similarity: number;
        }[];

        // Structure evidence for downstream agents
        const evidence = rows.map((r, i) => ({
            evidence_id: `e${i + 1}`,
            chunk_id: r.id,
            source: r.source,
            snippet: r.content.slice(0, 220),
            full_content: r.content,
            score: r.similarity,
            metadata: r.metadata
        }));

        logger.info(`🔍 Retrieval Agent: Found ${rows.length} chunks. Top score: ${rows[0]?.similarity?.toFixed(4) || 0}`);

        return {
            chunks: rows,
            evidence,
            metadata: {
                query,
                timestamp: new Date(),
                retrieval_count: rows.length,
                top_score: rows[0]?.similarity || 0
            }
        };
    } catch (error) {
        logger.error("Retrieval Agent Error:", error);
        return { chunks: [], evidence: [], metadata: { error: String(error) } };
    }
}
```

**Key Changes:**
1. ✅ Returns structured `evidence` array with IDs
2. ✅ Removes hard threshold (0.45) - lets downstream agents decide relevance
3. ✅ Includes metadata for audit trail
4. ✅ Adds chunk IDs for citation tracking

---

### 1.2 Draft Agent
**Current Code:** (merged into `answerLegalQuestion`)
```typescript
const prompt = `You are an elite Estate Settlement AI Assistant...`;
const answer = await ai.generateText(prompt, "heavy");
```

**New Agent Code:**
```typescript
static async draftAnswer(question: string, evidence: any[]) {
    if (evidence.length === 0) {
        return {
            draft: "I couldn't find specific information in our legal guides to answer that. For complex legal matters, I strongly recommend consulting with a qualified estate attorney.",
            confidence: 0,
            metadata: { evidence_used: 0 }
        };
    }

    // Build context from evidence
    const contextContent = evidence
        .map((e, i) => `[Evidence ${e.evidence_id}] Source: ${e.source}\n${e.full_content}`)
        .join("\n\n---\n\n");

    const prompt = `
You are an elite Estate Settlement AI Assistant for ExpectedEstate.

CRITICAL RULES:
1. Answer ONLY using the provided evidence
2. DO NOT add information not in the evidence
3. DO NOT cite sources yet (Citation Agent will handle that)
4. Write in a professional, supportive, clear tone
5. If evidence is insufficient, explicitly state that

EVIDENCE:
${contextContent}

USER QUESTION: ${question}

Write a comprehensive answer using ONLY the evidence above.
`;

    const draft = await ai.generateText(prompt, "heavy");

    logger.info(`✍️ Draft Agent: Generated ${draft.length} chars from ${evidence.length} evidence chunks`);

    return {
        draft,
        confidence: evidence[0]?.score || 0,
        metadata: {
            evidence_used: evidence.length,
            draft_length: draft.length,
            timestamp: new Date()
        }
    };
}
```

**Key Changes:**
1. ✅ Separated from retrieval logic
2. ✅ No citation responsibility (delegated to Citation Agent)
3. ✅ Returns confidence score
4. ✅ Metadata for audit trail

---

### 1.3 Citation Agent (NEW - Critical for Legal Compliance)
**Current Code:** None - citations are suggested but not enforced

**New Agent Code:**
```typescript
static async attachCitations(draft: string, evidence: any[]) {
    if (evidence.length === 0) {
        return {
            final_answer: draft,
            citations: [],
            grounding_score: 0
        };
    }

    // Build evidence map for LLM
    const evidenceList = evidence
        .map(e => `${e.evidence_id}: ${e.source} (Score: ${e.score.toFixed(3)})`)
        .join("\n");

    const prompt = `
You are a Citation Agent. Your job is to add citations to the draft answer.

CRITICAL RULES:
1. Use ONLY the evidence IDs provided below
2. Format citations as [e1], [e2], etc.
3. Every factual claim MUST have a citation
4. If a claim cannot be cited, remove it or mark as uncertain
5. Add a disclaimer at the end

DRAFT ANSWER:
${draft}

AVAILABLE EVIDENCE:
${evidenceList}

Return the final answer with proper citations. Every claim must be grounded in evidence.
`;

    const finalAnswer = await ai.generateText(prompt, "heavy");

    // Extract citations used
    const citationMatches = finalAnswer.match(/\[e\d+\]/g) || [];
    const uniqueCitations = [...new Set(citationMatches)];

    // Calculate grounding score
    const groundingScore = uniqueCitations.length / Math.max(evidence.length, 1);

    logger.info(`📎 Citation Agent: Added ${uniqueCitations.length} citations. Grounding: ${(groundingScore * 100).toFixed(1)}%`);

    return {
        final_answer: finalAnswer,
        citations: uniqueCitations,
        grounding_score: groundingScore,
        metadata: {
            citations_added: uniqueCitations.length,
            evidence_available: evidence.length,
            timestamp: new Date()
        }
    };
}
```

**Key Changes:**
1. ✅ **Enforces grounding** - every claim must have evidence
2. ✅ Calculates grounding score for audit
3. ✅ Prevents hallucinations
4. ✅ Critical for legal liability protection

---

### 1.4 Validation Agent (NEW - Compliance Check)
**Purpose:** Ensure answer meets legal/compliance standards

**New Agent Code:**
```typescript
static async validateAnswer(finalAnswer: string, evidence: any[], metadata: any) {
    const validationChecks = {
        has_disclaimer: finalAnswer.toLowerCase().includes('not legal advice') || 
                       finalAnswer.toLowerCase().includes('educational purposes'),
        has_citations: /\[e\d+\]/.test(finalAnswer),
        sufficient_evidence: evidence.length >= 2,
        grounding_score: metadata.grounding_score || 0,
        answer_length: finalAnswer.length
    };

    const isValid = 
        validationChecks.has_disclaimer &&
        validationChecks.has_citations &&
        validationChecks.sufficient_evidence &&
        validationChecks.grounding_score > 0.3;

    // Add disclaimer if missing
    let validatedAnswer = finalAnswer;
    if (!validationChecks.has_disclaimer) {
        validatedAnswer += "\n\n**Disclaimer:** This information is for educational purposes only and does not constitute legal advice. For specific legal guidance, please consult with a qualified estate attorney.";
    }

    logger.info(`✅ Validation Agent: ${isValid ? 'PASSED' : 'FAILED'} - Grounding: ${(validationChecks.grounding_score * 100).toFixed(1)}%`);

    return {
        validated_answer: validatedAnswer,
        is_valid: isValid,
        validation_checks: validationChecks,
        metadata: {
            timestamp: new Date(),
            validation_status: isValid ? 'PASSED' : 'FAILED'
        }
    };
}
```

**Key Changes:**
1. ✅ Enforces disclaimer presence
2. ✅ Validates citation presence
3. ✅ Checks evidence sufficiency
4. ✅ Audit trail for compliance

---

## PHASE 2: ORCHESTRATOR IMPLEMENTATION (Week 1-2)

### 2.1 Orchestrator Service
**New File:** `server/services/orchestratorService.ts`

```typescript
import { RAGService } from "./ragService.js";
import { prisma } from "../db.js";
import { logger } from "../lib/logger.js";

export class OrchestratorService {
    /**
     * Main orchestration flow for legal question answering
     */
    static async answerLegalQuestion(question: string, userId?: string) {
        const startTime = Date.now();
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        logger.info(`🎯 Orchestrator [${executionId}]: Starting multi-agent flow`);

        try {
            // STEP 1: Retrieval Agent
            const retrieval = await RAGService.retrieveLegalChunks(question, 5);
            
            if (retrieval.chunks.length === 0) {
                return this.buildResponse({
                    answer: "I couldn't find specific information in our legal guides to answer that. For complex legal matters, I strongly recommend consulting with a qualified estate attorney.",
                    sources: [],
                    evidence: [],
                    execution_id: executionId,
                    agent_flow: ['retrieval'],
                    execution_time_ms: Date.now() - startTime
                });
            }

            // STEP 2: Draft Agent
            const draft = await RAGService.draftAnswer(question, retrieval.evidence);

            // STEP 3: Citation Agent
            const cited = await RAGService.attachCitations(draft.draft, retrieval.evidence);

            // STEP 4: Validation Agent
            const validated = await RAGService.validateAnswer(
                cited.final_answer,
                retrieval.evidence,
                { grounding_score: cited.grounding_score }
            );

            // Build final response
            const response = this.buildResponse({
                answer: validated.validated_answer,
                sources: [...new Set(retrieval.evidence.map(e => e.source))],
                evidence: retrieval.evidence.map(e => ({
                    id: e.evidence_id,
                    source: e.source,
                    snippet: e.snippet,
                    score: e.score
                })),
                execution_id: executionId,
                agent_flow: ['retrieval', 'draft', 'citation', 'validation'],
                execution_time_ms: Date.now() - startTime,
                metadata: {
                    retrieval: retrieval.metadata,
                    draft: draft.metadata,
                    citation: cited.metadata,
                    validation: validated.metadata
                }
            });

            // Log to database for audit trail
            if (userId) {
                await this.logExecution(executionId, question, response, userId);
            }

            logger.info(`✅ Orchestrator [${executionId}]: Completed in ${Date.now() - startTime}ms`);

            return response;

        } catch (error) {
            logger.error(`❌ Orchestrator [${executionId}]: Error`, error);
            throw error;
        }
    }

    /**
     * Build standardized response
     */
    private static buildResponse(data: any) {
        return {
            answer: data.answer,
            sources: data.sources,
            evidence: data.evidence,
            metadata: {
                execution_id: data.execution_id,
                agent_flow: data.agent_flow,
                execution_time_ms: data.execution_time_ms,
                timestamp: new Date().toISOString(),
                ...data.metadata
            }
        };
    }

    /**
     * Log execution to database for audit trail
     */
    private static async logExecution(executionId: string, question: string, response: any, userId: string) {
        try {
            await prisma.agentExecution.create({
                data: {
                    executionId,
                    userId,
                    question,
                    answer: response.answer,
                    sources: response.sources,
                    evidence: response.evidence as any,
                    metadata: response.metadata as any,
                    executionTimeMs: response.metadata.execution_time_ms
                }
            });
        } catch (error) {
            logger.error("Failed to log agent execution:", error);
        }
    }
}
```

---

### 2.2 Update API Route
**File:** `server/routes/helpRoutes.ts`

**Current:**
```typescript
const result = await RAGService.answerLegalQuestion(question);
```

**New:**
```typescript
const result = await OrchestratorService.answerLegalQuestion(question, req.user?.id);
```

---

## PHASE 3: DATABASE SCHEMA (Week 2)

### 3.1 Add Agent Execution Tracking
**File:** `prisma/schema.prisma`

```prisma
model AgentExecution {
  id              String   @id @default(cuid())
  executionId     String   @unique
  userId          String?
  question        String
  answer          String
  sources         String[]
  evidence        Json     // Array of evidence objects
  metadata        Json     // Agent flow metadata
  executionTimeMs Int
  createdAt       DateTime @default(now())

  user User? @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([createdAt])
}
```

**Migration:**
```bash
npx prisma migrate dev --name add_agent_execution_tracking
```

---

## PHASE 4: ADVANCED FEATURES (Week 3-4)

### 4.1 Form-Filling Agent
**Purpose:** Extract structured data from legal questions to auto-fill forms

```typescript
static async extractFormData(question: string, formType: string) {
    const prompt = `
Extract structured data from this question for a ${formType} form.

Question: ${question}

Return JSON with extracted fields.
`;

    const extracted = await ai.generateStructuredData(prompt);
    return extracted;
}
```

### 4.2 Checklist Agent
**Purpose:** Generate personalized checklists based on estate situation

```typescript
static async generateChecklist(estateData: any) {
    const prompt = `
Generate a personalized executor checklist based on:
- Estate type: ${estateData.type}
- State: ${estateData.state}
- Assets: ${estateData.assetCount}

Return prioritized checklist.
`;

    const checklist = await ai.generateText(prompt, "heavy");
    return checklist;
}
```

### 4.3 Timeline Agent
**Purpose:** Calculate deadlines and create timeline

```typescript
static async generateTimeline(estateData: any) {
    const deathDate = new Date(estateData.dateOfDeath);
    const state = estateData.state;

    // Retrieve state-specific deadlines from knowledge base
    const deadlines = await RAGService.retrieveLegalChunks(
        `${state} probate deadlines and timeline requirements`
    );

    // Generate timeline
    const timeline = await ai.generateStructuredData(`
Based on death date ${deathDate} and ${state} law, calculate:
- Creditor claim deadline
- Inventory filing deadline
- Final accounting deadline

Context: ${deadlines.chunks.map(c => c.content).join('\n')}
`);

    return timeline;
}
```

---

## PHASE 5: MONITORING & OBSERVABILITY (Week 4)

### 5.1 Agent Performance Dashboard
**Metrics to Track:**
- Retrieval quality (average similarity scores)
- Grounding scores (citation coverage)
- Validation pass rates
- Execution times per agent
- Error rates

### 5.2 Audit Trail Export
**For Legal Compliance:**
```typescript
static async exportAuditTrail(executionId: string) {
    const execution = await prisma.agentExecution.findUnique({
        where: { executionId },
        include: { user: true }
    });

    return {
        execution_id: executionId,
        timestamp: execution.createdAt,
        user: execution.user?.email,
        question: execution.question,
        answer: execution.answer,
        evidence_used: execution.evidence,
        agent_flow: execution.metadata.agent_flow,
        validation_status: execution.metadata.validation?.validation_status,
        grounding_score: execution.metadata.citation?.grounding_score
    };
}
```

---

## IMPLEMENTATION TIMELINE

### Week 1: Core Agent Decomposition
- [ ] Day 1-2: Refactor `retrieveLegalChunks` (Retrieval Agent)
- [ ] Day 3: Implement `draftAnswer` (Draft Agent)
- [ ] Day 4: Implement `attachCitations` (Citation Agent)
- [ ] Day 5: Implement `validateAnswer` (Validation Agent)

### Week 2: Orchestration & Database
- [ ] Day 1-2: Build `OrchestratorService`
- [ ] Day 3: Add database schema for agent execution tracking
- [ ] Day 4: Update API routes
- [ ] Day 5: Testing & debugging

### Week 3: Advanced Agents
- [ ] Day 1-2: Form-Filling Agent
- [ ] Day 3: Checklist Agent
- [ ] Day 4: Timeline Agent
- [ ] Day 5: Integration testing

### Week 4: Monitoring & Polish
- [ ] Day 1-2: Performance dashboard
- [ ] Day 3: Audit trail export
- [ ] Day 4-5: Documentation & deployment

---

## BENEFITS FOR EXPECTEDESTATE

### Legal Compliance
- ✅ **Audit trail** - Every answer tracked with evidence
- ✅ **Grounding enforcement** - Prevents hallucinations
- ✅ **Disclaimer validation** - Automatic compliance checks
- ✅ **Citation tracking** - Know exactly what sources were used

### Liability Protection
- ✅ **Evidence-based answers** - Can prove answer came from approved sources
- ✅ **Validation checks** - Catch problematic answers before delivery
- ✅ **Execution logs** - Full transparency for legal review

### Extensibility
- ✅ **Modular agents** - Add new capabilities without touching retrieval
- ✅ **Form-filling** - Auto-populate legal forms from conversations
- ✅ **Checklist generation** - Personalized executor guidance
- ✅ **Timeline calculation** - State-specific deadline tracking

### User Experience
- ✅ **Better answers** - Multi-stage refinement improves quality
- ✅ **Transparent sources** - Users see exactly where info comes from
- ✅ **Confidence scores** - Users know when to seek professional help

---

## COST ANALYSIS

### Current Monolithic RAG
- 1 embedding call per question
- 1 LLM call per question
- **~$0.002 per question**

### Multi-Agent Architecture
- 1 embedding call (Retrieval Agent)
- 3 LLM calls (Draft, Citation, Validation)
- **~$0.006 per question**

**Cost increase:** 3x  
**Value increase:** 10x (compliance, liability protection, extensibility)

**ROI:** Worth it for legal domain where liability is high

---

## RISKS & MITIGATION

### Risk 1: Increased Latency
**Impact:** 3x more LLM calls = 3x latency  
**Mitigation:** 
- Run Draft + Citation in parallel where possible
- Cache common questions
- Use streaming responses

### Risk 2: Higher Costs
**Impact:** 3x API costs  
**Mitigation:**
- Implement caching for repeated questions
- Use cheaper models for validation
- Monitor usage and optimize

### Risk 3: Complexity
**Impact:** More code to maintain  
**Mitigation:**
- Clear separation of concerns
- Comprehensive testing
- Good documentation

---

## NEXT STEPS

### Immediate (This Week)
1. Review this plan with team
2. Set up development branch
3. Start with Retrieval Agent refactor

### Short-term (Next 2 Weeks)
1. Implement core 4 agents
2. Build orchestrator
3. Add database tracking

### Medium-term (Next Month)
1. Add advanced agents (Form-Filling, Checklist, Timeline)
2. Build monitoring dashboard
3. Deploy to staging

### Long-term (Next Quarter)
1. Add more specialized agents
2. Implement agent marketplace
3. Build agent capability discovery

---

## CONCLUSION

Your current RAG system works, but it's not **agentic**. This transformation will:

1. **Protect you legally** - Full audit trail and grounding enforcement
2. **Enable growth** - Modular architecture for new capabilities
3. **Improve quality** - Multi-stage refinement catches errors
4. **Build trust** - Transparent, evidence-based answers

The 3x cost increase is worth it for a legal application where liability and compliance are critical.

**Recommendation:** Start with Phase 1 (Agent Decomposition) this week. You'll see immediate benefits in answer quality and compliance.
