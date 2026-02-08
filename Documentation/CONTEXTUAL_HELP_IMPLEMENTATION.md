# Contextual Help Icons Implementation

## Overview
Added contextual help icons to roadmap tasks that link directly to specific help articles in the Help Center.

## Changes Made

### 1. Task Configuration (`src/config/settlementPhases.ts`)
- Added `helpArticleId?: string` field to `PhaseTask` interface
- Mapped key tasks to their corresponding help articles:
  - `check_small_estate` → "small-estate-affidavit"
  - `confirm_executor_role` → "executor-duties"
  - `file_petition` → "probate-steps"
  - `publish_notice` → "creditor-notice"
  - `file_affidavit` → "small-estate-affidavit"
  - `file_spousal_petition` → "spousal-property"
  - `issue_cert_trust` → "trust-administration"
  - `check_unclaimed_property` → "asset-discovery"
  - `complete_inventory` → "inventory-appraisal"
  - `review_claims` → "creditor-claims"
  - `pay_taxes` → "tax-returns"

### 2. Task UI Component (`src/components/PhaseTaskList.tsx`)
- Added `HelpCircle` icon import from lucide-react
- Added `useNavigate` hook from react-router-dom
- Added help icon button next to task title (visible on hover)
- Help icon navigates to `/help-center?article={helpArticleId}`
- Icon styled with blue color and hover effects

### 3. Help Center (`src/pages/HelpCenter.tsx`)
- Added unique `id` field to each FAQ item
- Added URL parameter support (`?article={articleId}`)
- Implemented auto-scroll to article when navigating from task
- Implemented auto-expand accordion when article is specified
- Added controlled accordion state for programmatic opening

## User Experience
1. User hovers over a task in the roadmap
2. Help icon appears next to task title
3. Clicking help icon navigates to Help Center
4. Help Center automatically scrolls to and opens the relevant FAQ
5. User can read detailed guidance specific to that task

## Future Enhancements
- Add more help article mappings for remaining tasks
- Create dedicated help pages for complex topics
- Add inline help tooltips for quick reference
- Track help usage analytics for improvement
