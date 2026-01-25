# Implementation Plan: Communication Log

## Overview

This implementation plan breaks down the Communication Log feature into discrete, incremental tasks. The approach follows a bottom-up strategy: starting with the data layer, building up through services and API endpoints, and finishing with UI components. Each task builds on previous work, ensuring no orphaned code.

The implementation prioritizes the core logging workflow first (create, view, edit, delete), then adds search/filter capabilities, and finally implements follow-up management and dashboard integration.

## Tasks

- [ ] 1. Set up database schema and migrations
  - [-] 1.1 Create communications table with explicit schema
    - Add columns: id (UUID PK), estate_id (FK), asset_id (FK), type (enum), direction (enum), occurred_at (timestamptz), institution_name (varchar 255), contact_name (varchar 255), contact_channel (varchar 255), subject (varchar 500), notes (text), follow_up_due_at (timestamptz), follow_up_completed_at (timestamptz), follow_up_completed_by (FK users), status_change (enum), status_change_effective_at (timestamptz), created_at (timestamptz), updated_at (timestamptz), created_by (FK users)
    - Add CHECK constraints for type, direction, status_change enums
    - Add CHECK constraint: occurred_at <= NOW()
    - Add CHECK constraint: follow_up_due_at > occurred_at (if not null)
    - Add foreign keys to estates and assets tables with CASCADE delete
    - _Requirements: 1.5, 1.6, 1.7, 8.1, 15.1_
  
  - [ ] 1.2 Create communication_attachments table (normalized, separate from communications)
    - Add columns: id (UUID PK), communication_id (FK with CASCADE delete), storage_key (varchar 500), file_name (varchar 255), mime_type (varchar 100), size_bytes (integer), uploaded_by (FK users), created_at (timestamptz)
    - Add CHECK constraint: size_bytes > 0 AND size_bytes <= 10485760 (10MB limit)
    - Add CHECK constraint for valid mime_types (PDF, images, documents, text)
    - Add foreign key to communications with CASCADE delete (attachments deleted when communication deleted)
    - Benefits: Easy delete/GC, easy query, safer concurrency, easier auditing vs JSON array
    - _Requirements: 3.1, 3.3, 3.5_
  
  - [ ] 1.3 Create indexes for query optimization
    - Primary key indexes (automatic)
    - Foreign key indexes: estate_id, asset_id, communication_id
    - Query indexes: occurred_at DESC, follow_up_due_at (WHERE completed_at IS NULL)
    - Composite indexes: (estate_id, occurred_at DESC), (asset_id, occurred_at DESC)
    - _Requirements: 4.1, 5.1, 9.1_
  
  - [ ] 1.4 Create full-text search index (PostgreSQL FTS with GIN)
    - Create GIN index on tsvector of: subject, notes, institution_name, contact_name
    - Use 'english' language configuration for stemming and stop words
    - Search behavior: case-insensitive, combines with filters using AND semantics
    - Phase 1: Does NOT search attachment filenames (can add in Phase 2)
    - Target p95 latency < 1s for search queries
    - _Requirements: 6.1, 6.2_
  
  - [ ] 1.5 Add trigger or application logic for estate-asset validation (IDOR protection)
    - Ensure asset.estate_id matches communication.estate_id
    - Prevents IDOR attacks where attacker manipulates asset_id to access other estates
    - Can be enforced via database trigger OR application-level validation in API
    - _Requirements: 1.2_

