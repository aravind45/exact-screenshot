# Advisor Separation & Redesign - Requirements

## Overview
Separate advisor users from executor users with completely independent registration flows, navigation, and dashboards. Advisors should never see executor-specific features (estates, roadmaps, assets) and vice versa.

## Problem Statement
Currently, advisor registration routes users to executor pages (estate creation, roadmap, etc.), creating confusion and a broken user experience. Advisors and executors are fundamentally different user types with different needs and should have completely separate application experiences.

---

## User Stories

### 1. Registration & User Type Selection

**1.1** As a new user, I want to choose whether I'm registering as an Executor or an Advisor during signup, so I'm directed to the appropriate onboarding flow.

**1.2** As an advisor registering, I want to be taken directly to advisor onboarding (not estate creation), so I can set up my professional profile.

**1.3** As an executor registering, I want to be taken to estate creation (current flow), so I can start managing my estate.

### 2. Advisor Onboarding Flow

**2.1** As a new advisor, I want to complete my professional profile first (bio, expertise, hourly rate, license), so I can establish my credentials before connecting payment.

**2.2** As a new advisor, I want to upload my professional license document, so I can get verified on the platform.

**2.3** As a new advisor, I want to connect my Stripe account for payouts after completing my profile, so I can receive payments for consultations.

**2.4** As a new advisor, I want clear visual feedback on my onboarding progress (Step 1: Profile, Step 2: Stripe), so I know what's required to start accepting bookings.

### 3. Advisor Dashboard

**3.1** As an advisor, I want to see my dashboard with key metrics (total bookings, pending bookings, total earnings, pending earnings), so I can track my business performance.
- Metrics should display as cards with icons and formatted numbers
- Total bookings: count of all bookings (any status)
- Pending bookings: count of bookings with status "pending"
- Total earnings: sum of all booking amounts (formatted as currency)
- Pending earnings: sum of bookings in escrow (not yet paid out)

**3.2** As an advisor, I want to see upcoming sessions with client details and session dates, so I can prepare for consultations.
- Display max 5 upcoming confirmed sessions sorted by date (earliest first)
- Each session shows: client name, estate name, session date/time, booking amount
- Sessions should be clickable to view full booking details
- If no upcoming sessions, show empty state with message

**3.3** As an advisor, I want to see pending booking requests that need my approval, so I can accept or decline consultation requests.
- Display all bookings with status "pending" in a dedicated section
- Each request shows: client name, estate name, requested date/time, amount, request message
- Each request has Accept and Decline buttons inline
- Accept button should be primary/green, Decline button secondary/red
- After action, request should disappear from list with success message

**3.4** As an advisor, I want to see my verification status prominently displayed, so I know if I'm approved to accept bookings.
- Verification status badge at top of dashboard
- Three states: "Pending Verification" (yellow), "Verified" (green), "Not Verified" (red)
- If not verified, show message: "Complete your profile to get verified"
- If pending, show message: "Your profile is under review"
- If verified, show message: "You're verified and can accept bookings"

**3.5** As an advisor, I want quick action buttons to manage my profile and view all bookings, so I can navigate efficiently.
- "Edit Profile" button navigates to `/advisor/profile`
- "View All Bookings" button navigates to `/advisor/bookings`
- "View Earnings" button navigates to `/advisor/earnings`
- Buttons should be clearly visible and accessible

**3.6** As an advisor, I want to see my profile completion status, so I know what information is missing.
- Profile completion percentage displayed as progress bar
- Required fields: bio, expertise (at least 1), hourly rate, license number, license document
- Show checklist of missing items if profile incomplete

**3.7** As an advisor, I want to see recent activity/notifications, so I stay informed about important events.
- Display last 5 activities: new booking requests, booking confirmations, cancellations, payments received
- Each activity shows timestamp and brief description
- Activities should be timestamped (e.g., "2 hours ago", "Yesterday")

### 4. Bookings Management

**4.1** As an advisor, I want to see all my bookings in one place (pending, confirmed, completed, cancelled), so I can manage my schedule.
- Display bookings in a table/list format with columns: Client, Estate, Date/Time, Amount, Status, Actions
- Default sort: upcoming bookings first, then by date descending
- Show booking count for each status in filter tabs
- Pagination if more than 20 bookings

**4.2** As an advisor, I want to filter bookings by status, so I can focus on specific booking types.
- Filter tabs: All, Pending, Confirmed, Completed, Cancelled
- Each tab shows count badge (e.g., "Pending (3)")
- Active tab highlighted visually
- Filter persists when navigating away and back

