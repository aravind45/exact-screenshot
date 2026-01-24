# Navigation Redesign - Design Document

**Feature Name:** navigation-redesign  
**Created:** January 24, 2026  
**Status:** Draft  
**Version:** 1.0

---

## 1. Design Overview

This document specifies the detailed design for the navigation redesign, including component architecture, visual specifications, interaction patterns, and implementation guidelines.

### Design Principles

1. **Progressive Disclosure** - Show what's needed now, hide what's not
2. **Clear Hierarchy** - Visual weight matches importance
3. **Contextual Guidance** - Help users understand where they are and what's next
4. **Accessibility First** - Keyboard, screen reader, and mobile support
5. **Performance** - Fast, smooth, responsive

---

## 2. Component Architecture

### 2.1 Component Tree

```
<AppLayout>
  ├── <NavigationProvider>
  │   ├── <DesktopNavigation>
  │   │   ├── <NavigationHeader />
  │   │   └── <NavigationSidebar>
  │   │       ├── <PhaseSection phase="setup" />
  │   │       ├── <PhaseSection phase="discovery" />
  │   │       ├── <PhaseSection phase="settlement" />
  │   │       ├── <PhaseSection phase="close" />
  │   │       ├── <QuickActionsSection />
  │   │       └── <ResourcesSection />
  │   │   </NavigationSidebar>
  │   │
  │   ├── <MobileNavigation>
  │   │   ├── <BottomNavBar />
  │   │   └── <FloatingActionButton />
  │   │
  │   ├── <QuickActionsMenu />
  │   ├── <NotificationCenter />
  │   └── <OnboardingWizard />
  │
  └── <PageContent>
      ├── <Breadcrumbs />
      └── {children}
</AppLayout>
```

### 2.2 Core Components



#### NavigationProvider

**Purpose:** Manages navigation state and provides context to all navigation components

**State:**
```typescript
interface NavigationState {
  currentPhase: Phase;
  currentPage: string;
  expandedPhases: Phase[];
  recentItems: RecentItem[];
  notifications: Notification[];
  searchQuery: string;
  isQuickActionsOpen: boolean;
  isNotificationCenterOpen: boolean;
}

type Phase = 'setup' | 'discovery' | 'settlement' | 'close';

interface RecentItem {
  id: string;
  type: 'asset' | 'communication' | 'document';
  title: string;
  url: string;
  timestamp: Date;
}

interface Notification {
  id: string;
  type: 'urgent' | 'follow-up' | 'update';
  title: string;
  message: string;
  actionUrl: string;
  read: boolean;
  createdAt: Date;
}
```

**Methods:**
```typescript
interface NavigationContextValue {
  state: NavigationState;
  setCurrentPhase: (phase: Phase) => void;
  togglePhase: (phase: Phase) => void;
  addRecentItem: (item: RecentItem) => void;
  markNotificationRead: (id: string) => void;
  openQuickActions: () => void;
  closeQuickActions: () => void;
}
```



#### PhaseSection Component

**Props:**
```typescript
interface PhaseSectionProps {
  phase: Phase;
  title: string;
  icon: React.ComponentType;
  items: NavigationItem[];
  progress?: PhaseProgress;
  isExpanded?: boolean;
  onToggle?: () => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  badge?: number;
  badgeType?: 'urgent' | 'attention' | 'info';
  tooltip?: string;
  isActive?: boolean;
}

interface PhaseProgress {
  completed: boolean;
  percentage: number;
  pendingCount: number;
}
```

**Visual States:**
- **Collapsed:** Shows only phase header with icon and title
- **Expanded:** Shows phase header + all navigation items
- **Active:** Current phase is highlighted with primary color
- **Complete:** Shows checkmark icon, green accent

