# Settlement Roadmap Demo Guide

## How to View the Roadmap

### Option 1: Dashboard (Quick View)
1. Navigate to `/dashboard`
2. Scroll down to the "Settlement Roadmap" section
3. See the phase chevron and current phase tasks
4. Click tasks to expand details

### Option 2: Full Roadmap Page (Complete Experience)
1. Navigate to `/roadmap` or click "Roadmap" in the sidebar
2. See all 6 phases with progress tracking
3. Click any phase to view its tasks
4. Mark tasks as complete with checkboxes
5. Click "Complete Phase" to finish a phase and move to next

## Visual Tour

### Phase Chevron
```
┌─────────────────────────────────────────────────────────────────┐
│  [✓] Immediate → [⏰] Court → [🔒] Asset → [🔒] Creditor → ...  │
│   Actions        Filing      Discovery    Claims                │
│   Week 1-2       Week 3-8    Month 2-4    Month 4-8            │
└─────────────────────────────────────────────────────────────────┘
```

**Legend:**
- ✓ Green = Completed
- ⏰ Colored = Current Phase
- 🔒 Gray = Upcoming (Locked)

### Task List (Expanded)
```
┌─────────────────────────────────────────────────────────────────┐
│ Immediate Actions (Week 1-2)                          [3/6] 50% │
├─────────────────────────────────────────────────────────────────┤
│ Critical tasks to complete immediately after death...            │
├─────────────────────────────────────────────────────────────────┤
│ ☑ Secure the Property                          ⏱ 1-2 days      │
│   Change locks, forward mail, ensure home is protected          │
│   ⚠ IMPORTANT: Vacant homes are high-risk for theft            │
│                                                                  │
│ ☐ Notify Social Security Administration        ⏱ 30 minutes    │
│   Report death to stop benefit payments                         │
│   📄 Required: Death Certificate                                │
│   ⚠ WARNING: SSA may claw back payments made after death       │
│   🔗 Report Death to SSA                                        │
│                                                                  │
│ ☐ Cancel Credit Cards & Subscriptions          ⏱ 2-3 hours     │
│   Stop recurring charges and prevent identity theft             │
│   ⚠ CAUTION: Keep one utility account open for estate expenses │
└─────────────────────────────────────────────────────────────────┘
```

## Interactive Features

### 1. Task Expansion
- **Click task title** to expand/collapse details
- See required documents, alerts, and helpful links
- Collapse to keep view clean and scannable

### 2. Task Completion
- **Check the checkbox** to mark task complete
- Task turns green and gets strikethrough
- Progress bar updates automatically
- Completion persists (will be saved to backend)

### 3. Phase Navigation
- **Click any phase** in the "All Phases" section
- View jumps to that phase's tasks
- Current phase highlighted with blue border

### 4. Phase Completion
- **Click "Complete Phase"** button
- All tasks in phase marked complete
- Automatically advances to next phase
- Phase turns green in chevron

## Sample User Flow

### New Executor (Day 1)
1. Logs in, sees Dashboard
2. Sees "Settlement Roadmap" section
3. Current phase: "Immediate Actions"
4. Expands first task: "Secure the Property"
5. Reads description and alerts
6. Completes task, checks checkbox
7. Moves to next task

### Experienced Executor (Month 3)
1. Clicks "Roadmap" in sidebar
2. Sees overall progress: 45% complete
3. Current phase: "Asset Discovery"
4. Reviews completed phases (green checkmarks)
5. Clicks "Creditor Claims" to preview upcoming tasks
6. Returns to current phase to continue work

### Power User (Month 6)
1. Opens roadmap on mobile
2. Sees vertical phase cards (mobile view)
3. Quickly scans all phases
4. Marks multiple tasks complete
5. Completes entire phase with one click
6. Advances to "Asset Liquidation"

## Alert Types Explained

### 🔴 IMPORTANT (Red)
Critical information that could result in legal liability or financial loss if ignored.
Example: "NEVER mix estate funds with personal funds. This is a legal requirement."

### 🟠 WARNING (Amber)
Important cautions about potential issues or consequences.
Example: "SSA may claw back payments made after death. Notify within 1 week."