- [ ] 2. Implement core data models and validation
  - [ ] 2.1 Create TypeScript interfaces and types
    - Define Communication interface with new schema fields (occurredAt, institutionName, contactChannel, followUpCompletedAt, followUpCompletedBy, statusChangeEffectiveAt)
    - Define CommunicationAttachment interface (normalized table)
    - Define CommunicationType, CommunicationDirection, AssetStatus enums
    - Define CreateCommunicationDTO, UpdateCommunicationDTO, CommunicationFilters types
    - Define CursorPaginatedResult, CommunicationWithAttachments, CommunicationWithAsset types
    - _Requirements: 1.5, 1.6, 2.4, 15.4_
  
  - [ ] 2.2 Write property test for valid communication type acceptance
    - **Property 7: Valid Communication Type Acceptance**
    - **Validates: Requirements 2.4**
  
  - [ ] 2.3 Write property test for invalid communication type rejection
    - **Property 8: Invalid Communication Type Rejection**
    - **Validates: Requirements 2.4**
  
  - [ ] 2.4 Implement validation functions
    - Create validators for required fields, email format, phone format, date constraints
    - Implement validation for occurredAt not in future
    - Implement validation for followUpDueAt after occurredAt
    - _Requirements: 1.5, 1.6_
  
  - [ ] 2.5 Write property test for required field validation
    - **Property 2: Required Field Validation**
    - **Validates: Requirements 1.5**
  
  - [ ] 2.6 Write property test for optional field acceptance
    - **Property 3: Optional Field Acceptance**
    - **Validates: Requirements 1.6**

- [ ] 3. Implement CommunicationService
  - [ ] 3.1 Create CommunicationService class with CRUD methods
    - Implement create() method with database insert (MUST wrap in transaction with asset update)
    - Implement findMany() method with cursor-based pagination (not offset pagination)
    - Implement findById() method (with attachments join from normalized table)
    - Implement update() method with partial updates (wrap in transaction ONLY if occurredAt changed)
    - Implement delete() method (MUST wrap in transaction with attachment cleanup + asset recalculation)
    - Implement search() method with PostgreSQL FTS (GIN index on subject, notes, institution_name, contact_name)
    - Implement getCountByAsset() method (indexed query, target p95 < 200ms)
    - Implement getRecent() method for dashboard widget (target p95 < 300ms)
    - _Requirements: 1.2, 4.1, 5.1, 6.1, 12.1, 14.1, 14.2_
  
  - [ ] 3.2 Write property test for communication creation
    - **Property 1: Communication Creation with Required Fields**
    - **Validates: Requirements 1.2, 1.5**
  
  - [ ] 3.3 Write property test for communication direction storage
    - **Property 6: Communication Direction Storage**
    - **Validates: Requirements 2.2, 2.3**
  
  - [ ] 3.4 Write property test for partial update preservation
    - **Property 32: Partial Update Preservation**
    - **Validates: Requirements 14.1**

- [ ] 4. Implement AssetService integration
  - [ ] 4.1 Add methods to update asset last contact date
    - Implement updateLastContactDate() method
    - Implement recalculateLastContactDate() method
    - Integrate with CommunicationService create/update/delete operations
    - _Requirements: 1.7, 11.1, 11.2, 11.3, 11.4_
  
  - [ ] 4.2 Write property test for last contact date update on creation
    - **Property 4: Asset Last Contact Date Update on Creation**
    - **Validates: Requirements 1.7, 11.1**
  
  - [ ] 4.3 Write property test for last contact date update on edit
    - **Property 29: Asset Last Contact Date Update on Edit**
    - **Validates: Requirements 11.2**
  
  - [ ] 4.4 Write property test for last contact date recalculation on delete
    - **Property 30: Asset Last Contact Date Recalculation on Delete**
    - **Validates: Requirements 11.3**

- [ ] 5. Implement FileService for attachments
  - [ ] 5.1 Create FileService class
    - Implement uploadFile() method with S3 integration (inserts to communication_attachments table)
    - Implement deleteFile() method (removes from storage and table)
    - Implement deleteAllFiles() method for communication deletion
    - Implement getDownloadUrl() method for signed URLs
    - Implement validateFile() method for size and type checks
    - _Requirements: 3.1, 3.3, 3.5, 3.6_
  
  - [ ] 5.2 Write property test for file attachment storage and retrieval
    - **Property 9: File Attachment Storage and Retrieval**
    - **Validates: Requirements 3.1, 3.5**
  
  - [ ] 5.3 Write property test for multiple file attachments
    - **Property 10: Multiple File Attachments**
    - **Validates: Requirements 3.3**
  
  - [ ] 5.4 Write unit tests for file validation
    - Test file size limit (10MB)
    - Test allowed MIME types
    - Test rejection of oversized files
    - Test rejection of unsupported types
    - _Requirements: 3.1_

