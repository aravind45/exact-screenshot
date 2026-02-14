# Implementation Plan: Authentication and Advisor Separation Fix

## Overview

This implementation plan addresses critical authentication redirect loops and user type separation issues. The work is organized into discrete tasks that fix ProfileGuard, enhance authentication routing, improve session management, and implement comprehensive route protection.

## Tasks

- [x] 1. Fix ProfileGuard component to skip checks for advisors
  - Update ProfileGuard.tsx to check both role and userType for ADVISOR
  - Add shouldSkipCheck logic that returns early for ADVISOR and ADMIN users
  - Update useQuery enabled condition to skip estate fetch for advisors
  - Remove advisor routes from ProfileGuard redirect logic
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 1.1 Write property test for ProfileGuard advisor bypass
  - **Property 1: Advisor Profile Check Bypass**
  - **Validates: Requirements 1.1, 1.2, 1.3**

- [x] 2. Fix Auth.tsx login redirect logic
  - [x] 2.1 Create helper function to determine default dashboard by role/userType
    - Function should check both role and userType for ADVISOR
    - Return /advisor/dashboard for advisors
    - Return /admin for admins
    - Return /dashboard for executors
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Implement redirect path validation logic
    - Check if stored redirect path matches user type
    - Validate advisor paths only for advisor users
    - Validate executor paths only for executor users
    - Fall back to default dashboard if mismatch
    - _Requirements: 2.4, 2.5, 2.6_

  - [x] 2.3 Update handleSubmit login success handler
    - Call helper to get default dashboard
    - Validate stored redirect path
    - Navigate to validated path or default
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 2.4 Write property test for login redirect consistency
  - **Property 2: Login Redirect Consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 2.5 Write property test for redirect path validation
  - **Property 6: Redirect Path Validation**
  - **Validates: Requirements 2.4, 2.5, 2.6**

- [x] 3. Fix Auth.tsx registration redirect logic
  - [x] 3.1 Update signup success handler for advisor routing
    - Check newUser.userType and newUser.role for ADVISOR
    - Route advisors to /advisor/onboarding
    - Route executors to /onboarding or stored redirect
    - Clear stored redirect after use
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.2 Update user type selection to set both role and userType
    - When ADVISOR selected, set userType: 'ADVISOR' and role: 'ADVISOR'
    - When EXECUTOR selected, set userType: 'EXECUTOR' and role: 'USER'
    - _Requirements: 3.3, 3.4_

- [ ]* 3.3 Write property test for registration routing
  - **Property 3: Registration Onboarding Routing**
  - **Validates: Requirements 3.1, 3.2**

- [x] 4. Enhance AuthContext session management
  - [x] 4.1 Update signOut function to clear all session storage
    - Remove auth_token from localStorage
    - Remove after_login_redirect from sessionStorage
    - Remove discovery_data from sessionStorage
    - Set user state to null
    - Navigate to landing page using window.location.href
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 Ensure login/register store tokens correctly
    - Verify api.login stores token in localStorage
    - Verify api.register stores token in localStorage
    - _Requirements: 10.1, 10.2_

- [ ]* 4.3 Write property test for session cleanup
  - **Property 4: Session Cleanup Completeness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 5. Enhance RoleRoute component
  - [x] 5.1 Update fallback logic to route by user type
    - Check user.role and user.userType for ADVISOR
    - Route advisors to /advisor/dashboard
    - Route admins to /admin
    - Route executors to /dashboard or provided fallbackPath
    - Use replace: true to prevent back button loops
    - _Requirements: 5.1, 5.2_

  - [x] 5.2 Add logging for access denial
    - Log when user is denied access to route
    - Include user role and attempted path
    - _Requirements: 5.1, 5.2_

- [ ]* 5.3 Write property test for role-based route protection
  - **Property 5: Role-Based Route Protection**
  - **Validates: Requirements 5.1, 5.2**