**4.3** As an advisor, I want to see client information for each booking (name, estate details, session date), so I can prepare appropriately.
- Each booking row shows: client full name, estate name, session date/time, duration (1 hour default)
- Clicking a booking opens detail modal with: client contact info, estate details, booking message, special requests
- Detail modal includes session notes field for advisor to add preparation notes

**4.4** As an advisor, I want to accept or decline pending booking requests, so I can control my schedule.
- Pending bookings show Accept (green) and Decline (red) buttons
- Decline requires reason selection: "Schedule conflict", "Outside expertise", "Other" (with text input)
- Accept shows confirmation: "Booking confirmed! Client will be notified."
- Decline shows confirmation: "Booking declined. Client will be notified."
- Actions trigger email notifications to client

**4.5** As an advisor, I want to mark confirmed bookings as completed after sessions, so my earnings can be processed.
- Confirmed bookings show "Mark Complete" button (only after session date/time has passed)
- Completing requires session notes (mandatory): "Provide brief summary of consultation"
- Completion triggers escrow release countdown (7 days)
- Completion notification sent to client with request for review

**4.6** As an advisor, I want to cancel bookings with a reason if needed, so clients understand cancellations.
- All non-completed bookings show "Cancel" button
- Cancel requires reason: "Emergency", "Illness", "Schedule conflict", "Other" (with text input)
- Cancel shows refund policy: "Client will receive full refund"
- Cancellation triggers immediate refund and email notification

**4.7** As an advisor, I want to see booking history with search capability, so I can find past consultations.
- Search bar filters by client name or estate name
- Search is real-time (filters as you type)
- Clear search button to reset filter

**4.8** As an advisor, I want to export my booking history, so I can maintain records for tax purposes.
- "Export to CSV" button downloads all bookings with: date, client, estate, amount, status, platform fee, net earnings
- Export includes date range selector (last 30 days, last 90 days, last year, custom range)

### 5. Earnings & Payouts

**5.1** As an advisor, I want to see my total earnings, paid earnings, and pending earnings, so I understand my financial status.

**5.2** As an advisor, I want to see a detailed earnings breakdown by booking, so I can track individual session payments.

**5.3** As an advisor, I want to see platform fees (20%) clearly displayed, so I understand the fee structure.

**5.4** As an advisor, I want to see escrow release dates for pending earnings, so I know when funds will be available.

**5.5** As an advisor, I want to see payout status for each booking (escrowed, paid), so I can track payment processing.

### 6. Profile Management

**6.1** As an advisor, I want to edit my professional profile (bio, expertise, hourly rate), so I can keep my information current.

**6.2** As an advisor, I want to update my profile photo, so clients can see a professional image.

**6.3** As an advisor, I want to update my license information if needed, so my credentials stay current.

**6.4** As an advisor, I want to see my marketplace visibility status, so I know if clients can find me.

### 7. Navigation & Layout

**7.1** As an advisor, I want advisor-specific navigation (Dashboard, Bookings, Profile, Earnings), so I can access relevant features.

**7.2** As an advisor, I should NOT see executor navigation (Estates, Roadmap, Assets, Forms), so I'm not confused by irrelevant features.

**7.3** As an executor, I should NOT see advisor navigation, so my experience remains focused on estate management.

**7.4** As a user, I want the navigation to automatically adapt based on my user type, so I always see relevant options.

### 8. Authentication & Routing

**8.1** As an advisor logging in, I want to be redirected to my advisor dashboard (not executor dashboard), so I land on the right page.

**8.2** As an executor logging in, I want to be redirected to my executor dashboard (current behavior), so I can manage my estate.

**8.3** As an advisor, I want to be prevented from accessing executor-only routes, so I don't encounter broken features.

**8.4** As an executor, I want to be prevented from accessing advisor-only routes, so I don't see irrelevant features.

### 9. Marketplace Visibility

**9.1** As an advisor, I want to appear in the marketplace only after I'm verified, so clients see credible professionals.

**9.2** As an advisor, I want my profile to show my verification badge, so clients trust my credentials.

**9.3** As an advisor, I want my expertise tags to be searchable, so clients can find me by specialty.

**9.4** As an advisor, I want my hourly rate displayed clearly, so clients know my pricing upfront.

---

## Acceptance Criteria

