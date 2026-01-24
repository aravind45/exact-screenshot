# Navigation Redesign - Visual Mockups

**Feature:** navigation-redesign  
**Created:** January 24, 2026

---

## Desktop Navigation - Full View

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│  ExpectedEstate 🏠    [🔍 Search Cmd+K]    [🔔 3]  [👤 John Doe ▼]               │
├────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────────────────────────────────┐  │
│  │  NAVIGATION          │  │  DASHBOARD                                        │  │
│  │                      │  │                                                    │  │
│  │  ⚙️ SETUP ✓         │  │  Home > Dashboard                                 │  │
│  │  ├─ Dashboard        │  │                                                    │  │
│  │  ├─ Estate Profile   │  │  Welcome back, John                               │  │
│  │  └─ Probate Hub      │  │  Managing the estate of Jane Doe                  │  │
│  │                      │  │                                                    │  │
│  │  🔍 DISCOVERY ⚡     │  │  ┌──────────────────────────────────────────────┐ │  │
│  │  ├─ Asset Inventory  │  │  │  NEXT BEST ACTION                            │ │  │
│  │  │   (12 assets)     │  │  │  📋 Log communication with Fidelity          │ │  │
│  │  ├─ Document Scanner │  │  │  It's been 14 days since last contact        │ │  │
│  │  └─ Asset Detective  │  │  │  [Take Action →]                             │ │  │
│  │                      │  │  └──────────────────────────────────────────────┘ │  │
│  │  📋 SETTLEMENT       │  │                                                    │  │
│  │  67% Complete        │  │  [Asset cards grid...]                            │  │
│  │  ├─ Active Assets    │  │                                                    │  │
│  │  │   (8 in progress) │  │                                                    │  │
│  │  ├─ Communications   │  │                                                    │  │
│  │  │   (23 logged)     │  │                                                    │  │
│  │  ├─ Document Vault   │  │                                                    │  │
│  │  └─ Follow-ups       │  │                                                    │  │
│  │      (3 pending) 🔔  │  │                                                    │  │
│  │                      │  │                                                    │  │
│  │  🏆 CLOSE            │  │                                                    │  │
│  │  ├─ Final Distrib.   │  │                                                    │  │
│  │  ├─ Tax Documents    │  │                                                    │  │
│  │  └─ Close Estate     │  │                                                    │  │
│  │                      │  │                                                    │  │
│  │  ─────────────────   │  │                                                    │  │
│  │                      │  │                                                    │  │
│  │  QUICK ACTIONS       │  │                                                    │  │
│  │  ➕ Add Asset        │  │                                                    │  │
│  │  📝 Log Comm         │  │                                                    │  │
│  │  📄 Upload Doc       │  │                                                    │  │
│  │                      │  │                                                    │  │
│  │  RESOURCES           │  │                                                    │  │
│  │  📚 Help Center      │  │                                                    │  │
│  │  💬 Support          │  │                                                    │  │
│  │  ⚙️ Settings         │  │                                                    │  │
│  └──────────────────────┘  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────┘
```



---

## Mobile Navigation - Bottom Bar

```
┌─────────────────────────────────────────┐
│  ExpectedEstate    [🔔 3]  [👤]        │
├─────────────────────────────────────────┤
│                                          │
│  DASHBOARD                               │
│                                          │
│  Welcome back, John                      │
│  Managing estate of Jane Doe             │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  NEXT ACTION                       │ │
│  │  Log communication with Fidelity   │ │
│  │  [Take Action →]                   │ │
│  └────────────────────────────────────┘ │
│                                          │
│  [Asset cards...]                        │
│                                          │
│                                          │
│                                          │
│                                          │
│                                          │
│                                          │
│                    ┌───┐                 │
│                    │ ➕ │ FAB             │
│                    └───┘                 │
├─────────────────────────────────────────┤
│ [🏠]  [📊]  [   ]  [📋]  [☰]           │
│ Home  Assets      Tasks  More            │
└─────────────────────────────────────────┘
```

---

## Quick Actions Menu (Cmd+K)

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
│  🔍 Search Assets                                   │
├─────────────────────────────────────────────────────┤
│  SUGGESTED FOR YOU                                   │
│  🔔 3 assets need follow-up                         │
│  📋 Complete probate setup                          │
│  📄 Upload missing documents                        │
└─────────────────────────────────────────────────────┘
```

---

## Notification Center