**Example Usage:**
```tsx
<PhaseSection
  phase="discovery"
  title="Discovery"
  icon={Search}
  items={[
    {
      id: 'asset-inventory',
      label: 'Asset Inventory',
      icon: Landmark,
      path: '/assets',
      badge: 12,
      badgeType: 'info',
      tooltip: 'View and manage all discovered assets'
    },
    {
      id: 'document-scanner',
      label: 'Document Scanner',
      icon: FileSearch,
      path: '/upload',
      tooltip: 'Upload documents to extract asset information'
    }
  ]}
  progress={{
    completed: false,
    percentage: 65,
    pendingCount: 3
  }}
  isExpanded={true}
/>
```



#### QuickActionsMenu Component

**Purpose:** Command palette for quick navigation and actions

**Features:**
- Fuzzy search across all content
- Keyboard navigation (arrow keys, Enter)
- Recent items section
- Suggested actions based on context
- Keyboard shortcut: Cmd/Ctrl + K

**Props:**
```typescript
interface QuickActionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  recentItems: RecentItem[];
  searchResults: SearchResult[];
  onSearch: (query: string) => void;
  onSelect: (item: SearchResult) => void;
}

interface SearchResult {
  id: string;
  type: 'asset' | 'communication' | 'document' | 'page';
  title: string;
  subtitle?: string;
  icon: React.ComponentType;
  url: string;
  relevance: number;
}
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  🔍 Search everything...                            │
├─────────────────────────────────────────────────────┤
│  RECENT                                              │
│  📊 Fidelity 401k                                   │
│  📝 Communication with Chase Bank                   │
│  📄 Death Certificate                               │
├─────────────────────────────────────────────────────┤
│  QUICK ACTIONS                                       │
│  ➕ Add Asset                                       │
│  📝 Log Communication                               │
│  📄 Upload Document                                 │
├─────────────────────────────────────────────────────┤
│  SUGGESTED                                           │
│  🔔 3 assets need follow-up                         │
│  📋 Complete probate setup                          │
└─────────────────────────────────────────────────────┘
```



#### NotificationCenter Component

**Props:**
```typescript
interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
}

interface Notification {
  id: string;
  type: 'urgent' | 'follow-up' | 'update';
  title: string;
  message: string;
  actionUrl: string;
  read: boolean;
  createdAt: Date;
  metadata?: {
    assetId?: string;
    assetName?: string;
    daysSinceContact?: number;
  };
}
```

**Visual Design:**
- Dropdown panel positioned below bell icon
- Max height: 500px with scroll
- Grouped by type: Urgent → Follow-ups → Updates
- Each notification has icon, title, message, timestamp
- Unread notifications have blue dot indicator
- Hover state shows action button

**Notification Types:**

1. **Urgent (Red):**
   - Asset needs immediate attention (30+ days)
   - Document expiring soon
   - Court deadline approaching

2. **Follow-up (Amber):**
   - Institution follow-up due (14+ days)
   - Communication response expected
   - Document upload reminder

3. **Update (Blue):**
   - Asset status changed
   - New document uploaded
   - System updates

---

#### Breadcrumbs Component

**Props:**
```typescript
interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  maxItems?: number;
}

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType;
}
```

**Behavior:**
- Auto-generate from current route
- Truncate long labels with ellipsis (max 30 chars)
- Show full label on hover
- Last item is not clickable (current page)
- Collapse middle items if > 4 levels

**Example:**
```tsx
<Breadcrumbs
  items={[
    { label: 'Home', path: '/dashboard', icon: Home },
    { label: 'Settlement', path: '/settlement' },
    { label: 'Active Assets', path: '/settlement/assets' },
    { label: 'Fidelity 401k' } // Current page, no path
  ]}
  separator={<ChevronRight className="w-4 h-4" />}
  maxItems={4}
/>
```

---

#### MobileNavigation Components

**BottomNavBar:**
```typescript
interface BottomNavBarProps {
  items: BottomNavItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
}

interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  badge?: number;
}
```