- [ ] 6. Implement authorization and add integration tests
  - [ ] 6.1 Create AuthorizationService
    - Implement canAccessEstate() method (check estate_members table)
    - Implement canDeleteCommunication() method (role-based: executor/co-executor only)
    - Implement validateAssetEstate() method (IDOR protection: verify asset.estate_id matches communication.estate_id)
    - Implement getUserEstates() method
    - _Requirements: 1.2, 14.2_
  
  - [ ] 6.2 Write integration test for authorization wiring (end-to-end flow)
    - Test: Create comm → attach file → delete comm → verify attachment removed from storage AND database + asset last_contact recalculated correctly
    - Verify entire flow works end-to-end with transactions
    - Verify CASCADE delete removes attachment records from communication_attachments table
    - _Requirements: 1.7, 3.1, 11.3, 14.2_
  
  - [ ] 6.3 Write integration test for IDOR protection (critical security test)
    - Test: User A cannot read communications from User B's estate (returns 404 for GET, 403 for POST/PATCH/DELETE)
    - Test: User A cannot create communication with asset_id from User B's estate (returns 403 with error "Asset does not belong to this estate")
    - Test: User A cannot update/delete communications from User B's estate (returns 403)
    - Verify validateAssetEstate() prevents cross-estate access via asset_id manipulation
    - _Requirements: 1.2, 14.1, 14.2_
  
  - [ ] 6.4 Write integration test for concurrent operations (transaction consistency)
    - Test: Two concurrent creates for same asset preserve correct max date for last_contact_at (most recent wins)
    - Test: Edit communication to older date does not regress last_contact_at (recalculation uses MAX across all communications)
    - Test: Concurrent delete + create maintains correct last_contact_at
    - Verify PostgreSQL transaction isolation handles race conditions correctly
    - _Requirements: 11.1, 11.2_
  
  - [ ] 6.5 Checkpoint - Ensure data layer tests pass
    - Run all property tests (100+ iterations each) and unit tests for data layer
    - Run all integration tests for authorization, IDOR protection, and transactions
    - Verify database migrations work correctly (up and down)
    - Verify all indexes created and query performance meets targets
    - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Implement API endpoints for CRUD operations
  - [ ] 7.1 Create POST /api/communications endpoint
    - Implement request validation (required fields, date constraints, email/phone format)
    - Implement authentication and authorization checks (estate access + asset-estate validation for IDOR protection)
    - Call CommunicationService.create() (MUST wrap in transaction with asset update)
    - Call AssetService.updateLastContactDate() (within same transaction)
    - Return created communication with 201 status
    - Target p95 latency < 500ms
    - _Requirements: 1.2, 1.5, 1.6, 1.7_
  
  - [ ] 7.2 Create GET /api/communications endpoint
    - Implement query parameter parsing
    - Implement filtering by estateId, assetId, type, direction, date range
    - Implement cursor-based pagination (default 50, max 100)
    - Implement stable sorting: occurred_at DESC, id DESC
    - Call CommunicationService.findMany()
    - Return paginated results with nextCursor and hasMore
    - Target p95 latency < 800ms for 50 items
    - _Requirements: 4.1, 5.1, 5.3, 7.1, 7.2, 7.3_
  
  - [ ] 7.3 Create GET /api/communications/:id endpoint
    - Implement authorization check (estate access)
    - Call CommunicationService.findById() (includes attachments)
    - Return 404 if not found or unauthorized
    - Target p95 latency < 300ms
    - _Requirements: 4.1_
  
  - [ ] 7.4 Create GET /api/communications/recent endpoint
    - Implement estateId query parameter (required)
    - Implement limit parameter (default 5, max 20)
    - Call CommunicationService.getRecent()
    - Return communications with asset context
    - Target p95 latency < 300ms
    - _Requirements: 5.1_
  
  - [ ] 7.5 Create GET /api/assets/:id/communications/count endpoint
    - Implement authorization check
    - Call CommunicationService.getCountByAsset()
    - Return count
    - Target p95 latency < 200ms (indexed query)
    - _Requirements: 12.1, 12.3_
  
  - [ ] 7.6 Create PATCH /api/communications/:id endpoint
    - Implement request validation for partial updates
    - Implement authorization check (estate access via communication.estate_id)
    - Implement optimistic locking with updated_at timestamp (return 409 on conflict)
    - Call CommunicationService.update() (wrap in transaction ONLY if occurredAt changed)
    - If occurredAt changed: recalculate asset last_contact_at using MAX(occurred_at) (within same transaction)
    - Return updated communication or 409 on conflict
    - Target p95 latency < 500ms
    - _Requirements: 14.1_
  
  - [ ] 7.7 Create DELETE /api/communications/:id endpoint
    - Implement authorization check (estate access + role check: executor/co-executor only)
    - Call FileService.deleteAllFiles() for attachments (removes from S3 + database records via CASCADE)
    - Call CommunicationService.delete() (MUST wrap in transaction)
    - Call AssetService.recalculateLastContactDate() using MAX(occurred_at) from remaining communications (within same transaction)
    - Return 204 status
    - Target p95 latency < 800ms (includes attachment cleanup from storage)
    - _Requirements: 14.2, 14.4_
  
  - [ ] 7.8 Write property test for communication and attachment deletion
    - **Property 33: Communication and Attachment Deletion**
    - **Validates: Requirements 14.2**

