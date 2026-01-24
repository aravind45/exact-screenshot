# Navigation Redesign Spec

**Status:** Ready for Implementation  
**Priority:** Critical (Phase 1)  
**Estimated Timeline:** 6 weeks  
**Created:** January 24, 2026

---

## Overview

This spec redesigns the ExpectedEstate navigation to create a phase-based, guided experience that reduces cognitive load and helps users understand what to do first, second, and third in the estate settlement process.

---

## Problem We're Solving

**Current Issues:**
- Users don't know where to start or what to do next
- Navigation items have unclear purposes ("Discovery" vs "Upload Document")
- No visual indication of progress or completion
- Critical sections like "Probate Hub" are buried
- Mobile experience is poor

**User Impact:**
- 3+ minutes to figure out first action (should be < 90 seconds)
- High support ticket volume about navigation
- Low feature discovery rate
- Users report feeling "lost" and "overwhelmed"

---

## Solution Summary

### Phase-Based Navigation

Organize navigation into 4 clear phases that match the estate settlement journey:

1. **Setup** (⚙️) - Establish estate profile and legal foundation
2. **Discovery** (🔍) - Find and catalog all assets
3. **Settlement** (📋) - Contact institutions and process assets
4. **Close** (🏆) - Distribute assets and close estate

### Key Features

- **Progress Indicators** - Visual progress bars and completion percentages
- **Badge Counts** - Show pending items (e.g., "Follow-ups (3)")
- **Tooltips** - Explain what each section does before clicking
- **Quick Actions** - Cmd/Ctrl + K for instant access to common tasks
- **Notification Center** - Bell icon with urgent, follow-up, and update notifications
- **Mobile Bottom Nav** - Touch-friendly navigation for mobile users
- **Onboarding Wizard** - 5-step guided setup for new users
- **Breadcrumbs** - Always know where you are

---

## Documents in This Spec

### 1. [requirements.md](./requirements.md)
Detailed requirements including:
- User stories with acceptance criteria
- Proposed navigation structure
- Technical requirements
- Success metrics
- Edge cases and error handling

### 2. [design.md](./design.md)
Design specifications including:
- Component architecture
- TypeScript interfaces
- Visual design specs
- Interaction patterns
- Accessibility requirements

### 3. [tasks.md](./tasks.md)
Implementation tasks broken down into:
- 24 main tasks with 100+ subtasks
- 6-week timeline
- Dependencies and risk assessment
- Success metrics

### 4. [MOCKUPS.md](./MOCKUPS.md)
Visual mockups showing:
- Desktop navigation layout
- Mobile bottom navigation
- Quick actions menu
- Notification center
- Onboarding wizard
- Tooltips and breadcrumbs

---

## Key Decisions

### ✅ Approved Decisions

1. **Phase Names:** Setup, Discovery, Settlement, Close
   - Clear, action-oriented language
   - Matches user mental model

2. **Mobile Navigation:** Bottom bar with 5 items + FAB
   - Follows mobile best practices
   - Touch-friendly (44x44px targets)

3. **Quick Actions:** Cmd/Ctrl + K shortcut
   - Industry standard (GitHub, Linear, etc.)
   - Power user friendly

4. **Notification Types:** Urgent, Follow-ups, Updates
   - Clear priority hierarchy
   - Color-coded for quick scanning

### ⏳ Pending Decisions

1. **Phase Auto-Advancement:** Should phases auto-advance or require manual progression?
   - Recommendation: Auto-advance with manual override option

2. **Search Scope:** Should search include full communication content or just titles?
   - Recommendation: Start with titles, add full-text search in v1.1

3. **Mobile FAB Position:** Center or right-aligned?
   - Recommendation: Center (more prominent, follows Material Design)

---

## Success Metrics

### Quantitative Goals
- ✅ Reduce "time to first action" by 50% (3 min → 90 sec)
- ✅ Increase navigation click-through rate by 40%
- ✅ Reduce navigation support tickets by 60%
- ✅ Increase feature discovery by 35%
- ✅ 90% of users complete onboarding wizard

### Qualitative Goals
- ✅ Users can explain what each phase does
- ✅ Users report feeling "guided" not "lost"
- ✅ Users find specific pages in < 30 seconds
- ✅ High satisfaction scores (4.5+ / 5)

---

## Implementation Plan

### Week 1: Foundation
- Setup NavigationContext and Provider
- Build PhaseSection component
- Create NavigationSidebar
- Implement phase progress calculation

### Week 2: Interactive Features
- Build QuickActionsMenu
- Create NotificationCenter
- Implement Breadcrumbs
- Add Tooltip system

### Week 3: Mobile Experience
- Build mobile bottom navigation
- Create Floating Action Button
- Implement hamburger menu
- Handle responsive breakpoints

### Week 4: Onboarding
- Build onboarding wizard (5 steps)
- Create guided tours
- Add contextual help system

### Week 5: Polish
- Implement search functionality
- Add keyboard shortcuts
- Optimize performance
- Accessibility audit

### Week 6: Testing & Launch
- Comprehensive testing
- User testing with 10 beta users
- Create documentation
- Gradual rollout (25% → 100%)

---

## Dependencies

### Technical
- React 19.2.0
- React Router 7.12.0
- Framer Motion 12.25.0
- Radix UI (accessible components)
- Tailwind CSS 3.4.17

### Data
- Estate data API
- Asset data API
- Communication data API
- User preferences API

### Design
- Finalized mockups ✅
- Icon library ✅
- Color palette ✅
- Typography system ✅

---

## Risks & Mitigation

### High Risk
**Mobile navigation complexity**
- Mitigation: Start mobile work early, test on real devices

**Performance with large datasets**
- Mitigation: Implement virtualization, lazy loading

### Medium Risk
**User adoption resistance**
- Mitigation: Gradual rollout, clear communication, optional tour

**Accessibility compliance**
- Mitigation: Test early with screen readers, follow WCAG 2.1 AA

---

## Next Steps

1. **Review & Approve** - Product team reviews and approves spec
2. **Design Finalization** - Designer creates high-fidelity mockups
3. **Technical Planning** - Engineering estimates and plans sprint
4. **Kickoff** - Start Week 1 implementation
5. **Weekly Check-ins** - Review progress and adjust as needed

---

## Questions or Feedback?

Contact the product team or leave comments in this spec.

---

## Changelog

- **2026-01-24** - Initial spec created
- **TBD** - Design review completed
- **TBD** - Implementation started
- **TBD** - Beta testing completed
- **TBD** - Full rollout completed

---

**End of README**