**FloatingActionButton:**
```typescript
interface FloatingActionButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  actions: QuickAction[];
  onActionClick: (action: QuickAction) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType;
  action: () => void;
}
```

**Visual Design:**
- Bottom bar: Fixed position, height 64px
- FAB: 56x56px circle, positioned center-bottom
- FAB overlaps bottom bar by 28px
- Expanded menu shows above FAB
- Backdrop dims content when expanded

---

## 3. Visual Design Specifications

### 3.1 Layout & Spacing

**Desktop Sidebar:**
- Width: 280px (expanded), 64px (collapsed)
- Padding: 24px (top/bottom), 16px (left/right)
- Phase section spacing: 24px between sections
- Navigation item height: 40px
- Icon size: 20x20px
- Icon-text gap: 12px

**Mobile Bottom Bar:**
- Height: 64px
- Item width: 20% (5 items)
- Icon size: 24x24px
- Label font size: 10px
- Padding: 8px (top/bottom)

**Floating Action Button:**
- Size: 56x56px
- Icon size: 24x24px
- Shadow: 0 4px 12px rgba(0,0,0,0.15)
- Expanded menu item height: 48px

### 3.2 Typography

**Phase Headers:**
```css
font-size: 11px;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.05em;
color: #64748B; /* slate-500 */
```

**Navigation Items:**
```css
font-size: 14px;
font-weight: 500;
color: #334155; /* slate-700 */
```

**Badge Counts:**
```css
font-size: 11px;
font-weight: 700;
color: #FFFFFF;
background: varies by type;
padding: 2px 6px;
border-radius: 10px;
```

**Tooltips:**
```css
font-size: 13px;
font-weight: 400;
line-height: 1.5;
color: #1E293B; /* slate-800 */
max-width: 300px;
```

### 3.3 Colors

**Navigation States:**
```css
/* Default */
background: transparent;
color: #334155; /* slate-700 */

/* Hover */
background: #F1F5F9; /* slate-100 */
color: #1E293B; /* slate-800 */

/* Active */
background: #EFF6FF; /* blue-50 */
color: #3B82F6; /* blue-500 */
border-left: 4px solid #3B82F6;

/* Disabled */
color: #94A3B8; /* slate-400 */
cursor: not-allowed;
```

**Badge Colors:**
```css
/* Urgent */
background: #EF4444; /* red-500 */
color: #FFFFFF;

/* Attention */
background: #F59E0B; /* amber-500 */
color: #FFFFFF;

/* Info */
background: #3B82F6; /* blue-500 */
color: #FFFFFF;
```

**Progress Indicators:**
```css
/* Complete */
background: #10B981; /* green-500 */

/* In Progress */
background: #3B82F6; /* blue-500 */

/* Not Started */
background: #E5E7EB; /* gray-200 */
```

### 3.4 Icons

**Phase Icons:**
- Setup: `Settings` (Lucide)
- Discovery: `Search` (Lucide)
- Settlement: `ClipboardList` (Lucide)
- Close: `Trophy` (Lucide)

**Navigation Icons:**
- Dashboard: `LayoutDashboard`
- Assets: `Landmark`
- Documents: `FileText`
- Communications: `MessageSquare`
- Follow-ups: `Bell`
- Settings: `Settings`
- Help: `HelpCircle`
- Support: `MessageCircle`

**Action Icons:**
- Add: `Plus`
- Search: `Search`
- Notification: `Bell`
- User: `User`
- Menu: `Menu`
- Close: `X`
- Check: `Check`
- Arrow: `ChevronRight`

### 3.5 Animations

**Expand/Collapse:**
```css
transition: max-height 200ms ease-in-out;
```

**Hover Effects:**
```css
transition: background-color 150ms ease-out,
            color 150ms ease-out;
```

