# Application Processes Evaluation Report

This document provides an evaluation of the core application processes in ExpectedEstate, including Registration, Onboarding, Settlement Roadmaps, and Advisor Bookings.

## 1. Registration & Onboarding Flow

### Current Implementation
- **Auth Routing (`Auth.tsx`)**: Handles role-based routing effectively. Users are categorized as `EXECUTOR`, `ADVISOR`, or `HEIR`. It intelligently uses `sessionStorage` to handle post-login redirects (e.g., accepting an invite).
- **Guided Wizard (`OnboardingWizard.tsx`)**: A 7-step process for Executors that collects estate basics, calculates the legal track (Track Scout), gathers heirs, uploads the death certificate, adds initial assets, and invites team members.

### Strengths
- **Contextual Routing**: The system smartly routes users based on their role (Advisors go to `/advisor/dashboard`, Heirs to their specific invite link, Executors to the wizard).
- **Progressive Disclosure**: The onboarding wizard breaks down complex estate data gathering into digestible steps.
- **Auto-Calculation**: The "Track Scout" automatically determines the probate path (e.g., Small Estate vs. Full Probate) based on state rules and estate value.

### Areas for Improvement / Gaps
- **Asset Type Mapping Debt**: In `OnboardingWizard.tsx` (Step 5), asset types are hardcoded to map to either `real_estate` or `bank_account` (`assetType: asset.type === 'real_estate' ? 'real_estate' : 'bank_account'`). This will cause issues when users add vehicles, businesses, or life insurance, as they will be miscategorized in the database.
- **Team Invite Error Handling**: In Step 6 of onboarding, if an email fails to send via `api.inviteCollaborator`, it might fail silently or block the user from completing onboarding.
- **Heir Intestacy Preview**: The intestacy preview is a great feature, but it relies heavily on accurate relationship mapping which can be legally complex (e.g., half-siblings, adopted children).

## 2. Settlement Roadmaps & Related Actions

### Current Implementation
- **Roadmap UI (`SettlementRoadmapNew.tsx`)**: Displays a 6-phase guide with a visual progress ring and collapsible task lists.
- **Blocker Alerts**: Shows an "Authority Support Required" banner if assets require Letters Testamentary to be transferred.
- **Task Management**: Users can toggle tasks, which updates the `completedTaskIds` array in the backend.

### Strengths
- **Gamification & Motivation**: The visual progress indicators (percentages, rings) help keep executors motivated during a long process.
- **Contextual Alerts**: The Authority Blocker alert is excellent UX, explaining *why* a user cannot proceed with certain assets until court documents are finalized.

### Areas for Improvement / Gaps
- **Mocked Blocker Logic**: The Authority Banner logic is currently partially mocked (`assets.length > 0 && !completedPhases.includes('court_filing')`). This should be tied to specific asset requirements (e.g., a bank account over $166k in CA explicitly flagging that it needs full probate).
- **Task Dependencies**: The current roadmap allows toggling tasks in any order. There should ideally be strict dependencies (e.g., cannot mark "Distribute Assets" as complete if "Pay Creditors" is incomplete).

## 3. Advisor & Executor Bookings

### Current Implementation
- **Booking Service (`bookingService.ts`)**: Handles the creation, confirmation, and cancellation of advisor sessions.
- **Financials**: Calculates a 20% platform fee (`PLATFORM_FEE_PERCENT = 0.20`).
- **Escrow System**: Holds funds in escrow before releasing them to the advisor via Stripe Connect.

### Strengths
- **Solid Financial Model**: The split between `totalAmount`, `platformFee`, and `advisorPayout` is clearly defined at the time of booking.
- **Stripe Integration**: Uses Stripe Payment Intents and Connect for secure, compliant payment routing.

### Areas for Improvement / Gaps
- **90-Day Escrow Period**: `private static ESCROW_DAYS = 90;` is exceptionally long for a consultation marketplace. Standard escrow for hourly consultations is typically 3-7 days after the session is completed. A 90-day hold will likely deter advisors from joining the platform.
- **Availability Checks**: The `createBooking` method does not explicitly check for double-booking or advisor availability within the transaction. This relies entirely on the frontend or a separate service, which could lead to race conditions if two users book the same slot simultaneously.
- **Status Transitions**: The cron job `processDuePayouts` checks for `status: 'COMPLETED'`. However, there needs to be a clear mechanism (either auto-complete after the session time passes, or manual confirmation by both parties) to move a booking from `CONFIRMED` to `COMPLETED`.

## Summary Recommendations

1. **Immediate Fix**: Change `ESCROW_DAYS` in `BookingService` from 90 to a more reasonable number (e.g., 3 or 7) to ensure advisor retention.
2. **Data Integrity**: Update the asset creation logic in the Onboarding Wizard to support the full range of `assetType` enums defined in the Prisma schema.
3. **Roadmap Logic**: Implement strict task dependencies in the roadmap to prevent users from accidentally skipping legally required steps (like creditor waiting periods) before distributing assets.
4. **Booking Safety**: Add a database-level or transaction-level availability check in `createBooking` to prevent double-booking of advisors.