- [ ] 8. Implement file upload API endpoints
  - [ ] 8.1 Create POST /api/communications/:id/attachments endpoint
    - Implement multipart/form-data parsing
    - Implement authorization check (estate access)
    - Call FileService.validateFile()
    - Call FileService.uploadFile() (inserts to communication_attachments table)
    - Return created attachment with 201 status
    - Target p95 latency < 3s for 5MB file
    - _Requirements: 3.1, 3.3_
  
  - [ ] 8.2 Create DELETE /api/communications/:id/attachments/:attachmentId endpoint
    - Implement authorization check (estate access)
    - Call FileService.deleteFile() (removes from storage and table)
    - Return 204 status
    - _Requirements: 14.2_
  
  - [ ] 8.3 Write unit tests for file upload error handling
    - Test file size exceeded error (413)
    - Test unsupported MIME type error (415)
    - Test upload failure retry logic
    - _Requirements: 3.1_
  
  - [ ] 8.4 Write integration test for file upload
    - Test real multipart parsing with valid file
    - Test file size validation at boundary (10MB)
    - Test MIME type validation
    - Verify file stored in S3 and record in database
    - _Requirements: 3.1, 3.5_

- [ ] 9. Implement search and filter functionality
  - [ ] 9.1 Add search support to GET /api/communications endpoint
    - Implement full-text search query parameter
    - Call CommunicationService.search()
    - Return matching communications
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [ ] 9.2 Write property test for search result matching
    - **Property 15: Search Result Matching**
    - **Validates: Requirements 6.1, 6.2**
  
  - [ ] 9.3 Write property test for case-insensitive search
    - **Property 16: Case-Insensitive Search**
    - **Validates: Requirements 6.2**
  
  - [ ] 9.4 Write property test for search clear restoration
    - **Property 17: Search Clear Restoration**
    - **Validates: Requirements 6.5**
  
  - [ ] 9.5 Write property test for combined filter application
    - **Property 18: Combined Filter Application**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [ ] 9.6 Write property test for filter result count accuracy
    - **Property 19: Filter Result Count Accuracy**
    - **Validates: Requirements 7.4**
  
  - [ ] 9.7 Write property test for filter clear restoration
    - **Property 20: Filter Clear Restoration**
    - **Validates: Requirements 7.5**