**Badge Pulse (Urgent):**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
animation: pulse 2s ease-in-out infinite;
```

**FAB Expand:**
```css
transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
transform: rotate(45deg); /* When expanded */
```

**Page Transitions:**
```css
transition: opacity 200ms ease-in-out,
            transform 200ms ease-in-out;
```

---

## 4. Interaction Patterns

### 4.1 Keyboard Navigation

**Global Shortcuts:**
- `Cmd/Ctrl + K` - Open Quick Actions
- `Cmd/Ctrl + /` - Open Help
- `Esc` - Close any open menu/modal
- `1-4` - Jump to phase (when sidebar focused)
- `Tab` - Navigate through items
- `Enter/Space` - Activate item
- `Arrow Up/Down` - Navigate within section

**Quick Actions Menu:**
- `Arrow Up/Down` - Navigate results
- `Enter` - Select result
- `Esc` - Close menu
- `Cmd/Ctrl + Backspace` - Clear search

**Navigation Sidebar:**
- `Tab` - Move to next item
- `Shift + Tab` - Move to previous item
- `Arrow Right` - Expand phase section
- `Arrow Left` - Collapse phase section
- `Enter` - Navigate to page

### 4.2 Touch Gestures (Mobile)

**Bottom Navigation:**
- `Tap` - Navigate to page
- `Long press` - Show tooltip

**FAB:**
- `Tap` - Expand/collapse menu
- `Tap outside` - Close menu

**Sidebar (Tablet):**
- `Swipe right` - Open sidebar
- `Swipe left` - Close sidebar
- `Tap backdrop` - Close sidebar

### 4.3 Mouse Interactions

**Navigation Items:**
- `Hover` - Show background color, display tooltip after 500ms
- `Click` - Navigate to page
- `Right click` - Show context menu (future)

**Phase Headers:**
- `Hover` - Show hover state
- `Click` - Expand/collapse section

**Badges:**
- `Hover` - Show tooltip with details
- `Click` - Filter to show only those items

**Notifications:**
- `Hover` - Highlight notification
- `Click` - Navigate to related page
- `Click X` - Dismiss notification

---

## 5. Responsive Behavior

### 5.1 Breakpoints

```typescript
const breakpoints = {
  mobile: '< 768px',
  tablet: '768px - 1024px',
  desktop: '> 1024px'
};
```

### 5.2 Layout Changes

**Desktop (> 1024px):**
- Full sidebar (280px) always visible
- Sidebar can be collapsed to 64px (icon-only)
- All navigation items visible
- Tooltips on hover

**Tablet (768px - 1024px):**
- Sidebar overlay (240px) when open
- Hamburger menu to toggle sidebar
- Backdrop when sidebar open
- Swipe gestures to open/close

**Mobile (< 768px):**
- Bottom navigation bar (5 items)
- Floating action button (center)
- Hamburger menu for secondary items
- Full-screen overlays for menus

### 5.3 Component Visibility

| Component | Desktop | Tablet | Mobile |
|-----------|---------|--------|--------|
| Sidebar | ✅ Always | ✅ Overlay | ❌ Hidden |
| Bottom Nav | ❌ Hidden | ❌ Hidden | ✅ Always |
| FAB | ❌ Hidden | ❌ Hidden | ✅ Always |
| Breadcrumbs | ✅ Always | ✅ Always | ✅ Compact |
| Tooltips | ✅ Hover | ✅ Hover | ❌ Hidden |

---

## 6. Accessibility Specifications

### 6.1 ARIA Labels

**Navigation:**
```html
<nav aria-label="Main navigation">
  <ul role="list">
    <li role="listitem">
      <a href="/dashboard" aria-current="page">
        Dashboard
      </a>
    </li>
  </ul>
</nav>
```

**Phase Sections:**
```html
<button
  aria-expanded="true"
  aria-controls="discovery-section"
  aria-label="Discovery phase, 65% complete, 3 pending items"
>
  Discovery
</button>
<div id="discovery-section" role="region">
  <!-- Navigation items -->
