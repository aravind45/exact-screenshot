# Agentic RAG Transformation - Implementation Tasks

## Phase 1: Core Agent Decomposition (Week 1)

### 1.1 Retrieval Agent Refactor
- [x] 1.1.1 Update `retrieveLegalChunks` method signature to return structured evidence
- [x] 1.1.2 Remove hard threshold (0.45) from SQL query
- [x] 1.1.3 Add chunk ID to SELECT statement
- [x] 1.1.4 Create evidence array with IDs, snippets, and scores
- [x] 1.1.5 Add metadata object for audit trail
- [x] 1.1.6 Update error handling to return structured empty response
- [x] 1.1.7 Add logging for retrieval metrics

### 1.2 Draft Agent Implementation
- [x] 1.2.1 Create `draftAnswer` method in RAGService
- [x] 1.2.2 Accept question and evidence array as parameters
- [ ] 1.2.3 Build context from evidence with evidence IDs
- [ ] 1.2.4 Create prompt that focuses on drafting only (no citations)
- [ ] 1.2.5 Call AI service to generate draft
- [ ] 1.2.6 Return draft with confidence score and metadata
- [ ] 1.2.7 Add logging for draft generation metrics

### 1.3 Citation Agent Implementation
- [ ] 1.3.1 Create `attachCitations` method in RAGService
- [ ] 1.3.2 Accept draft and evidence array as parameters
- [ ] 1.3.3 Build evidence list with IDs for LLM
- [ ] 1.3.4 Create prompt that enforces citation rules
- [ ] 1.3.5 Call AI service to add citations
- [ ] 1.3.6 Extract and count citations used
- [ ] 1.3.7 Calculate grounding score
- [ ] 1.3.8 Return final answer with citation metadata
- [ ] 1.3.9 Add logging for citation metrics

### 1.4 Validation Agent Implementation
- [ ] 1.4.1 Create `validateAnswer` method in RAGService
- [ ] 1.4.2 Check for disclaimer presence
- [ ] 1.4.3 Check for citation presence
- [ ] 1.4.4 Validate evidence sufficiency
- [ ] 1.4.5 Check grounding score threshold
- [ ] 1.4.6 Auto-add disclaimer if missing
- [ ] 1.4.7 Return validation results with checks
- [ ] 1.4.8 Add logging for validation status

## Phase 2: Orchestration & Database (Week 2)

### 2.1 Orchestrator Service
- [x] 2.1.1 Create `server/services/orchestratorService.ts`
- [ ] 2.1.2 Implement `answerLegalQuestion` orchestration method
- [ ] 2.1.3 Generate unique execution ID
- [ ] 2.1.4 Call Retrieval Agent and handle empty results
- [ ] 2.1.5 Call Draft Agent with retrieved evidence
- [ ] 2.1.6 Call Citation Agent with draft
- [ ] 2.1.7 Call Validation Agent with cited answer
- [ ] 2.1.8 Build standardized response structure
- [ ] 2.1.9 Add execution time tracking
- [ ] 2.1.10 Implement `buildResponse` helper method
- [ ] 2.1.11 Implement `logExecution` database logging
- [ ] 2.1.12 Add comprehensive error handling

### 2.2 Database Schema
- [x] 2.2.1 Add `AgentExecution` model to Prisma schema
- [ ] 2.2.2 Add fields: executionId, userId, question, answer
- [ ] 2.2.3 Add fields: sources, evidence (JSON), metadata (JSON)
- [ ] 2.2.4 Add executionTimeMs and timestamps
- [ ] 2.2.5 Add indexes for userId and createdAt
- [ ] 2.2.6 Add relation to User model
- [ ] 2.2.7 Run migration: `npx prisma migrate dev --name add_agent_execution_tracking`
- [ ] 2.2.8 Generate Prisma client

### 2.3 API Route Updates
- [x] 2.3.1 Update `server/routes/helpRoutes.ts` imports
- [x] 2.3.2 Replace `RAGService.answerLegalQuestion` with `OrchestratorService.answerLegalQuestion`
- [x] 2.3.3 Pass user ID to orchestrator for logging
- [ ] 2.3.4 Update response handling for new metadata structure
- [ ] 2.3.5 Add error handling for orchestrator failures

