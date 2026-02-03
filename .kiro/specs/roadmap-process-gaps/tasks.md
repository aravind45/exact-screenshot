# Settlement Roadmap Process Gaps - Implementation Tasks

**Feature**: roadmap-process-gaps  
**Status**: Ready for Implementation  
**Estimated Duration**: 3 weeks

---

## Phase 1: Backend & Data Model (Week 1)

### 1.1 Database Schema Updates
- [ ] Add `hasMinorBeneficiaries` boolean to Estate model
- [ ] Add `hasContest` boolean to Estate model
- [ ] Add `hasPrimaryResidence` boolean to Estate model
- [ ] Add `bondWaiverStatus` enum to Estate model
- [ ] Add `guardianAdLitemId` string (optional) to Estate model
- [ ] Add `guardianAdLitemStatus` enum (optional) to Estate model
- [ ] Add `specialNoticeParties` JSON field to Estate model
- [ ] Create migration for new Estate fields
- [ ] Run migration on development database

### 1.2 Task Completion Model
- [ ] Create `TaskCompletion` model in Prisma schema
- [ ] Add fields: id, estateId, taskId, phase, completed, completedAt, completedBy, notes, attachments
- [ ] Create migration for TaskCompletion table
- [ ] Run migration on development database

### 1.3 Roadmap Filtering Service
- [ ] Create `server/services/roadmapService.ts`
- [ ] Implement `filterTasksForEstate()` function
- [ ] Add logic for minor beneficiaries detection
- [ ] Add logic for small estate detection
- [ ] Add logic for contested estate detection
- [ ] Add logic for primary residence detection
- [ ] Add logic for bond waiver (always show as optional)
- [ ] Add logic for special notice (always show)
- [ ] Write unit tests for filtering logic

### 1.4 API Endpoints
- [ ] Create `GET /api/estates/:id/roadmap` endpoint
- [ ] Implement estate profile analysis
- [ ] Return filtered tasks based on estate profile
- [ ] Include trigger flags in response
- [ ] Create `POST /api/estates/:id/tasks/:taskId/complete` endpoint
- [ ] Create `GET /api/estates/:id/tasks` endpoint (list completions)
- [ ] Add error handling and validation
- [ ] Write API integration tests

---

## Phase 2: Roadmap Configuration (Week 1)

### 2.1 Guardian Ad Litem Tasks
- [ ] Add `identify_minor_beneficiaries` task to Phase 0
- [ ] Add `petition_guardian_ad_litem` task to Phase 1
- [ ] Add `obtain_guardian_order` task to Phase 1
- [ ] Add `coordinate_with_guardian` task to Phase 2-4
- [ ] Add `guardian_distribution_approval` task to Phase 5
- [ ] Set proper `isOptional`, `dependencies`, `applicability` flags
- [ ] Add form links (DE-350, DE-351)
- [ ] Add alerts and help article IDs

### 2.2 Primary Residence Succession Tasks
- [ ] Add `check_primary_residence_succession` task to Phase 0
- [ ] Add `file_succession_petition` task to Phase 1
- [ ] Add `obtain_succession_order` task to Phase 1
- [ ] Set `exclusiveGroup: "filing_path"`
- [ ] Add form links (DE-310, DE-315)
- [ ] Add eligibility criteria in description
- [ ] Add alerts about limitations

### 2.3 Special Notice Tasks
- [ ] Add `track_special_notice_requests` task to Phase 1
- [ ] Add `serve_special_notice_parties` task to Phase 1
- [ ] Set `isLongHorizon: true` for ongoing tasks
- [ ] Add form link (DE-154)
- [ ] Add alerts about service requirements

### 2.4 Bond Waiver Tasks
- [ ] Add `request_bond_waiver` task to Phase 1
- [ ] Add `file_bond_waiver` task to Phase 1
- [ ] Add `obtain_bond_waiver_order` task to Phase 1
- [ ] Set all as `isOptional: true`
- [ ] Add form links (DE-142, DE-143)
- [ ] Add cost savings utility message

### 2.5 Contested Probate Tasks
- [ ] Add `respond_to_objections` task to Phase 1
- [ ] Add `attend_contest_hearing` task to Phase 1
- [ ] Add `resolve_contest` task to Phase 1
- [ ] Set all as `isOptional: true` (only if contested)
- [ ] Add form links (DE-115, DE-116)
- [ ] Add timeline warnings

---

## Phase 3: Frontend Integration (Week 2)

### 3.1 API Client Updates
- [ ] Add `getEstateRoadmap(estateId)` to `src/lib/api.ts`
- [ ] Add `completeTask(estateId, taskId, notes?)` to api client
- [ ] Add `getTaskCompletions(estateId)` to api client
- [ ] Add TypeScript interfaces for roadmap response
- [ ] Add error handling

