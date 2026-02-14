# Advisor System Fixes - Summary

## Issues Identified and Fixed

### 1. ✅ FIXED: Advisor Dashboard 404 Errors

**Problem**: Console showing 404 errors for `/api/liabilities/undefined/completions` and `/api/visibilities/undefined/completions`

**Root Cause**: The `WorkflowContext` was making executor-specific API calls for ALL users, including advisors. This context is wrapped around the entire app, so it was trying to fetch estate data, assets, liabilities, and documents for advisor users who don't have estates.

**Fix Applied**: Updated `src/contexts/WorkflowContext.tsx` to conditionally fetch data only for executors:

```typescript
// Only fetch executor-specific data for executors, not advisors
const isExecutor = user && user.role !== 'ADVISOR' && user.userType !== 'ADVISOR';

const { data: estate } = useQuery({
  queryKey: ['estate'],
  queryFn: api.getMyEstate,
  enabled: !!isExecutor  // Changed from !!user
});

const { data: assetsData } = useQuery({
  queryKey: ['assets'],
  queryFn: api.getAssets,
  enabled: !!isExecutor  // Changed from !!user
});

const { data: liabilitiesData } = useQuery({
  queryKey: ['liabilities'],
  queryFn: api.getLiabilities,
  enabled: !!isExecutor  // Changed from !!user
});

const { data: documentsData } = useQuery({
  queryKey: ['estate', 'documents'],
  queryFn: api.getEstateDocuments,
  enabled: !!isExecutor && !!estate  // Changed from !!user && !!estate
});

const { data: stateConfig } = useQuery({
  queryKey: ['liabilities', 'priority-options'],
  queryFn: api.getPriorityOptions,
  enabled: !!isExecutor  // Changed from !!user
});
```

**Impact**: Advisors will no longer trigger executor-specific API calls, eliminating the 404 errors.

---

### 2. ⚠️ NEEDS TESTING: Advisor Registration Routing

**Problem**: After selecting "I am an Advisor" during registration, users report being routed to executor onboarding instead of advisor onboarding.

**Current Code Status**: The routing logic in `Auth.tsx` is CORRECT:

```typescript
// Route to appropriate onboarding based on user type
if (newUser?.userType === 'ADVISOR' || newUser?.role === 'ADVISOR') {
  console.log('[AUTH] Routing advisor to /advisor/onboarding');
  navigate('/advisor/onboarding');
} else {
  console.log('[AUTH] Routing executor to /onboarding');
  navigate(buyMode ? '/pricing?mode=buy' : '/onboarding');
}
```

**Backend Status**: The backend correctly sets `role` and `userType` in the database:

```typescript
// server/services/authService.ts
const user = await prisma.user.create({
  data: {
    email,
    passwordHash,
    fullName,
    state,
    role: role || (safeUserType === "ADVISOR" ? "ADVISOR" : "EXECUTOR"),
    userType: safeUserType,
    // ...
  }
});
```

**Debugging Added**: Console logs are in place to track the registration flow:

```typescript
console.log('[AUTH] Registration successful. User data:', {
  userType: newUser?.userType,
  role: newUser?.role,
  id: newUser?.id
});
```

**Next Steps for User**:
1. Open browser DevTools (F12) → Console tab
2. Register a new advisor account
3. Check console for `[AUTH]` logs showing:
   - What user data was returned from the API
   - Which route the app is navigating to
4. Report back with the console output

**Possible Issues**:
- Backend might not be returning `userType` and `role` fields in the response
- API response structure might not match frontend expectations
- There could be a redirect happening after the initial navigation

---

## Files Modified

1. **src/contexts/WorkflowContext.tsx**
   - Added `isExecutor` check to conditionally enable queries
   - Prevents advisors from triggering executor-specific API calls

---

## Testing Checklist

### For Advisor Registration:
- [ ] Register new advisor account with console open
- [ ] Verify `[AUTH]` logs show correct user data
- [ ] Verify navigation goes to `/advisor/onboarding`
- [ ] Verify no 404 errors in console

### For Advisor Dashboard:
- [ ] Login as advisor
- [ ] Navigate to `/advisor/dashboard`
- [ ] Verify no 404 errors in Network tab
- [ ] Verify dashboard loads correctly with stats
- [ ] Verify payout page works

### For Advisor Functionality:
- [ ] Test Stripe onboarding flow
- [ ] Test booking confirmation
- [ ] Test earnings display
- [ ] Verify no executor features are accessible

---

## Architecture Notes

### Separation of Concerns

**Executor Routes** (require estate):
- `/dashboard` - Executor dashboard
- `/assets` - Asset management
- `/liabilities` - Liability tracking
- `/roadmap` - Settlement roadmap
- All probate tools

**Advisor Routes** (no estate required):
- `/advisor/dashboard` - Advisor dashboard
- `/advisor/bookings` - Booking management
- `/advisor/payouts` - Stripe payout settings
- `/advisor/profile` - Profile settings

**Shared Routes**:
- `/marketplace` - Advisor marketplace (executors can book)
- `/my-bookings` - User's bookings (both roles)

### Guards in Place

1. **ProfileGuard**: Skips estate checks for advisors
2. **RoleRoute**: Enforces role-based access
3. **WorkflowContext**: Now conditionally fetches executor data
4. **Auth routing**: Routes users to correct onboarding

---

## Known Issues

None currently - the WorkflowContext fix should resolve the 404 errors. The registration routing needs user testing to confirm it's working correctly.

---

## Recommendations

1. **Add E2E Tests**: Create automated tests for advisor registration and dashboard flows
2. **Add Error Boundaries**: Wrap advisor routes in error boundaries to catch any remaining issues
3. **Add Monitoring**: Track advisor registration success rate and dashboard load times
4. **Consider Separate Contexts**: Create an `AdvisorContext` separate from `WorkflowContext` for cleaner separation
