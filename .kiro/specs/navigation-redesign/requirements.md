# Navigation Redesign - Requirements Document

**Feature Name:** navigation-redesign  
**Created:** January 24, 2026  
**Status:** Draft  
**Priority:** Critical (Phase 1)

---

## 1. Executive Summary

The current navigation structure is confusing and doesn't reflect the natural mental model of estate settlement. Users don't understand where to find things, what each section does, or what order to complete tasks. This redesign will create a phase-based navigation that guides users through the estate settlement journey with clarity and confidence.

---

## 2. Problem Statement

### Current Issues

**Navigation Confusion:**
- 7 navigation items with no clear hierarchy or grouping
- Items like "Discovery" vs "Upload Document" have unclear distinctions
- Critical sections like "Probate Hub" are buried
- No indication of which sections are required vs optional
- Users don't know what to do first or in what order

**Lack of Context:**
- No breadcrumbs or "You are here" indicators
- Missing tooltips or help text
- No progress tracking across the navigation
- Can't see which sections are complete vs incomplete

**Poor Information Architecture:**
- Navigation doesn't match the user's mental model of estate settlement
- No logical grouping of related features
- Missing quick actions for common tasks
- No way to jump to urgent items

### User Pain Points

**From Executor Perspective:**
> "I logged in and saw all these menu items. I didn't know if I should go to Discovery first, or Probate, or just add assets. It was overwhelming."

**From Attorney Perspective:**
> "My clients call me asking 'What's the difference between Discovery and Upload Document?' I don't even know how to explain it clearly."

**From First-Time User:**
> "I just want to know: What do I do first? What do I do next? The navigation doesn't tell me."

---

## 3. Goals & Success Metrics

### Primary Goals

1. **Reduce cognitive load** - Users should instantly understand where to go
2. **Guide the journey** - Navigation should reflect the natural estate settlement phases
3. **Provide context** - Users should always know where they are and what's next
4. **Enable quick access** - Common actions should be 1-2 clicks away

### Success Metrics

**Quantitative:**
- Reduce "time to first action" by 50% (from 3 minutes to 90 seconds)
- Increase navigation click-through rate by 40%
- Reduce support tickets about "where to find X" by 60%
- Increase feature discovery by 35%

**Qualitative:**
- Users can explain what each navigation item does
- 90% of users complete onboarding without help
- Users report feeling "guided" rather than "lost"
- Reduced anxiety and increased confidence

---

## 4. User Stories & Acceptance Criteria

### User Story 1: Phase-Based Navigation
**As an** executor  
**I want** navigation organized by estate settlement phases  
**So that** I understand what to do first, second, and third

**Acceptance Criteria:**
- [ ] Navigation is grouped into 4 clear phases: Setup → Discovery → Settlement → Close
- [ ] Each phase has a clear icon and label
- [ ] Current phase is visually highlighted
- [ ] Completed phases show checkmark indicator
- [ ] Future phases are accessible but visually de-emphasized
- [ ] Phase names use plain language (not legal jargon)

### User Story 2: Contextual Help
**As a** first-time user  
**I want** tooltips and help text for each navigation item  
**So that** I understand what each section does before clicking

**Acceptance Criteria:**
- [ ] Every navigation item has a tooltip on hover
- [ ] Tooltips explain what the section does in 1-2 sentences
- [ ] Tooltips include example use cases
- [ ] Help icon (?) available for more detailed explanations
- [ ] Tooltips are accessible (keyboard navigation, screen readers)

### User Story 3: Progress Indicators
**As an** executor managing multiple assets  
**I want** to see my progress in the navigation  
**So that** I know how much work is left

**Acceptance Criteria:**
- [ ] Navigation shows completion percentage per phase
- [ ] Visual progress bar or indicator for overall estate progress
- [ ] Badge counts for pending items (e.g., "3 assets need attention")
- [ ] Color coding: green (complete), amber (in progress), gray (not started)
- [ ] Progress updates in real-time as tasks are completed

### User Story 4: Quick Actions
**As an** executor working on urgent tasks  
**I want** quick access to common actions  
**So that** I don't have to navigate through multiple pages

**Acceptance Criteria:**
- [ ] "Quick Actions" menu accessible from anywhere (keyboard shortcut: Cmd/Ctrl + K)
- [ ] Common actions: Add Asset, Log Communication, Upload Document, View Follow-ups
- [ ] Search functionality to find assets, communications, documents
- [ ] Recently viewed items for quick return
- [ ] Keyboard shortcuts for power users