</div>
```

**Notifications:**
```html
<button
  aria-label="Notifications, 3 unread"
  aria-haspopup="true"
  aria-expanded="false"
>
  <Bell />
  <span aria-live="polite" className="sr-only">
    3 unread notifications
  </span>
</button>
```

### 6.2 Focus Management

**Focus Indicators:**
```css
:focus-visible {
  outline: 2px solid #3B82F6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

**Focus Trap:**
- Quick Actions menu traps focus when open
- Notification center traps focus when open
- Onboarding wizard traps focus during steps
- Return focus to trigger element on close

**Skip Navigation:**
```html
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### 6.3 Screen Reader Support

**Announcements:**
```typescript
// When phase changes
announceToScreenReader('Navigated to Discovery phase');

// When notification arrives
announceToScreenReader('New urgent notification: Fidelity 401k needs attention');

// When action completes
announceToScreenReader('Asset added successfully');
```

**Live Regions:**
```html
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

---

## 7. State Management

### 7.1 Navigation State

**Local State (Component):**
```typescript
const [expandedPhases, setExpandedPhases] = useState<Phase[]>(['discovery']);
const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
```

**Persisted State (localStorage):**
```typescript
interface PersistedNavigationState {
  expandedPhases: Phase[];
  collapsedSidebar: boolean;
  recentItems: RecentItem[];
  dismissedNotifications: string[];
}
```

**Global State (Context):**
```typescript
const NavigationContext = createContext<NavigationContextValue>({
  currentPhase: 'setup',
  currentPage: '/dashboard',
  notifications: [],
  unreadCount: 0,
  // ... methods
});
```

### 7.2 Data Fetching

**Phase Progress:**
```typescript
const { data: phaseProgress } = useQuery({
  queryKey: ['phase-progress'],
  queryFn: calculatePhaseProgress,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

**Notifications:**
```typescript
const { data: notifications } = useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 60 * 1000, // 1 minute
});
```

**Recent Items:**
```typescript
const { data: recentItems } = useQuery({
  queryKey: ['recent-items'],
  queryFn: fetchRecentItems,
  staleTime: 10 * 60 * 1000, // 10 minutes
});
```

---

## 8. Performance Optimization

### 8.1 Code Splitting

```typescript
// Lazy load heavy components
const QuickActionsMenu = lazy(() => import('./QuickActionsMenu'));
const NotificationCenter = lazy(() => import('./NotificationCenter'));
const OnboardingWizard = lazy(() => import('./OnboardingWizard'));
```

### 8.2 Memoization

```typescript
// Memoize expensive calculations
const phaseProgress = useMemo(() => 
  calculatePhaseProgress(assets, estate),
  [assets, estate]
);

// Memoize components
const PhaseSection = memo(PhaseSectionComponent);
```

### 8.3 Virtualization

```typescript
// For large notification lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={500}
  itemCount={notifications.length}
  itemSize={80}
>
  {NotificationItem}
</FixedSizeList>
```

### 8.4 Debouncing

```typescript
// Debounce search input
const debouncedSearch = useDebouncedCallback(
  (query: string) => {
    performSearch(query);
  },
  300
);
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Component Tests:**
```typescript
describe('PhaseSection', () => {
  it('renders phase header with title and icon', () => {});
  it('expands/collapses on click', () => {});
  it('shows progress indicator when provided', () => {});
  it('displays badge counts correctly', () => {});
  it('highlights active navigation item', () => {});
});
```

**Hook Tests:**
```typescript
describe('useNavigation', () => {
  it('returns current phase', () => {});
  it('updates phase on setCurrentPhase', () => {});
  it('persists state to localStorage', () => {});
});
```

### 9.2 Integration Tests

```typescript
describe('Navigation Integration', () => {
  it('navigates between phases', () => {});
  it('opens quick actions with Cmd+K', () => {});
  it('displays notifications correctly', () => {});
  it('updates badge counts when data changes', () => {});
});
```

