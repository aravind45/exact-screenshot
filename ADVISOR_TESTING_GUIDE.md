# Advisor System Testing Guide

## What Was Fixed

✅ **Fixed the 404 errors on advisor dashboard** by preventing `WorkflowContext` from making executor-specific API calls for advisor users.

## What You Need to Test

### Test 1: Advisor Registration Flow

1. **Open browser with DevTools**
   - Press F12 to open DevTools
   - Go to Console tab

2. **Register as Advisor**
   - Go to: https://www.expectedestate.com/auth?mode=signup
   - Click "I am an Advisor"
   - Fill in registration form
   - Submit

3. **Check Console Logs**
   Look for these logs:
   ```
   [AUTH] Registration successful. User data: { userType: 'ADVISOR', role: 'ADVISOR', id: '...' }
   [AUTH] Routing advisor to /advisor/onboarding
   ```

4. **Expected Result**
   - Should navigate to `/advisor/onboarding`
   - Should NOT go to executor onboarding page

5. **If It Fails**
   - Take screenshot of console logs
   - Note which page you ended up on
   - Share the `[AUTH]` log output

---

### Test 2: Advisor Dashboard (Main Fix)

1. **Login as Advisor**
   - Use your advisor account credentials

2. **Open DevTools Network Tab**
   - Press F12 → Network tab
   - Filter by "Fetch/XHR"

3. **Navigate to Dashboard**
   - Go to `/advisor/dashboard`

4. **Check for Errors**
   - ✅ Should NOT see: `/api/liabilities/undefined/completions` (404)
   - ✅ Should NOT see: `/api/visibilities/undefined/completions` (404)
   - ✅ Should see: `/api/advisors/stripe/connect/status` (200)
   - ✅ Should see: `/api/advisors/dashboard/stats` (200)
   - ✅ Should see: `/api/advisors/dashboard/earnings` (200)

5. **Expected Result**
   - Dashboard loads without errors
   - Stats display correctly
   - No 404 errors in console

---

### Test 3: Advisor Payout Settings

1. **Navigate to Payouts**
   - Click "Earnings" or go to `/advisor/payouts`

2. **Check API Calls**
   - Should see: `/api/advisors/me` (200 or 404 if no profile)
   - Should see: `/api/advisors/stripe/connect/status` (200)

3. **Test Stripe Connection**
   - Click "Connect with Stripe" button
   - Should redirect to Stripe onboarding
   - Complete onboarding
   - Return to app

4. **Expected Result**
   - Stripe onboarding works
   - Status updates after completion
   - No executor-related API calls

---

## Quick Verification Commands

### Check if you're logged in as advisor:
Open Console and run:
```javascript
localStorage.getItem('auth_token')
```

### Check your user data:
```javascript
fetch('/api/auth/me', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('auth_token') }
}).then(r => r.json()).then(console.log)
```

Should show:
```json
{
  "role": "ADVISOR",
  "userType": "ADVISOR",
  "email": "your@email.com"
}
```

---

## Common Issues & Solutions

### Issue: Still seeing 404 errors
**Solution**: Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Registration goes to wrong page
**Solution**: 
1. Check console for `[AUTH]` logs
2. Verify API response includes `role` and `userType`
3. Share console output with developer

### Issue: Dashboard shows "No estate found"
**Solution**: This is expected for advisors - they don't have estates. The fix prevents these API calls from happening.

### Issue: Can't access executor features
**Solution**: This is correct! Advisors should NOT have access to executor features like assets, liabilities, roadmap, etc.

---

## What Should Work Now

✅ Advisor registration
✅ Advisor dashboard (no 404 errors)
✅ Advisor payout settings
✅ Booking management
✅ Earnings tracking
✅ Stripe onboarding

## What Should NOT Work (By Design)

❌ Access to `/dashboard` (executor dashboard)
❌ Access to `/assets` (asset management)
❌ Access to `/liabilities` (liability tracking)
❌ Access to `/roadmap` (settlement roadmap)
❌ Any probate tools

---

## Reporting Issues

If you find issues, please provide:

1. **Console logs** (F12 → Console tab)
2. **Network errors** (F12 → Network tab, filter by failed requests)
3. **Steps to reproduce**
4. **Expected vs actual behavior**
5. **Screenshots if helpful**

---

## Success Criteria

The fix is successful if:

1. ✅ No 404 errors on advisor dashboard
2. ✅ Advisor registration routes to `/advisor/onboarding`
3. ✅ Advisor dashboard loads and displays stats
4. ✅ Payout settings page works
5. ✅ No executor-specific API calls are made for advisors