### User Story 5: Mobile Navigation
**As an** executor on-the-go  
**I want** mobile-optimized navigation  
**So that** I can manage the estate from my phone

**Acceptance Criteria:**
- [ ] Bottom navigation bar on mobile (< 768px)
- [ ] 4-5 primary items in bottom nav
- [ ] Hamburger menu for secondary items
- [ ] Touch-friendly targets (min 44x44px)
- [ ] Swipe gestures for navigation
- [ ] Persistent "Add" button (floating action button)

### User Story 6: Breadcrumbs & Context
**As an** executor deep in the application  
**I want** to know where I am and how to get back  
**So that** I don't feel lost

**Acceptance Criteria:**
- [ ] Breadcrumb trail on every page (Home > Assets > Fidelity 401k)
- [ ] Breadcrumbs are clickable for quick navigation
- [ ] Current page title is prominent and clear
- [ ] "Back" button always available
- [ ] Page context shows related information (e.g., "Part of Settlement Phase")

### User Story 7: Onboarding Wizard
**As a** new user  
**I want** a guided setup wizard  
**So that** I complete the essential setup steps

**Acceptance Criteria:**
- [ ] Wizard appears on first login
- [ ] 4-step wizard: Estate Info → Upload Death Certificate → Add First Asset → Review Dashboard
- [ ] Progress indicator shows "Step 2 of 4"
- [ ] Can skip wizard but prompted to complete later
- [ ] Wizard can be restarted from settings
- [ ] Completion tracked and celebrated

### User Story 8: Notification Center
**As an** executor with pending actions  
**I want** a notification center in the navigation  
**So that** I see what needs my attention

**Acceptance Criteria:**
- [ ] Bell icon in navigation with badge count
- [ ] Notifications grouped by type: Urgent, Follow-ups, Updates
- [ ] Click notification to jump to relevant page
- [ ] Mark as read/unread functionality
- [ ] Clear all notifications option
- [ ] Notification preferences (email, in-app, SMS)

---

## 5. Proposed Navigation Structure

### Phase-Based Navigation (Primary)

```
┌─────────────────────────────────────────────────────────┐
│  ExpectedEstate Logo    [Search]  [Notifications]  [User]│
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PHASE 1: SETUP ✓                                │   │
│  │  ├─ Dashboard                                     │   │
│  │  ├─ Estate Profile                                │   │
│  │  └─ Probate Hub                                   │   │
│  │                                                    │   │
│  │  PHASE 2: DISCOVERY (Current) ⚡                  │   │
│  │  ├─ Asset Inventory (12 assets)                   │   │
│  │  ├─ Document Scanner                              │   │
│  │  └─ Asset Detective                               │   │
│  │                                                    │   │
│  │  PHASE 3: SETTLEMENT                              │   │
│  │  ├─ Active Assets (8 in progress)                 │   │
│  │  ├─ Communications (23 logged)                    │   │
│  │  ├─ Document Vault                                │   │
│  │  └─ Follow-ups (3 pending) 🔔                     │   │
│  │                                                    │   │
│  │  PHASE 4: CLOSE                                   │   │
│  │  ├─ Final Distribution                            │   │
│  │  ├─ Tax Documents                                 │   │
│  │  └─ Close Estate                                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  ─────────────────────────────────────────────────────  │
│                                                           │
│  QUICK ACTIONS                                            │
│  ├─ ➕ Add Asset                                         │
│  ├─ 📝 Log Communication                                 │
│  ├─ 📄 Upload Document                                   │
│  └─ 🔍 Search Everything                                 │
│                                                           │
│  RESOURCES                                                │
│  ├─ 📚 Help Center                                       │
│  ├─ 💬 Contact Support                                   │
│  └─ ⚙️ Settings                                          │
└─────────────────────────────────────────────────────────┘
```

### Mobile Navigation (Bottom Bar)