### 9.3 E2E Tests

```typescript
describe('Navigation E2E', () => {
  it('completes onboarding wizard', () => {});
  it('navigates through all phases', () => {});
  it('uses quick actions to add asset', () => {});
  it('responds to keyboard shortcuts', () => {});
});
```

### 9.4 Accessibility Tests

```typescript
describe('Navigation Accessibility', () => {
  it('passes axe accessibility audit', () => {});
  it('supports keyboard navigation', () => {});
  it('has proper ARIA labels', () => {});
  it('manages focus correctly', () => {});
});
```

---

## 10. Implementation Guidelines

### 10.1 File Structure

```
src/
├── components/
│   ├── navigation/
│   │   ├── NavigationProvider.tsx
│   │   ├── NavigationSidebar.tsx
│   │   ├── PhaseSection.tsx
│   │   ├── NavigationItem.tsx
│   │   ├── QuickActionsMenu.tsx
│   │   ├── NotificationCenter.tsx
│   │   ├── Breadcrumbs.tsx
│   │   ├── MobileNavigation/
│   │   │   ├── BottomNavBar.tsx
│   │   │   ├── FloatingActionButton.tsx
│   │   │   └── HamburgerMenu.tsx
│   │   └── OnboardingWizard/
│   │       ├── WizardModal.tsx
│   │       ├── WizardStep.tsx
│   │       └── steps/
│   │           ├── WelcomeStep.tsx
│   │           ├── EstateProfileStep.tsx
│   │           ├── ProbateStatusStep.tsx
│   │           ├── FirstAssetStep.tsx
│   │           └── DashboardTourStep.tsx
│   └── ...
├── hooks/
│   ├── useNavigation.ts
│   ├── usePhaseProgress.ts
│   ├── useNotifications.ts
│   └── useKeyboardShortcuts.ts
├── utils/
│   ├── phaseProgress.ts
│   ├── navigationHelpers.ts
│   └── announceToScreenReader.ts
└── types/
    └── navigation.ts
```

### 10.2 Coding Standards

**TypeScript:**
- Use strict mode
- Define interfaces for all props
- Avoid `any` type
- Use discriminated unions for variants

**React:**
- Use functional components
- Use hooks for state management
- Memoize expensive calculations
- Implement error boundaries

**Styling:**
- Use Tailwind CSS utility classes
- Create custom classes for complex styles
- Follow BEM naming for custom CSS
- Use CSS variables for theme values

**Accessibility:**
- Include ARIA labels
- Manage focus properly
- Support keyboard navigation
- Test with screen readers

---

## 11. Correctness Properties

### Property 1: Navigation State Consistency
**Validates: Requirements 1.1, 1.2**

**Property:** The current phase in navigation state always matches the current page's phase.

**Test Strategy:**
```typescript
property('navigation state matches current page', () => {
  const page = fc.constantFrom('/dashboard', '/assets', '/settlement', '/close');
  return fc.assert(
    fc.property(page, (pagePath) => {
      const expectedPhase = getPhaseFromPath(pagePath);
      const actualPhase = navigationState.currentPhase;
      return expectedPhase === actualPhase;
    })
  );
});
```

### Property 2: Badge Count Accuracy
**Validates: Requirements 1.3, 4.3**

**Property:** Badge counts always equal the actual number of pending items.

**Test Strategy:**
```typescript
property('badge counts are accurate', () => {
  return fc.assert(
    fc.property(fc.array(fc.record({
      status: fc.constantFrom('pending', 'complete'),
      priority: fc.constantFrom('low', 'medium', 'high', 'urgent')
    })), (items) => {
      const pendingCount = items.filter(i => i.status === 'pending').length;
      const badgeCount = calculateBadgeCount(items);
      return pendingCount === badgeCount;
    })
  );
});
```

### Property 3: Phase Progress Calculation
**Validates: Requirements 1.4, 4.1**