```
┌─────────────────────────────────────────────────────┐
│  NOTIFICATIONS                    [Mark all read]    │
├─────────────────────────────────────────────────────┤
│  URGENT (1)                                          │
│  🔴 Fidelity 401k - No response in 30 days          │
│      Last contact: Dec 15, 2025                      │
│      [View Asset →]                                  │
├─────────────────────────────────────────────────────┤
│  FOLLOW-UPS (2)                                      │
│  🟡 Chase Bank - Follow up recommended               │
│      14 days since last contact                      │
│      [View Asset →]                                  │
│                                                       │
│  🟡 MetLife Insurance - Document requested           │
│      Waiting for claim form                          │
│      [Upload Document →]                             │
├─────────────────────────────────────────────────────┤
│  UPDATES (3)                                         │
│  🔵 Vanguard IRA - Status changed to "In Review"    │
│      2 hours ago                                     │
│                                                       │
│  🔵 New document uploaded: Will.pdf                 │
│      Yesterday                                       │
│                                                       │
│  🔵 Asset added: Bank of America Checking           │
│      2 days ago                                      │
└─────────────────────────────────────────────────────┘
```

---

## Onboarding Wizard - Step 1

```
┌─────────────────────────────────────────────────────┐
│                                                       │
│              Welcome to ExpectedEstate               │
│                                                       │
│  We're sorry for your loss. We're here to help you  │
│  navigate the estate settlement process with         │
│  clarity and confidence.                             │
│                                                       │
│  This quick setup will take about 5 minutes.         │
│                                                       │
│  ●○○○○  Step 1 of 5                                 │
│                                                       │
│                                                       │
│              [Skip for now]  [Get Started →]         │
│                                                       │
└─────────────────────────────────────────────────────┘
```

---

## Phase Section - Expanded State

```
┌─────────────────────────────────────────┐
│  🔍 DISCOVERY ⚡                        │
│  65% Complete • 3 pending                │
│  ▓▓▓▓▓▓▓░░░░░░░░                        │
│                                          │
│  ├─ 📊 Asset Inventory                  │
│  │      12 assets                        │
│  │                                       │
│  ├─ 📄 Document Scanner                 │
│  │      Upload & analyze documents       │
│  │                                       │
│  └─ 🔍 Asset Detective                  │
│         Find hidden assets               │
└─────────────────────────────────────────┘
```

---

## Tooltip Example

```
┌─────────────────────────────────────────┐
│  📊 Asset Inventory                     │
└─────────────────────────────────────────┘
         │
         └──────────────────────────────────┐
                                             │
         ┌───────────────────────────────────┤
         │  📊 Asset Inventory               │
         │                                   │
         │  View and manage all discovered   │
         │  assets in your estate. Track     │
         │  status, value, and progress.     │
         │                                   │
         │  Example: Fidelity 401k, Chase    │
         │  Checking, MetLife Insurance      │
         └───────────────────────────────────┘
```

---

## Breadcrumb Navigation

```
Home > Settlement > Active Assets > Fidelity 401k
 ↑       ↑            ↑               ↑
 │       │            │               └─ Current page (not clickable)
 │       │            └─ Clickable
 │       └─ Clickable
 └─ Clickable
```

---

## Mobile FAB - Expanded

```
┌─────────────────────────────────────────┐
│                                          │
│  [Content...]                            │
│                                          │
│                                          │
│              ┌─────────────────────┐    │
│              │ 📄 Upload Document  │    │
│              ├─────────────────────┤    │
│              │ 📝 Log Communication│    │
│              ├─────────────────────┤    │
│              │ ➕ Add Asset        │    │
│              └─────────────────────┘    │
│                    ┌───┐                 │
│                    │ ✕ │                 │
│                    └───┘                 │
├─────────────────────────────────────────┤
│ [🏠]  [📊]  [   ]  [📋]  [☰]           │
└─────────────────────────────────────────┘
```

---

## Color Coding Reference

**Phase States:**
- ✓ Complete: Green (#10B981)
- ⚡ Active: Blue (#3B82F6)
- ○ Not Started: Gray (#9CA3AF)

**Badge Types:**
- 🔴 Urgent: Red (#EF4444)
- 🟡 Attention: Amber (#F59E0B)
- 🔵 Info: Blue (#3B82F6)

**Progress Bars:**
- Complete: Green (#10B981)
- In Progress: Blue (#3B82F6)
- Not Started: Gray (#E5E7EB)

---

**End of Mockups Document**