### 2.4 Testing
- [ ] 2.4.1 Test Retrieval Agent with various queries
- [ ] 2.4.2 Test Draft Agent with different evidence sets
- [ ] 2.4.3 Test Citation Agent citation enforcement
- [ ] 2.4.4 Test Validation Agent compliance checks
- [ ] 2.4.5 Test full orchestration flow end-to-end
- [ ] 2.4.6 Test database logging
- [ ] 2.4.7 Test error scenarios and fallbacks

## Phase 3: Advanced Agents (Week 3)

### 3.1 Form-Filling Agent
- [ ] 3.1.1 Create `extractFormData` method in RAGService
- [ ] 3.1.2 Design prompt for structured data extraction
- [ ] 3.1.3 Implement JSON schema validation
- [ ] 3.1.4 Add form type mapping
- [ ] 3.1.5 Test with DE-111, DE-221 forms
- [ ] 3.1.6 Add to orchestrator as optional agent

### 3.2 Checklist Agent
- [ ] 3.2.1 Create `generateChecklist` method in RAGService
- [ ] 3.2.2 Design prompt for personalized checklists
- [ ] 3.2.3 Integrate with estate data
- [ ] 3.2.4 Add priority scoring
- [ ] 3.2.5 Test with different estate types
- [ ] 3.2.6 Add to orchestrator as optional agent

### 3.3 Timeline Agent
- [ ] 3.3.1 Create `generateTimeline` method in RAGService
- [ ] 3.3.2 Retrieve state-specific deadline rules
- [ ] 3.3.3 Calculate deadlines from death date
- [ ] 3.3.4 Format timeline output
- [ ] 3.3.5 Test with multiple states
- [ ] 3.3.6 Add to orchestrator as optional agent

## Phase 4: Monitoring & Observability (Week 4)

### 4.1 Performance Metrics
- [ ] 4.1.1 Add metrics collection for each agent
- [ ] 4.1.2 Track average similarity scores
- [ ] 4.1.3 Track grounding scores over time
- [ ] 4.1.4 Track validation pass rates
- [ ] 4.1.5 Track execution times per agent
- [ ] 4.1.6 Track error rates by agent

### 4.2 Audit Trail Export
- [ ] 4.2.1 Create `exportAuditTrail` method
- [ ] 4.2.2 Query execution by ID
- [ ] 4.2.3 Format for legal compliance
- [ ] 4.2.4 Add PDF export option
- [ ] 4.2.5 Add CSV export option
- [ ] 4.2.6 Create API endpoint for export

### 4.3 Dashboard
- [ ] 4.3.1 Design metrics dashboard UI
- [ ] 4.3.2 Add real-time metrics display
- [ ] 4.3.3 Add historical trends
- [ ] 4.3.4 Add agent performance comparison
- [ ] 4.3.5 Add error log viewer

## Phase 5: Optimization & Deployment

### 5.1 Performance Optimization
- [ ] 5.1.1 Implement response caching for common questions
- [ ] 5.1.2 Add parallel execution where possible
- [ ] 5.1.3 Optimize database queries
- [ ] 5.1.4 Add streaming responses
- [ ] 5.1.5 Benchmark and profile

### 5.2 Documentation
- [ ] 5.2.1 Document agent architecture
- [ ] 5.2.2 Create API documentation
- [ ] 5.2.3 Write deployment guide
- [ ] 5.2.4 Create troubleshooting guide
- [ ] 5.2.5 Document monitoring procedures

### 5.3 Deployment
- [ ] 5.3.1 Deploy to staging environment
- [ ] 5.3.2 Run integration tests
- [ ] 5.3.3 Performance testing
- [ ] 5.3.4 Security audit
- [ ] 5.3.5 Deploy to production
- [ ] 5.3.6 Monitor initial rollout

## Notes

- Each task should be completed and tested before moving to the next
- All changes should maintain backward compatibility during transition
- Keep the old `answerLegalQuestion` method until orchestrator is fully tested
- Monitor costs closely during rollout
- Gather user feedback on answer quality improvements