- [ ] 10. Implement FollowUpService
  - [ ] 10.1 Create FollowUpService class
    - Implement getPendingFollowUps() method (WHERE follow_up_completed_at IS NULL AND follow_up_due_at > NOW())
    - Implement getOverdueFollowUps() method (WHERE follow_up_completed_at IS NULL AND follow_up_due_at <= NOW())
    - Implement completeFollowUp() method (SET follow_up_completed_at = NOW(), follow_up_completed_by = userId)
    - Implement getFollowUpStatus() method with date logic (overdue/pending/completed based on completed_at timestamp)
    - Note: Using timestamped completion (follow_up_completed_at + follow_up_completed_by) instead of boolean for audit trail
    - _Requirements: 8.3, 8.4, 9.1, 10.1, 10.2_
  
  - [ ] 10.2 Write property test for follow-up date storage
    - **Property 21: Follow-Up Date Storage**
    - **Validates: Requirements 8.1**
  
  - [ ] 10.3 Write property test for follow-up status calculation
    - **Property 22: Follow-Up Status Calculation**
    - Test overdue: follow_up_due_at <= today AND completed_at IS NULL
    - Test pending: follow_up_due_at > today AND completed_at IS NULL
    - Test completed: completed_at IS NOT NULL
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [ ] 10.4 Write property test for pending follow-up query filtering
    - **Property 23: Pending Follow-Up Query Filtering**
    - **Validates: Requirements 9.1**
  
  - [ ] 10.5 Write property test for follow-up completion and removal
    - **Property 27: Follow-Up Completion and Removal**
    - Verify setting completed_at removes from pending queries
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ] 10.6 Write property test for follow-up deletion with communication
    - **Property 34: Follow-Up Deletion with Communication**
    - **Validates: Requirements 14.4**

- [ ] 11. Implement follow-up API endpoints
  - [ ] 11.1 Create GET /api/communications/follow-ups endpoint
    - Implement query parameter for status filter (pending, overdue, all)
    - Implement authorization check (estate access)
    - Call FollowUpService.getPendingFollowUps() or getOverdueFollowUps()
    - Join with asset data for display
    - Calculate daysUntilDue for each follow-up
    - Sort: overdue first (by follow_up_due_at ASC), then pending (by follow_up_due_at ASC)
    - Return follow-ups with asset context
    - Target p95 latency < 500ms
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [ ] 11.2 Add follow-up completion to PATCH /api/communications/:id
    - Accept followUpCompletedAt field in request body (set to NOW() to mark complete, or provide explicit timestamp)
    - Also accept followUpCompletedBy field (defaults to current user)
    - Call FollowUpService.completeFollowUp() to set timestamped completion
    - Note: Stores immutable completion record (timestamp + user) instead of boolean flag
    - _Requirements: 10.1, 10.2_
  
  - [ ] 11.3 Write property test for follow-up sorting order
    - **Property 25: Follow-Up Sorting Order**
    - Verify overdue first (by follow_up_due_at ASC), then pending (by follow_up_due_at ASC)
    - **Validates: Requirements 9.3**
  
  - [ ] 11.4 Write property test for follow-up count accuracy
    - **Property 26: Follow-Up Count Accuracy**
    - **Validates: Requirements 9.5**
  
  - [ ] 11.5 Write integration test for follow-up completion (end-to-end)
    - Test: Mark follow-up complete → verify removed from pending queries
    - Test: Verify followUpCompletedAt and followUpCompletedBy set correctly with timestamp
    - Test: Verify completed follow-ups still appear in timeline with completion indicator
    - _Requirements: 10.1, 10.2_