### 3.2 Roadmap Page Updates
- [ ] Update `src/pages/SettlementRoadmap.tsx` to use filtered API
- [ ] Replace static tasks with API-fetched tasks
- [ ] Add loading states
- [ ] Add error states
- [ ] Implement task completion UI
- [ ] Add task notes/attachments upload

### 3.3 Task UI Components
- [ ] Create task badge component (Required/Optional/Conditional)
- [ ] Add badge to PhaseTaskList component
- [ ] Create process explainer collapsible component
- [ ] Add explainers for guardian ad litem tasks
- [ ] Add explainers for succession tasks
- [ ] Add explainers for bond waiver tasks

### 3.4 Progress Tracking Enhancement
- [ ] Update progress calculation to separate required/optional
- [ ] Add dual progress bars (required vs optional)
- [ ] Update progress percentage display
- [ ] Add completion statistics
- [ ] Add visual indicators for task types

---

## Phase 4: Onboarding Integration (Week 2)

### 4.1 Estate Profile Calculation
- [ ] Update onboarding to calculate `hasMinorBeneficiaries`
- [ ] Check heirs array for any `isMinor: true`
- [ ] Update estate record with flag
- [ ] Update onboarding to set `hasContest` flag
- [ ] Capture from estate basics step
- [ ] Update estate record with flag

### 4.2 Asset Analysis
- [ ] Detect primary residence from assets
- [ ] Set `hasPrimaryResidence` flag
- [ ] Calculate total estate value
- [ ] Determine if qualifies for small estate procedures
- [ ] Update estate record with flags

### 4.3 Onboarding Flow Updates
- [ ] Ensure all trigger data is captured
- [ ] Add validation for required fields
- [ ] Test data flow from onboarding to roadmap
- [ ] Verify roadmap updates after onboarding completion

---

## Phase 5: Testing & Quality Assurance (Week 3)

### 5.1 Unit Tests
- [ ] Test `filterTasksForEstate()` with various estate profiles
- [ ] Test estate with minors → shows guardian tasks
- [ ] Test small estate → shows succession tasks
- [ ] Test contested estate → shows objection tasks
- [ ] Test standard estate → hides optional tasks
- [ ] Test edge cases (multiple triggers)

### 5.2 Integration Tests
- [ ] Test complete onboarding → roadmap flow
- [ ] Test task completion workflow
- [ ] Test API endpoints with various estate profiles
- [ ] Test error handling
- [ ] Test concurrent task completions

### 5.3 End-to-End Tests
- [ ] Create test estate with minors
- [ ] Verify guardian ad litem tasks appear
- [ ] Complete guardian tasks
- [ ] Verify progress tracking
- [ ] Create test small estate
- [ ] Verify succession tasks appear
- [ ] Test contested estate workflow

### 5.4 User Acceptance Testing
- [ ] Test with real executor scenarios
- [ ] Verify task descriptions are clear
- [ ] Verify form links work
- [ ] Verify alerts are helpful
- [ ] Gather feedback on UI/UX
- [ ] Make refinements based on feedback

---

## Phase 6: Documentation & Deployment (Week 3)

### 6.1 Documentation
- [ ] Update API documentation with new endpoints
- [ ] Document roadmap filtering logic
- [ ] Create user guide for new processes
- [ ] Update help articles
- [ ] Document task completion workflow

### 6.2 Deployment Preparation
- [ ] Run all tests in staging environment
- [ ] Verify database migrations
- [ ] Test with production-like data
- [ ] Create rollback plan
- [ ] Prepare deployment checklist

### 6.3 Deployment
- [ ] Deploy database migrations to production
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Verify deployment success
- [ ] Monitor for errors
- [ ] Announce new features to users

---

## Success Criteria

- [ ] All 5 process workflows implemented
- [ ] Task filtering works correctly for all estate types
- [ ] Roadmap coverage increases from 40% to 80%+
- [ ] All tests passing
- [ ] No critical bugs
- [ ] User feedback is positive
- [ ] Performance is acceptable (< 500ms API response)

---

## Rollback Plan

If critical issues are discovered:
1. Revert frontend changes (roadmap still shows all tasks)
2. Keep backend changes (no breaking changes)
3. Fix issues in development
4. Redeploy when ready

---

## Notes

- Guardian ad litem tasks are highest priority (affects 30% of estates)
- Special notice tasks should always be visible (used in 90% of estates)
- Bond waiver is optional but valuable (saves significant money)
- Primary residence succession is CA-specific for now
- Contested probate tasks are rare but critical when needed

---

**Status**: ✅ Ready for Implementation  
**Next Step**: Begin Phase 1 - Backend & Data Model  
**Estimated Completion**: 3 weeks from start