- [x] 6. Update ProfileGuard to skip onboarding routes
  - Add check for /advisor/onboarding path
  - Ensure advisors on /advisor/onboarding are not redirected
  - Ensure executors on /onboarding are not redirected
  - _Requirements: 8.1, 8.2_

- [ ]* 6.1 Write property test for onboarding flow isolation
  - **Property 7: Onboarding Flow Isolation**
  - **Validates: Requirements 8.1, 8.2**

- [ ] 7. Add redirect loop detection
  - [ ] 7.1 Create redirect history tracking utility
    - Maintain array of last 5 redirect paths
    - Function to detect if same path appears 3+ times
    - Function to clear history
    - _Requirements: 9.4_

  - [ ] 7.2 Integrate loop detection in navigation logic
    - Check for loops before each redirect
    - Break to default dashboard if loop detected
    - Log error when loop is broken
    - _Requirements: 9.4_

- [ ] 8. Enhance API client error handling
  - [ ] 8.1 Update parseResponse to handle 401 consistently
    - Clear auth_token on 401 response
    - Save current path to sessionStorage
    - Redirect to /auth
    - _Requirements: 10.4_

  - [ ] 8.2 Verify getHeaders includes token in Authorization header
    - Confirm token is read from localStorage
    - Confirm Bearer token format
    - _Requirements: 10.3_

- [x] 9. Update App.tsx route configuration
  - [x] 9.1 Verify all executor routes use RoleRoute with correct roles
    - Check routes: /dashboard, /assets, /roadmap, /probate/*, etc.
    - Ensure allowedRoles includes ['EXECUTOR', 'USER', 'HEIR']
    - _Requirements: 5.3_

  - [x] 9.2 Verify all advisor routes use RoleRoute with correct roles
    - Check routes: /advisor/dashboard, /advisor/bookings, /advisor/earnings, /advisor/payouts
    - Ensure allowedRoles includes ['ADVISOR', 'ADMIN']
    - _Requirements: 5.4_

  - [x] 9.3 Verify shared routes allow both user types
    - Check routes: /marketplace, /my-bookings, /profile, /settings
    - Ensure allowedRoles includes both EXECUTOR and ADVISOR roles
    - _Requirements: 5.5_

- [ ] 10. Add error handling and user feedback
  - [ ] 10.1 Add error toasts for ProfileGuard failures
    - Show toast when estate fetch fails for executor
    - Show toast when profile is incomplete
    - _Requirements: 9.1_

  - [ ] 10.2 Add error toasts for authentication failures
    - Show specific message for invalid credentials
    - Show specific message for network errors
    - Show specific message for email already exists
    - _Requirements: 9.2, 9.3_

  - [ ] 10.3 Add error recovery for authentication initialization
    - Set loading to false on error
    - Allow access to public routes
    - Log initialization errors
    - _Requirements: 9.5_

- [x] 11. Checkpoint - Test authentication flows
  - Test advisor registration → onboarding → dashboard flow
  - Test executor registration → onboarding → dashboard flow
  - Test advisor login → dashboard flow
  - Test executor login → dashboard flow
  - Test logout → session cleared → landing page
  - Test cross-user-type navigation blocking
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 12. Write integration tests for full authentication flows
  - Test complete advisor registration and login flow
  - Test complete executor registration and login flow
  - Test cross-user-type navigation prevention
  - Test redirect loop prevention
  - Test session recovery after token expiration

- [ ]* 13. Write unit tests for edge cases
  - Test ProfileGuard with null user
  - Test ProfileGuard with missing role/userType
  - Test Auth.tsx with missing stored redirect
  - Test RoleRoute with invalid role
  - Test session cleanup with missing storage items

- [ ] 14. Final checkpoint - Verify all requirements met
  - Verify no redirect loops occur for any user type
  - Verify advisors never see executor features
  - Verify executors never see advisor features
  - Verify logout completely clears session
  - Verify all existing tests still pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