- [ ] 12. Checkpoint - Ensure API layer tests pass
  - Run all API endpoint tests
  - Test authentication and authorization (estate access, IDOR protection)
  - Test error handling and validation
  - Test cursor-based pagination with concurrent inserts
  - Verify p95 latency targets met for all endpoints
  - Ensure all tests pass, ask the user if questions arise

- [ ] 13. Implement CommunicationLogForm component
  - [ ] 13.1 Create form component with all fields
    - Implement controlled form with React Hook Form
    - Add fields: type, direction, occurredAt, institutionName, contactName, contactChannel, subject, notes, followUpDueAt, statusChange, statusChangeEffectiveAt
    - Implement default values (type=call, direction=outbound)
    - Implement rich text editor for notes field
    - Implement date/time pickers for occurredAt and followUpDueAt
    - Add file upload with drag-and-drop support
    - Implement form validation with error display
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 2.1, 2.5, 3.2, 8.1, 15.1_
  
  - [ ] 13.2 Implement form submission
    - Call POST /api/communications on submit
    - Handle success and error responses
    - Display loading state during submission
    - Close form and refresh timeline on success
    - Target < 30 seconds to complete form
    - _Requirements: 1.2, 17.2_
  
  - [ ] 13.3 Add asset context pre-population
    - Accept assetId prop to pre-select asset
    - Auto-populate institutionName from asset
    - _Requirements: 1.4, 13.2_
  
  - [ ] 13.4 Write property test for institution name auto-population
    - **Property 5: Institution Name Auto-Population**
    - **Validates: Requirements 1.4**
  
  - [ ] 13.5 Implement mobile-responsive layout
    - Use responsive CSS for small screens
    - Implement touch-friendly controls
    - Use appropriate input types (tel, email, datetime-local)
    - Test on mobile viewport sizes
    - _Requirements: 16.1, 16.2, 16.3, 16.4_
  
  - [ ] 13.6 Write unit tests for form component
    - Test form rendering with default values
    - Test validation error display
    - Test form submission success
    - Test form submission error handling
    - _Requirements: 1.3, 1.5_

- [ ] 14. Implement CommunicationTimeline component
  - [ ] 14.1 Create timeline component
    - Fetch communications from GET /api/communications
    - Display communications in reverse chronological order
    - Implement cursor-based pagination with infinite scroll
    - Show loading state while fetching
    - Show empty state when no communications
    - _Requirements: 4.1, 4.4, 5.1, 5.4_
  
  - [ ] 14.2 Implement CommunicationCard sub-component
    - Display occurredAt, type icon, direction indicator
    - Display contactName, subject, notes preview
    - Display asset name and institution (for estate-wide view)
    - Display status change badge if present
    - Display attachment count if present (from attachments join)
    - Display follow-up indicator if present (with status: pending/overdue/completed)
    - Implement expand/collapse for full details
    - _Requirements: 4.2, 5.2, 15.2_
  
  - [ ] 14.3 Write property test for timeline sorting
    - **Property 11: Communication Timeline Sorting**
    - **Validates: Requirements 4.1, 5.1**
  
  - [ ] 14.4 Write property test for timeline rendering completeness
    - **Property 12: Timeline Rendering Completeness**
    - **Validates: Requirements 4.2, 5.2**
  
  - [ ] 14.5 Write property test for cross-asset timeline context
    - **Property 13: Cross-Asset Timeline Context**
    - **Validates: Requirements 5.2**
  
  - [ ] 14.6 Write property test for pagination trigger
    - **Property 14: Pagination Trigger**
    - Test cursor-based pagination consistency
    - **Validates: Requirements 5.3**
  
  - [ ] 14.7 Write unit tests for timeline component
    - Test empty state rendering
    - Test loading state rendering
    - Test communication card rendering
    - Test cursor pagination behavior
    - _Requirements: 4.4_