### 🟡 CAUTION (Orange)
Helpful reminders to avoid common mistakes.
Example: "Keep one utility account open for estate expenses."

### 🔵 INFO (Blue)
Useful context, tips, or explanations.
Example: "Filing fee: ~$435 in California. File within 30 days for best practice."

## Mobile Experience

### Chevron → Vertical Cards
On mobile (< 768px), the horizontal chevron transforms into vertical cards:

```
┌─────────────────────────┐
│ ✓ Immediate Actions     │
│   Secure & Notify       │
│   Week 1-2              │
├─────────────────────────┤
│ ⏰ Court Filing         │
│   Petition & Letters    │
│   Week 3-8              │
├─────────────────────────┤
│ 🔒 Asset Discovery      │
│   Inventory & Appraisal │
│   Month 2-4             │
└─────────────────────────┘
```

### Touch-Friendly
- Large tap targets (44x44px minimum)
- Swipe-friendly task expansion
- No hover states (uses tap instead)
- Optimized for one-handed use

## Keyboard Navigation

### Shortcuts
- **Tab**: Navigate between interactive elements
- **Enter/Space**: Toggle checkboxes, expand tasks
- **Arrow Keys**: Navigate task list
- **Esc**: Collapse expanded task

### Accessibility
- Screen reader friendly
- ARIA labels on all interactive elements
- Semantic HTML structure
- Focus indicators visible

## Data Structure

### Phase Object
```typescript
{
  phase: "immediate_actions",
  title: "Immediate Actions",
  subtitle: "Secure & Notify",
  duration: "Week 1-2",
  description: "Critical tasks to complete immediately...",
  tasks: [...]
}
```

### Task Object
```typescript
{
  id: "secure_property",
  title: "Secure the Property",
  description: "Change locks, forward mail...",
  estimatedTime: "1-2 days",
  requiredDocs: ["Death Certificate"],
  alerts: [
    {
      type: "important",
      message: "Vacant homes are high-risk..."
    }
  ],
  links: [
    {
      label: "Security Checklist",
      url: "https://..."
    }
  ]
}
```

## Customization Options

### For Developers
1. **Add New Phase**: Edit `src/config/settlementPhases.ts`
2. **Add New Task**: Add to phase's `tasks` array
3. **Change Colors**: Update phase colors in `SettlementPhaseChevron.tsx`
4. **Modify Layout**: Edit component styles in respective files

### For Users (Future)
1. **Custom Tasks**: Add your own tasks to any phase
2. **Reorder Tasks**: Drag and drop to reorder
3. **Hide Tasks**: Hide tasks that don't apply to your estate
4. **Add Notes**: Attach notes to tasks

## Tips for Best Experience

### For Executors
1. **Check Daily**: Review roadmap daily to stay on track
2. **Expand Details**: Read alerts and links before starting tasks
3. **Mark Complete**: Check off tasks as you finish them
4. **Review Progress**: Check overall progress weekly
5. **Plan Ahead**: Preview upcoming phases to prepare

### For Administrators
1. **Monitor Adoption**: Track how many users view roadmap
2. **Analyze Bottlenecks**: See which tasks take longest
3. **Update Content**: Keep task descriptions current
4. **Add Resources**: Link to helpful external resources
5. **Gather Feedback**: Ask users what's helpful/confusing

## Troubleshooting

### Roadmap Not Showing
- Check if user is logged in
- Verify estate has been created
- Check browser console for errors

### Tasks Not Saving
- Backend integration not yet implemented
- Currently saves to component state only
- Will persist to database in next phase

### Mobile View Issues
- Clear browser cache
- Try different mobile browser
- Check viewport width (should be < 768px)

### Performance Issues
- Reduce number of expanded tasks
- Close unused browser tabs
- Check network connection

## Future Enhancements

### Coming Soon
- ✅ Backend persistence
- ✅ Task reminders
- ✅ Document attachments
- ✅ Time tracking
- ✅ Collaboration features

### Under Consideration
- 📋 Custom phases
- 📋 Task templates
- 📋 Progress reports
- 📋 Export to PDF
- 📋 Integration with calendar

---

**Questions?** Check the main implementation doc: `SETTLEMENT_ROADMAP_IMPLEMENTATION.md`

**Last Updated**: January 27, 2026