**Property:** Phase progress percentage is always between 0 and 100, and accurately reflects completion.

**Test Strategy:**
```typescript
property('phase progress is valid percentage', () => {
  return fc.assert(
    fc.property(fc.record({
      totalTasks: fc.nat(100),
      completedTasks: fc.nat(100)
    }), ({ totalTasks, completedTasks }) => {
      fc.pre(completedTasks <= totalTasks);
      const progress = calculatePhaseProgress(completedTasks, totalTasks);
      return progress >= 0 && progress <= 100;
    })
  );
});
```

### Property 4: Keyboard Navigation Accessibility
**Validates: Requirements 6.1, 6.2**

**Property:** All navigation items are reachable via keyboard alone.

**Test Strategy:**
```typescript
property('all items keyboard accessible', () => {
  return fc.assert(
    fc.property(fc.array(fc.record({
      id: fc.string(),
      path: fc.string(),
      disabled: fc.boolean()
    })), (items) => {
      const reachableItems = simulateKeyboardNavigation(items);
      const enabledItems = items.filter(i => !i.disabled);
      return reachableItems.length === enabledItems.length;
    })
  );
});
```

### Property 5: Notification Ordering
**Validates: Requirements 5.1, 5.2**

**Property:** Notifications are always ordered by priority (urgent → follow-up → update) and then by timestamp.

**Test Strategy:**
```typescript
property('notifications are correctly ordered', () => {
  return fc.assert(
    fc.property(fc.array(fc.record({
      type: fc.constantFrom('urgent', 'follow-up', 'update'),
      timestamp: fc.date()
    })), (notifications) => {
      const sorted = sortNotifications(notifications);
      return isCorrectlyOrdered(sorted);
    })
  );
});
```

---

## 12. Migration Strategy

### 12.1 Backward Compatibility

**Phase 1: Parallel Implementation**
- Build new navigation alongside existing
- Use feature flag to toggle between old/new
- Ensure both work simultaneously

**Phase 2: Gradual Migration**
- Release to 10% of users
- Monitor metrics and feedback
- Fix critical issues
- Increase to 25%, 50%, 100%

**Phase 3: Cleanup**
- Remove old navigation code
- Update documentation
- Archive old components

### 12.2 Data Migration

**User Preferences:**
```typescript
// Migrate old preferences to new format
function migrateNavigationPreferences(oldPrefs: OldPrefs): NewPrefs {
  return {
    expandedPhases: oldPrefs.openSections || ['discovery'],
    collapsedSidebar: oldPrefs.sidebarCollapsed || false,
    recentItems: oldPrefs.history?.slice(0, 5) || [],
  };
}
```

**URL Structure:**
- Maintain existing URLs for backward compatibility
- Add redirects for any changed routes
- Update sitemap and documentation

---

## 13. Monitoring & Analytics

### 13.1 Key Metrics

**Usage Metrics:**
- Navigation clicks per session
- Time to first navigation action
- Most/least used navigation items
- Phase progression rate
- Quick actions usage rate

**Performance Metrics:**
- Navigation render time
- Search response time
- Animation frame rate
- Bundle size impact

**Error Metrics:**
- Navigation errors
- Failed state updates
- Accessibility violations
- Browser compatibility issues

### 13.2 Analytics Events

```typescript
// Track navigation events
trackEvent('navigation_click', {
  phase: 'discovery',
  item: 'asset-inventory',
  method: 'sidebar' | 'quick-actions' | 'breadcrumb'
});

// Track quick actions usage
trackEvent('quick_actions_used', {
  query: 'fidelity',
  resultClicked: 'asset-123',
  timeToClick: 2.5 // seconds
});

// Track onboarding completion
trackEvent('onboarding_completed', {
  timeSpent: 180, // seconds
  stepsCompleted: 5,
  skipped: false
});
```

---

**End of Design Document**