```
┌─────────────────────────────────────────────────────────┐
│                    Page Content                          │
│                                                           │
│                                                           │
├─────────────────────────────────────────────────────────┤
│  [🏠 Home]  [📊 Assets]  [➕]  [📋 Tasks]  [👤 More]   │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Detailed Requirements

### 6.1 Phase Definitions

#### Phase 1: Setup (Foundation)
**Purpose:** Establish the estate profile and legal foundation

**Sections:**
- **Dashboard** - Overview and next actions
- **Estate Profile** - Deceased info, executor details, jurisdiction
- **Probate Hub** - Legal status, court filings, authority documents

**Completion Criteria:**
- Estate profile 100% complete
- Death certificate uploaded
- Probate status determined (full probate vs small estate)

**Visual Indicator:** Green checkmark when complete

---

#### Phase 2: Discovery (Asset Identification)
**Purpose:** Find and catalog all estate assets

**Sections:**
- **Asset Inventory** - List of all discovered assets
- **Document Scanner** - AI-powered document analysis
- **Asset Detective** - Find hidden assets from documents

**Completion Criteria:**
- At least 1 asset added
- All known assets cataloged
- Asset discovery marked as "complete"

**Visual Indicator:** Lightning bolt (⚡) when active, checkmark when complete

---

#### Phase 3: Settlement (Asset Processing)
**Purpose:** Contact institutions and process each asset

**Sections:**
- **Active Assets** - Assets currently being processed
- **Communications** - Log of all institution contacts
- **Document Vault** - Centralized document storage
- **Follow-ups** - Pending actions and reminders

**Completion Criteria:**
- All assets moved to "Approved" or "Distributed" status
- All required communications logged
- All follow-ups resolved

**Visual Indicator:** Progress percentage (e.g., "67% complete")

---

#### Phase 4: Close (Final Distribution)
**Purpose:** Distribute assets and close the estate

**Sections:**
- **Final Distribution** - Track asset distributions to beneficiaries
- **Tax Documents** - Estate tax returns and filings
- **Close Estate** - Final checklist and closure

**Completion Criteria:**
- All assets distributed
- Tax documents filed
- Estate officially closed

**Visual Indicator:** Trophy icon when complete

---

### 6.2 Navigation Behavior

#### Collapsible Sections
- Each phase can be expanded/collapsed
- Current phase is expanded by default
- User preference is saved (localStorage)
- Keyboard shortcuts: Arrow keys to navigate, Enter to expand/collapse

#### Active State Indicators
- Current page has blue left border (4px)
- Current page has blue background (primary/10)
- Current page text is bold
- Hover state: gray background (slate-100)

#### Badge Counts
- Show pending item counts in parentheses
- Examples: "Follow-ups (3)", "Active Assets (8)"
- Badges are color-coded: red (urgent), amber (attention needed), blue (info)
- Clicking badge filters to show only those items

#### Tooltips
- Appear on hover after 500ms delay
- Positioned to the right of navigation item
- Max width: 300px
- Include icon, title, description, and example
- Dismissible with Esc key

---

### 6.3 Quick Actions Menu

**Trigger:** 
- Keyboard shortcut: Cmd/Ctrl + K
- Click "Quick Actions" button in navigation
- Click search icon in header

**Features:**
- Fuzzy search across all content
- Recent items (last 5 viewed)
- Suggested actions based on context
- Keyboard navigation (arrow keys, Enter to select)
- Categories: Assets, Communications, Documents, Settings

**Search Scope:**
- Asset names and institutions
- Communication subjects and content
- Document names and types
- Navigation items and pages

---

### 6.4 Notification Center

**Location:** Bell icon in top-right header

**Notification Types:**
1. **Urgent** (red badge)
   - Asset needs immediate attention (30+ days no contact)
   - Document expiring soon
   - Court deadline approaching

2. **Follow-ups** (amber badge)
   - Institution follow-up due (14+ days)
   - Communication response expected
   - Document upload reminder

3. **Updates** (blue badge)
   - Asset status changed
   - New document uploaded
   - System updates

**Notification Actions:**
- Click to view details
- Mark as read/unread
- Snooze for later
- Dismiss permanently

---

### 6.5 Breadcrumb Navigation

**Format:** `Home > Phase > Section > Page`

**Examples:**
- `Home > Discovery > Asset Inventory`
- `Home > Settlement > Active Assets > Fidelity 401k`
- `Home > Setup > Probate Hub`

**Behavior:**
- Each segment is clickable
- Current page is not clickable (plain text)
- Truncate long names with ellipsis
- Show full name on hover

---

### 6.6 Mobile Navigation

**Bottom Navigation Bar (< 768px):**

**Primary Items (5):**
1. **Home** (🏠) - Dashboard
2. **Assets** (📊) - Asset Inventory
3. **Add** (➕) - Quick add menu (floating action button)
4. **Tasks** (📋) - Follow-ups and pending actions
5. **More** (👤) - Hamburger menu with all other items

**Hamburger Menu Contents:**
- All secondary navigation items
- Quick actions
- Settings
- Help & support
- Sign out

**Floating Action Button (FAB):**
- Positioned center-bottom (overlaps nav bar)
- Opens quick add menu: Add Asset, Log Communication, Upload Document
- Animated expand/collapse
- Accessible label for screen readers

---

### 6.7 Onboarding Wizard

**Step 1: Welcome**
- Empathetic message: "We're sorry for your loss. We're here to help."
- Brief explanation of what ExpectedEstate does
- Option to skip wizard (not recommended)

**Step 2: Estate Profile**
- Deceased person information
- Executor details
- State/jurisdiction
- Upload death certificate

**Step 3: Probate Status**
- Determine if probate is required
- Explain small estate vs full probate
- Set probate status

**Step 4: First Asset**
- Add first asset (guided)
- Explain asset tracking
- Show where to find asset details

**Step 5: Dashboard Tour**
- Highlight key dashboard sections
- Explain navigation structure
- Show where to get help

**Completion:**
- Celebration message: "Great start! You've completed the essential setup."
- Show progress: "You're 20% through the estate settlement process"
- Suggest next action: "Next, let's add more assets to your inventory"

---

## 7. Technical Requirements

### 7.1 Component Structure

```typescript
// Navigation component hierarchy
<Navigation>
  <NavigationHeader>
    <Logo />
    <SearchButton />
    <NotificationCenter />
    <UserMenu />
  </NavigationHeader>
  
  <NavigationSidebar>
    <PhaseSection phase="setup" />
    <PhaseSection phase="discovery" />
    <PhaseSection phase="settlement" />
    <PhaseSection phase="close" />
    
    <Divider />
    
    <QuickActions />
    <Resources />
  </NavigationSidebar>
  
  <MobileNavigation>
    <BottomNavBar />
    <FloatingActionButton />
  </MobileNavigation>