- [ ] 15. Implement edit and delete functionality
  - [ ] 15.1 Add edit action to CommunicationCard
    - Add edit button to communication card
    - Open CommunicationLogForm in edit mode with pre-filled data
    - Call PATCH /api/communications/:id on submit
    - Refresh timeline on success
    - _Requirements: 14.1_
  
  - [ ] 15.2 Add delete action to CommunicationCard
    - Add delete button to communication card
    - Show confirmation dialog before delete
    - Call DELETE /api/communications/:id on confirm
    - Remove from timeline on success
    - _Requirements: 14.2, 14.3_
  
  - [ ] 15.3 Write unit tests for edit and delete
    - Test edit form pre-population
    - Test delete confirmation dialog
    - Test optimistic UI updates
    - _Requirements: 14.1, 14.2, 14.3_

- [ ] 16. Implement CommunicationFilters component
  - [ ] 16.1 Create filter component
    - Add filter controls for type, direction, date range, asset
    - Add search input field
    - Implement filter state management
    - Apply filters to GET /api/communications query
    - Display active filter count
    - Add clear all filters button
    - _Requirements: 6.1, 6.5, 7.1, 7.2, 7.3, 7.5_
  
  - [ ] 16.2 Integrate filters with timeline
    - Pass filter state to CommunicationTimeline
    - Update timeline when filters change
    - Display result count
    - Show "no results" message when filters return empty
    - _Requirements: 6.4, 7.4_
  
  - [ ] 16.3 Write unit tests for filters
    - Test filter application
    - Test filter clearing
    - Test search input
    - Test result count display
    - _Requirements: 6.1, 7.1, 7.4_

- [ ] 17. Implement FollowUpWidget component
  - [ ] 17.1 Create dashboard widget
    - Fetch follow-ups from GET /api/communications/follow-ups
    - Display pending and overdue follow-ups
    - Sort by overdue first, then by date ascending
    - Display asset name, institution, dates, status
    - Display count badge with total pending
    - Show empty state when no follow-ups
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  
  - [ ] 17.2 Write property test for follow-up rendering completeness
    - **Property 24: Follow-Up Rendering Completeness**
    - **Validates: Requirements 9.2**
  
  - [ ] 17.3 Write property test for completed follow-up display
    - **Property 28: Completed Follow-Up Display**
    - **Validates: Requirements 10.3**
  
  - [ ] 17.4 Add complete follow-up action
    - Add checkbox or button to mark complete
    - Call PATCH /api/communications/:id with followUpCompleted=true
    - Remove from widget on success
    - Update count badge
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [ ] 17.5 Add navigation to communication detail
    - Make follow-up items clickable
    - Navigate to asset detail page with communication expanded
    - _Requirements: 9.4_
  
  - [ ] 17.6 Write unit tests for follow-up widget
    - Test empty state rendering
    - Test follow-up item rendering
    - Test sorting order
    - Test complete action
    - Test navigation
    - _Requirements: 9.1, 9.5, 10.1_

- [ ] 18. Integrate with asset detail page
  - [ ] 18.1 Add communication timeline to asset detail page
    - Embed CommunicationTimeline component filtered by assetId
    - Add "Log Communication" button
    - Open CommunicationLogForm with asset pre-selected
    - _Requirements: 4.1, 13.1, 13.2_
  
  - [ ] 18.2 Add communication count badge to asset cards
    - Fetch count from GET /api/assets/:id/communications/count
    - Display badge with count if > 0
    - Update badge in real-time when communications added/deleted
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  
  - [ ] 18.3 Write property test for communication count accuracy
    - **Property 31: Communication Count Accuracy**
    - **Validates: Requirements 12.1, 12.3**
  
  - [ ] 18.4 Write unit tests for asset integration
    - Test timeline filtering by asset
    - Test badge display logic
    - Test real-time count updates
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 19. Implement floating action button
  - [ ] 19.1 Create FloatingActionButton component
    - Position button fixed in bottom-right corner
    - Make accessible from all pages
    - Open CommunicationLogForm on click
    - Require asset selection when no context
    - _Requirements: 13.3, 13.4_
  
  - [ ] 19.2 Write unit tests for FAB
    - Test button rendering
    - Test form opening
    - Test asset selection requirement
    - _Requirements: 13.3, 13.4_