### Registration Flow
- [ ] Registration page includes user type selection (Executor vs Advisor)
- [ ] Advisor registration routes to `/advisor/onboarding`
- [ ] Executor registration routes to `/onboarding` (estate creation)
- [ ] User type is stored in database and auth context

### Advisor Onboarding
- [ ] Step 1 (Profile) is always enabled and appears first
- [ ] Step 2 (Stripe) is disabled until profile has bio
- [ ] Profile form includes: bio, expertise, hourly rate, license number, license document upload, profile photo
- [ ] Document upload converts files to base64 and stores in database
- [ ] Stripe Connect integration creates account and generates onboarding link
- [ ] Completion message appears when both steps are done

### Advisor Dashboard
- [ ] Shows 4 key metrics: total bookings, pending bookings, total earnings, pending earnings
- [ ] Shows upcoming sessions list (max 5) with client name, estate, date
- [ ] Shows pending booking requests with accept/decline actions
- [ ] Shows verification status badge
- [ ] Includes navigation to Profile and All Bookings

### Bookings Page
- [ ] Lists all bookings with status filters
- [ ] Shows client info, session date, amount, status for each booking
- [ ] Pending bookings have Accept/Decline buttons
- [ ] Confirmed bookings have Mark Complete button
- [ ] All bookings have Cancel button with reason input
- [ ] Booking actions update status in real-time

### Earnings Page
- [ ] Shows summary: total, paid, pending earnings
- [ ] Shows platform fee percentage (20%)
- [ ] Lists all bookings with earnings breakdown
- [ ] Shows escrow release dates for pending payments
- [ ] Shows payout status for each booking

### Profile Page
- [ ] Allows editing all profile fields
- [ ] Shows current verification status
- [ ] Allows profile photo upload
- [ ] Allows license document re-upload
- [ ] Shows marketplace visibility status

### Navigation
- [ ] Advisors see: Dashboard, Bookings, Profile, Earnings
- [ ] Executors see: Dashboard, Roadmap, Assets, Forms, etc.
- [ ] Navigation adapts automatically based on user type
- [ ] No cross-contamination of navigation items

### Authentication & Routing
- [ ] Login redirects advisors to `/advisor/dashboard`
- [ ] Login redirects executors to `/dashboard`
- [ ] Advisor routes protected with advisor-only middleware
- [ ] Executor routes protected with executor-only middleware
- [ ] Unauthorized access returns 403 or redirects appropriately

---

## Technical Requirements

### Database Schema
- Add `userType` field to User model (EXECUTOR | ADVISOR)
- AdvisorProfile model already exists with required fields
- Ensure `licenseDocument` field exists for document storage

### API Endpoints
- `POST /api/auth/register` - Add userType parameter
- `GET /api/advisors/me` - Return null if no profile (no 404)
- `POST /api/advisors/profile` - Create/update advisor profile
- `POST /api/advisors/stripe/connect/onboard` - Auto-create profile if needed
- `GET /api/advisors/stripe/connect/status` - Return proper status fields
- `GET /api/advisors/dashboard/stats` - Return dashboard metrics
- `GET /api/advisors/dashboard/earnings` - Return earnings breakdown
- `GET /api/bookings/advisor` - Return advisor's bookings
- `POST /api/bookings/:id/accept` - Accept booking
- `POST /api/bookings/:id/decline` - Decline booking
- `POST /api/bookings/:id/complete` - Mark booking complete
- `POST /api/bookings/:id/cancel` - Cancel booking

### Frontend Routes
- `/register` - User type selection
- `/advisor/onboarding` - Advisor onboarding flow
- `/advisor/dashboard` - Advisor dashboard
- `/advisor/bookings` - Bookings management
- `/advisor/profile` - Profile editing
- `/advisor/earnings` - Earnings breakdown

### Auth Context
- Track `userType` in auth context
- Provide `isAdvisor` and `isExecutor` helper functions
- Handle routing based on user type after login

---

## Out of Scope
- Multi-role users (someone who is both executor and advisor)
- Advisor calendar/scheduling integration
- Video call integration for consultations
- Advisor reviews/ratings (already exists)
- Automated payout processing (handled by Stripe)

---

## Success Metrics
- Advisors complete onboarding without seeing executor pages
- 0% of advisors land on executor dashboard after login
- Advisor dashboard loads with correct metrics
- Bookings can be accepted/declined successfully
- Earnings display correctly with escrow dates
- Navigation shows only relevant items for each user type