</Navigation>
```

### 7.2 State Management

**Navigation State:**
```typescript
interface NavigationState {
  currentPhase: 'setup' | 'discovery' | 'settlement' | 'close';
  currentPage: string;
  expandedPhases: string[];
  recentItems: RecentItem[];
  notifications: Notification[];
  unreadCount: number;
}
```

**Phase Progress:**
```typescript
interface PhaseProgress {
  phase: string;
  completed: boolean;
  percentage: number;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
}
```

### 7.3 Responsive Breakpoints

- **Desktop:** > 1024px - Full sidebar navigation
- **Tablet:** 768px - 1024px - Collapsible sidebar
- **Mobile:** < 768px - Bottom navigation bar

### 7.4 Accessibility Requirements

- **Keyboard Navigation:**
  - Tab through all navigation items
  - Arrow keys to navigate within sections
  - Enter/Space to activate items
  - Esc to close menus/tooltips

- **Screen Reader Support:**
  - ARIA labels for all navigation items
  - ARIA live regions for notifications
  - Semantic HTML (nav, ul, li)
  - Skip navigation link

- **Focus Management:**
  - Visible focus indicators
  - Focus trap in modals/menus
  - Return focus after closing menus

### 7.5 Performance Requirements

- Navigation renders in < 100ms
- Smooth animations (60fps)
- Lazy load secondary navigation items
- Cache navigation state in localStorage
- Debounce search input (300ms)

---

## 8. Design Specifications

### 8.1 Visual Design

**Sidebar Width:**
- Desktop: 280px (expanded), 64px (collapsed)
- Tablet: 240px (expanded), overlay when open
- Mobile: Full width overlay or bottom bar

**Colors:**
- Active item: `bg-primary/10`, `border-l-primary`
- Hover: `bg-slate-100`
- Badge (urgent): `bg-red-500`
- Badge (attention): `bg-amber-500`
- Badge (info): `bg-blue-500`

**Typography:**
- Phase headers: `text-xs font-bold uppercase tracking-wider text-slate-400`
- Navigation items: `text-sm font-medium text-slate-700`
- Badge counts: `text-xs font-bold`

**Spacing:**
- Phase sections: `mb-6`
- Navigation items: `py-2 px-4`
- Icon-text gap: `gap-3`

### 8.2 Icons

**Phase Icons:**
- Setup: `⚙️` (Settings/Gear)
- Discovery: `🔍` (Magnifying Glass)
- Settlement: `📋` (Clipboard)
- Close: `🏆` (Trophy)

**Navigation Icons:**
- Dashboard: `LayoutDashboard`
- Assets: `Landmark`
- Documents: `FileText`
- Communications: `MessageSquare`
- Follow-ups: `Bell`
- Settings: `Settings`

### 8.3 Animations

**Expand/Collapse:**
- Duration: 200ms
- Easing: `ease-in-out`
- Transform: `height` (use max-height for smooth animation)

**Hover Effects:**
- Duration: 150ms
- Easing: `ease-out`
- Properties: `background-color`, `border-color`

**Badge Pulse:**
- Urgent items pulse every 2 seconds
- Animation: `scale(1) → scale(1.1) → scale(1)`
- Duration: 600ms

---

## 9. User Flows

### Flow 1: First-Time User Setup

```
1. User logs in for first time
   ↓