- [ ] 20. Implement status change linking
  - [ ] 20.1 Add status change field to form
    - Add optional status change dropdown to CommunicationLogForm
    - Include all valid status values
    - _Requirements: 15.1, 15.4_
  
  - [ ] 20.2 Display status changes in timeline
    - Show status change badge prominently on communication cards
    - Use distinct styling for communications with status changes
    - _Requirements: 15.2_
  
  - [ ] 20.3 Write property test for status change display
    - **Property 35: Status Change Display**
    - **Validates: Requirements 15.2**
  
  - [ ] 20.4 Integrate with asset status history
    - Include communications with status changes in asset status history view
    - Link status history entries to communications
    - _Requirements: 15.3_
  
  - [ ] 20.5 Write property test for status history communication inclusion
    - **Property 36: Status History Communication Inclusion**
    - **Validates: Requirements 15.3**

- [ ] 21. Integrate with dashboard
  - [ ] 21.1 Add FollowUpWidget to dashboard
    - Place widget in prominent position
    - Show pending follow-ups count
    - Link to full communications page
    - _Requirements: 9.1, 9.5_
  
  - [ ] 21.2 Add recent communications widget
    - Fetch from GET /api/communications/recent
    - Show 5 most recent communications across all assets
    - Display asset name, type, occurredAt
    - Link to asset detail page
    - _Requirements: 5.1_
  
  - [ ] 21.3 Write unit tests for dashboard integration
    - Test widget rendering
    - Test navigation links
    - Test data refresh
    - _Requirements: 9.1, 9.5_

- [ ] 22. Implement real-time updates
  - [ ] 22.1 Add optimistic UI updates
    - Update timeline immediately on create/edit/delete
    - Update count badges immediately
    - Update follow-up widget immediately
    - Rollback on error
    - _Requirements: 12.4, 17.5_
  
  - [ ] 22.2 Add cache invalidation
    - Invalidate relevant queries on mutations
    - Refetch data after mutations complete
    - Use React Query or similar for cache management
    - _Requirements: 17.5_
  
  - [ ] 22.3 Write unit tests for real-time updates
    - Test optimistic updates
    - Test rollback on error
    - Test cache invalidation
    - _Requirements: 12.4, 17.5_

- [ ] 23. Final checkpoint - End-to-end testing
  - Test complete user flows:
    - Create communication from asset page
    - Create communication from floating button
    - Edit communication
    - Delete communication
    - Search communications (PostgreSQL FTS)
    - Filter communications
    - Set follow-up reminder
    - Complete follow-up (verify timestamped completion)
    - Upload attachments (verify normalized storage)
    - View timeline with cursor pagination
  - Verify all property tests pass (100+ iterations each)
  - Verify all unit tests pass
  - Verify all integration tests pass (authorization, IDOR, transactions, concurrency)
  - Verify performance targets met (p95 latencies for all endpoints)
  - Test cursor pagination with concurrent inserts
  - Verify database migrations work (up and down)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate authorization, transactions, and cross-layer behavior
- The implementation follows a bottom-up approach: data layer → services → API → UI
- Real-time updates and optimistic UI provide excellent user experience
- Mobile responsiveness is built in from the start, not added later
- Cursor-based pagination ensures consistency with concurrent inserts
- Normalized attachment storage simplifies concurrency and cleanup
- Timestamped follow-up completion provides audit trail
- PostgreSQL FTS provides fast, indexed full-text search
- Transaction boundaries ensure derived data consistency
- Authorization checks prevent IDOR vulnerabilities
- Performance targets (p95 latencies) ensure responsive user experience
