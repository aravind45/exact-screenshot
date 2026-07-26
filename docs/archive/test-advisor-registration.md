# Advisor Registration & Dashboard Testing Guide

## Issue Summary
1. **Advisor Registration Routing**: After selecting "I am an Advisor" during registration, users are being routed to executor onboarding instead of advisor onboarding
2. **Advisor Dashboard 404 Errors**: Console shows 404 errors for `/api/liabilities/undefined/completions` and `/api/visibilities/undefined/completions`

## Root Cause Analysis

### Registration Issue
The code in `Auth.tsx` has the correct logic:
```typescript
if (newUser?.userType === 'ADVISOR' || newUser?.role === 'ADVISOR') {
  console.log('[AUTH] Routing advisor to /advisor/onboarding');
  navigate('/advisor/onboarding');
}
```

**Possible causes:**
1. Backend is not returning `userType` or `role` fields in the registration response
2. The user object structure doesn't match what the frontend expects

### Dashboard 404 Errors
These errors are NOT from advisor-specific code. They appear to be from:
- Components that are trying to load with `undefined` IDs
- Possibly from shared components that shouldn't be loaded for advisors

## Testing Steps

### 1. Test Advisor Registration
1. Open browser with DevTools (F12)
2. Go to `/auth?mode=signup`
3. Select "I am an Advisor"
4. Fill in registration form
5. **Check console for `[AUTH]` logs** - they will show:
   - What user data was returned from API
   - Which route the app is navigating to

### 2. Check API Response
The registration API should return:
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "fullName": "...",
    "role": "ADVISOR",
    "userType": "ADVISOR",
    "isTrialing": true
  },
  "token": "..."
}
```

### 3. Test Advisor Dashboard
1. Login as advisor user
2. Navigate to `/advisor/dashboard`
3. **Check Network tab** for:
   - Which API calls are being made
   - Which ones are returning 404
   - What the request URLs look like

## Fixes Needed

### Fix 1: Ensure Backend Returns Complete User Object
The `authService.ts` already creates the user correctly, but we need to verify the response includes all fields.

### Fix 2: Add Defensive Checks in Frontend
Components should check if user is an advisor before making executor-specific API calls.

### Fix 3: ProfileGuard Should Not Block Advisors
The ProfileGuard component was already fixed to skip checks for advisors, but we should verify it's working.

## Expected Behavior

### For Advisors:
- Registration → `/advisor/onboarding`
- Login → `/advisor/dashboard`
- No estate profile checks
- No executor-specific API calls
- Access only to advisor routes

### For Executors:
- Registration → `/onboarding`
- Login → `/dashboard`
- Estate profile required
- Full access to executor features

## Next Steps

1. **User needs to test registration** with console open and report what the `[AUTH]` logs show
2. **User needs to check Network tab** on advisor dashboard to see which API calls are failing
3. Based on the logs, we can identify if:
   - Backend is not returning correct user data
   - Frontend is making incorrect API calls
   - There's a routing issue