2. Onboarding wizard appears
   ↓
3. User completes 5-step wizard
   ↓
4. Dashboard loads with "Setup" phase highlighted
   ↓
5. Tooltip appears: "Great! Now let's add more assets"
   ↓
6. User clicks "Asset Inventory" in Discovery phase
   ↓
7. Asset list page loads with "Add Asset" button prominent
```

### Flow 2: Returning User - Quick Action

```
1. User logs in
   ↓
2. Dashboard loads with notification badge (3)
   ↓
3. User presses Cmd+K (Quick Actions)
   ↓
4. Search menu opens
   ↓
5. User types "Fidelity"
   ↓
6. Search results show Fidelity 401k asset
   ↓
7. User presses Enter
   ↓
8. Asset detail page loads
```

### Flow 3: Mobile User - Add Asset

```
1. User opens app on mobile
   ↓
2. Bottom navigation bar visible
   ↓
3. User taps center "+" button (FAB)
   ↓
4. Quick add menu expands
   ↓
5. User taps "Add Asset"
   ↓
6. Add asset form loads (mobile-optimized)
   ↓
7. User fills form and saves
   ↓
8. Returns to asset inventory with success message
```

---

## 10. Edge Cases & Error Handling

### Edge Case 1: No Assets Yet
**Scenario:** User completes setup but hasn't added any assets

**Handling:**
- Discovery phase shows "0 assets" badge
- Dashboard shows prominent "Add Your First Asset" CTA
- Navigation tooltip explains: "Start by adding assets to your inventory"

### Edge Case 2: All Phases Complete
**Scenario:** User has completed all phases

**Handling:**
- All phases show green checkmarks
- Navigation shows "Estate Complete" badge
- Dashboard shows celebration message
- "Close Estate" section becomes prominent

### Edge Case 3: Stuck in Phase
**Scenario:** User hasn't progressed in 30+ days

**Handling:**
- Navigation shows "Need help?" badge
- Tooltip offers: "Looks like you're stuck. Contact support?"
- Dashboard shows "Getting Stuck?" help card

### Edge Case 4: Multiple Estates (Future)
**Scenario:** Attorney managing multiple estates

**Handling:**
- Estate switcher in header
- Navigation shows current estate name
- Quick switch between estates (Cmd+Shift+E)

---

## 11. Testing Requirements

### Unit Tests
- [ ] Navigation renders correctly for each phase
- [ ] Badge counts update when data changes
- [ ] Tooltips appear/disappear correctly
- [ ] Keyboard navigation works
- [ ] Mobile navigation switches at correct breakpoint

### Integration Tests
- [ ] Navigation state persists across page loads
- [ ] Clicking navigation items navigates correctly
- [ ] Search functionality returns correct results
- [ ] Notifications update in real-time
- [ ] Breadcrumbs reflect current location

### E2E Tests
- [ ] Complete onboarding wizard flow
- [ ] Navigate through all phases
- [ ] Use quick actions to add asset
- [ ] Mobile navigation works on real device
- [ ] Accessibility audit passes (Lighthouse)

### User Testing
- [ ] 5 executors complete onboarding without help
- [ ] Users can explain what each phase does
- [ ] Users find specific pages in < 30 seconds
- [ ] Mobile users can complete core tasks
- [ ] Users report feeling "guided" not "lost"

---

## 12. Open Questions

1. **Phase Naming:** Should we use "Setup, Discovery, Settlement, Close" or different names?
   - Alternative: "Start, Find, Process, Finish"
   - Alternative: "Foundation, Inventory, Resolution, Completion"

2. **Notification Persistence:** How long should notifications stay visible?
   - Option A: Until dismissed
   - Option B: Auto-dismiss after 7 days
   - Option C: Archive after 30 days

3. **Mobile FAB Position:** Center or right-aligned?
   - Center: More prominent, follows Material Design
   - Right: Doesn't overlap nav bar, easier for right-handed users

4. **Search Scope:** Should search include communication content or just titles?
   - Full content: More comprehensive but slower
   - Titles only: Faster but less useful

5. **Phase Progression:** Should phases auto-advance or require manual progression?
   - Auto: System determines when phase is complete
   - Manual: User marks phase as complete

---

## 13. Dependencies

### Internal Dependencies
- Dashboard component (needs to show phase progress)
- Asset list component (needs to show counts)
- Notification system (needs to be built)
- Search functionality (needs to be implemented)

### External Dependencies
- React Router (for navigation)
- Framer Motion (for animations)
- Radix UI (for accessible components)
- Tailwind CSS (for styling)

### Data Dependencies
- Estate data (phase progress calculation)
- Asset data (counts and statuses)
- Communication data (notification generation)
- User preferences (navigation state persistence)

---

## 14. Success Criteria

### Must Have (MVP)
- ✅ Phase-based navigation structure
- ✅ Tooltips on all navigation items
- ✅ Badge counts for pending items
- ✅ Mobile bottom navigation
- ✅ Breadcrumb navigation
- ✅ Basic onboarding wizard

### Should Have (V1.1)
- ✅ Quick actions menu (Cmd+K)
- ✅ Notification center
- ✅ Search functionality
- ✅ Progress indicators per phase
- ✅ Keyboard shortcuts

### Nice to Have (V1.2)
- ✅ Recent items tracking
- ✅ Customizable navigation order
- ✅ Dark mode support
- ✅ Navigation analytics
- ✅ Guided tours for each phase

---

## 15. Rollout Plan

### Phase 1: Internal Testing (Week 1)
- Build navigation components
- Test with internal team
- Gather feedback and iterate

### Phase 2: Beta Testing (Week 2)
- Release to 10 beta users
- Monitor usage analytics
- Conduct user interviews

### Phase 3: Gradual Rollout (Week 3)
- Release to 25% of users
- Monitor error rates and feedback
- Fix critical issues

### Phase 4: Full Release (Week 4)
- Release to 100% of users
- Announce new navigation in email
- Create help documentation

---

## 16. Documentation Needs

- [ ] User guide: "Understanding the Navigation"
- [ ] Video tutorial: "Getting Started with ExpectedEstate"
- [ ] Help article: "Keyboard Shortcuts"
- [ ] Help article: "Using Quick Actions"
- [ ] Developer docs: "Navigation Component API"

---

## Appendix A: User Research Findings

**Interview Quotes:**

> "I didn't know where to start. The navigation just showed me a bunch of options but didn't tell me which one to click first." - Executor, Age 52

> "I kept going back and forth between Discovery and Upload Document. I still don't understand the difference." - Executor, Age 45

> "The Probate Hub is super important but it's buried in the navigation. I almost missed it." - Attorney, Age 38

> "On my phone, the sidebar takes up the whole screen. I can't see anything else." - Executor, Age 61

> "I wish there was a search bar. I have 20 assets and I can't find the one I'm looking for." - Executor, Age 43

---

## Appendix B: Competitive Analysis

**Everplans:**
- Uses simple top navigation: Dashboard, Documents, Contacts, Vault
- Pros: Clean and simple
- Cons: Doesn't guide users through process

**Trust & Will:**
- Uses wizard-style navigation for document creation
- Pros: Very guided, hard to get lost
- Cons: Feels restrictive, can't jump around

**Cake:**
- Uses sidebar with categories: Planning, Legal, Financial
- Pros: Good organization
- Cons: Not specific to estate settlement process

**Our Approach:**
- Combine best of all: Phase-based structure (guided) + flexible navigation (not restrictive) + clear categories (organized)

---

**End of Requirements Document**
