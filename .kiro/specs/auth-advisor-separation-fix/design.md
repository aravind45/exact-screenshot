# Design Document: Authentication and Advisor Separation Fix

## Overview

This design addresses critical authentication redirect loops and user type separation issues in the ExpectedEstate application. The core problems stem from:

1. ProfileGuard incorrectly checking estate profiles for all users including advisors
2. Auth.tsx login/registration logic not properly routing based on userType/role
3. Session state persisting incorrectly after logout
4. Lack of proper route protection separating advisor and executor features

The solution involves fixing the ProfileGuard component, enhancing authentication routing logic, improving session management, and implementing comprehensive route protection.

## Architecture

### Component Hierarchy

```
App.tsx (Routes)
├── AuthProvider (Session Management)
│   ├── ProtectedRoute (Authentication Check)
│   │   ├── RoleRoute (Role-Based Access)
│   │   │   └── ProfileGuard (Profile Completion Check)
│   │   │       └── Protected Pages
```

### Data Flow

1. User authenticates → AuthContext stores user with role/userType
2. Route accessed → ProtectedRoute checks authentication
3. If authenticated → RoleRoute validates role matches route requirements
4. If role valid → ProfileGuard checks profile completion (executors only)
5. If profile complete → Render protected page

## Components and Interfaces

### 1. ProfileGuard Component

**Purpose**: Validate executor profile completion before allowing access to executor features

**Current Issues**:
- Checks estate profile for all users including advisors
- Causes redirect loops when advisors access protected routes

**Fixed Logic**:
```typescript
interface ProfileGuardProps {
  children: React.ReactNode;
}

function ProfileGuard({ children }: ProfileGuardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // CRITICAL FIX: Skip all checks for advisors and admins
  const shouldSkipCheck = 
    !user || 
    user.role === 'ADMIN' || 
    user.role === 'ADVISOR' || 
    user.userType === 'ADVISOR';

  const { data: estate, isLoading, isError } = useQuery({
    queryKey: ["estate"],
    queryFn: api.getMyEstate,
    retry: false,
    enabled: !!user && !shouldSkipCheck, // Only fetch for executors
  });

  useEffect(() => {
    // Skip profile check for non-executor users
    if (shouldSkipCheck) return;

    // Skip if still loading
    if (isLoading) return;

    // Skip if already on onboarding
    if (location.pathname === "/onboarding") return;

    // If error fetching estate (404 = no estate yet), redirect to onboarding
    if (isError) {
      navigate("/onboarding", { replace: true });
      return;
    }

    // Skip if no estate data yet
    if (!estate) return;

    // Check if executor profile is complete
    const complete = isProfileComplete(estate);
    if (!complete) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, estate, isLoading, isError, navigate, location.pathname, shouldSkipCheck]);

  // Show loading only for executors
  if (!shouldSkipCheck && isLoading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
```

### 2. Auth.tsx Login/Registration Routing

**Purpose**: Route users to appropriate dashboards based on their role/userType

**Current Issues**:
- Inconsistent role-based routing
- Doesn't properly handle userType vs role
- Stored redirect paths not validated against user type

**Fixed Logic**:

```typescript
// Login redirect logic
const handleLoginSuccess = (authedUser: User) => {
  const redirect = sessionStorage.getItem("after_login_redirect");
  sessionStorage.removeItem("after_login_redirect");

  // Determine default dashboard based on role/userType
  let defaultPath = '/dashboard';
  if (authedUser.role === 'ADVISOR' || authedUser.userType === 'ADVISOR') {
    defaultPath = '/advisor/dashboard';
  } else if (authedUser.role === 'ADMIN') {
    defaultPath = '/admin';
  }

  // Validate redirect path matches user type
  if (redirect) {
    const isAdvisorPath = redirect.startsWith('/advisor');
    const isExecutorPath = !isAdvisorPath && !redirect.startsWith('/admin');
    const isAdvisor = authedUser.role === 'ADVISOR' || authedUser.userType === 'ADVISOR';

    if ((isAdvisorPath && isAdvisor) || (isExecutorPath && !isAdvisor)) {
      navigate(redirect);
      return;
    }
  }

  navigate(defaultPath);
};

// Registration redirect logic
const handleRegistrationSuccess = (newUser: User) => {
  const redirect = sessionStorage.getItem("after_login_redirect");
  sessionStorage.removeItem("after_login_redirect");

  // Route to appropriate onboarding
  if (newUser.userType === 'ADVISOR' || newUser.role === 'ADVISOR') {
    navigate('/advisor/onboarding');
  } else {
    // Validate redirect for executors
    if (redirect && !redirect.startsWith('/advisor') && !redirect.startsWith('/admin')) {
      navigate(redirect);
    } else {
      navigate(buyMode ? '/pricing?mode=buy' : '/onboarding');
    }
  }
};
```

### 3. AuthContext Session Management

**Purpose**: Manage authentication state and session lifecycle

**Current Issues**:
- Logout doesn't clear all session storage
- Session state persists after logout

**Fixed Logic**:

```typescript
const signOut = async () => {
  try {
    // Call API to blacklist token
    await api.logout();
  } catch (error) {
    console.error("Logout API error:", error);
  } finally {
    // Always clear local state even if API fails
    localStorage.removeItem("auth_token");
    sessionStorage.removeItem("after_login_redirect");
    sessionStorage.removeItem("discovery_data");
    setUser(null);
    
    // Navigate to landing page
    window.location.href = '/';
  }
};
```

### 4. RoleRoute Enhancement

**Purpose**: Enforce role-based access control with proper fallback routing

**Current Issues**:
- Generic fallback doesn't account for user type
- Advisors hitting executor routes get sent to wrong dashboard

**Fixed Logic**:

```typescript
function RoleRoute({ children, allowedRoles, fallbackPath }: RoleRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      const userRole = user.role || 'USER';
      
      if (!allowedRoles.includes(userRole)) {
        // Determine appropriate fallback based on user type
        if (user.role === 'ADVISOR' || user.userType === 'ADVISOR') {
          navigate('/advisor/dashboard', { replace: true });
        } else if (user.role === 'ADMIN') {
          navigate('/admin', { replace: true });
        } else {
          navigate(fallbackPath || '/dashboard', { replace: true });
        }
      }
    }
  }, [user, loading, allowedRoles, navigate, fallbackPath]);

  if (loading) return <LoadingSpinner />;
  if (!user || !allowedRoles.includes(user.role || 'USER')) return null;

  return <>{children}</>;
}
```

### 5. API Client Token Management

**Purpose**: Ensure consistent token handling and 401 response handling

**Current Implementation** (already correct):
```typescript
const getHeaders = () => {
  const token = localStorage.getItem("auth_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };
};

const parseResponse = async (response: Response) => {
  // ... parsing logic ...
  
  if (response.status === 401) {
    // Clear token and redirect to auth
    localStorage.removeItem("auth_token");
    window.location.href = '/auth';
    throw new Error('Authentication required');
  }
  
  // ... rest of logic ...
};
```

**Enhancement Needed**:
Add global 401 interceptor to handle token expiration consistently.

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: 'USER' | 'EXECUTOR' | 'ADVISOR' | 'ADMIN';
  userType?: 'EXECUTOR' | 'ADVISOR';
  state?: string;
  subscriptionStatus?: 'ACTIVE' | 'INACTIVE' | 'PAST_DUE' | 'CANCELED';
  subscriptionPlan?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
}
```

**Key Fields**:
- `role`: Authorization level (what they can access)
- `userType`: User classification (executor vs advisor)
- Both fields should be checked for advisor status

### Route Configuration

```typescript
interface RouteConfig {
  path: string;
  allowedRoles: string[];
  requiresProfile?: boolean;
  requiresSubscription?: boolean;
}

const EXECUTOR_ROUTES: RouteConfig[] = [
  { path: '/dashboard', allowedRoles: ['EXECUTOR', 'USER', 'HEIR'], requiresProfile: true },
  { path: '/assets', allowedRoles: ['EXECUTOR', 'USER', 'HEIR'], requiresProfile: true },
  { path: '/roadmap', allowedRoles: ['EXECUTOR', 'USER', 'HEIR'], requiresProfile: true },
  { path: '/probate/*', allowedRoles: ['EXECUTOR', 'USER', 'HEIR'], requiresProfile: true },
  // ... more executor routes
];

const ADVISOR_ROUTES: RouteConfig[] = [
  { path: '/advisor/dashboard', allowedRoles: ['ADVISOR', 'ADMIN'] },
  { path: '/advisor/bookings', allowedRoles: ['ADVISOR', 'ADMIN'] },
  { path: '/advisor/earnings', allowedRoles: ['ADVISOR', 'ADMIN'] },
  { path: '/advisor/payouts', allowedRoles: ['ADVISOR', 'ADMIN'] },
];

const SHARED_ROUTES: RouteConfig[] = [
  { path: '/marketplace', allowedRoles: ['EXECUTOR', 'USER', 'HEIR', 'ADVISOR'] },
  { path: '/my-bookings', allowedRoles: ['EXECUTOR', 'USER', 'HEIR', 'ADVISOR'] },
  { path: '/profile', allowedRoles: ['EXECUTOR', 'USER', 'HEIR', 'ADVISOR', 'ADMIN'] },
  { path: '/settings', allowedRoles: ['EXECUTOR', 'USER', 'HEIR', 'ADVISOR', 'ADMIN'] },
];
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Advisor Profile Check Bypass

*For any* user with role ADVISOR or userType ADVISOR, ProfileGuard should never fetch estate data or redirect to executor onboarding.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Login Redirect Consistency

*For any* authenticated user, the login redirect should route to a dashboard matching their role/userType (advisor → /advisor/dashboard, admin → /admin, executor → /dashboard).

**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Registration Onboarding Routing

*For any* newly registered user, the system should redirect to the onboarding flow matching their userType (ADVISOR → /advisor/onboarding, EXECUTOR → /onboarding).

**Validates: Requirements 3.1, 3.2**

### Property 4: Session Cleanup Completeness

*For any* logout operation, all authentication artifacts (auth_token, redirect paths, discovery data) should be removed from storage.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 5: Role-Based Route Protection

*For any* protected route access attempt, users should only access routes matching their allowed roles, with automatic redirection to their appropriate dashboard otherwise.

**Validates: Requirements 5.1, 5.2**

### Property 6: Redirect Path Validation

*For any* stored redirect path, the system should validate it matches the user's type before redirecting, falling back to the default dashboard if mismatched.

**Validates: Requirements 2.4, 2.5, 2.6, 3.5**

### Property 7: Onboarding Flow Isolation

*For any* user on an onboarding route, ProfileGuard should not redirect them, allowing completion of their type-specific onboarding.

**Validates: Requirements 8.1, 8.2**

### Property 8: Authentication State Initialization

*For any* application initialization with a valid token, the auth system should fetch and set complete user data before rendering protected routes.

**Validates: Requirements 7.1, 7.2, 7.5**

## Error Handling

### 1. ProfileGuard Error Scenarios

**Estate Fetch Failure (404)**:
- Executor user, no estate exists
- Action: Redirect to /onboarding
- Log: "No estate found for executor, redirecting to onboarding"

**Estate Fetch Failure (401)**:
- Token expired or invalid
- Action: Clear token, redirect to /auth
- Log: "Authentication failed, clearing session"

**Estate Fetch Failure (500)**:
- Server error
- Action: Show error toast, allow retry
- Log: "Estate fetch failed with server error"

### 2. Authentication Error Scenarios

**Login Failure - Invalid Credentials**:
- Action: Show "Invalid credentials" toast
- Stay on login page
- Don't clear any form data

**Login Failure - Network Error**:
- Action: Show "Network error, please try again" toast
- Stay on login page
- Allow retry

**Registration Failure - Email Exists**:
- Action: Show "Account exists, please sign in" toast
- Offer to switch to login mode

### 3. Redirect Loop Detection

**Implementation**:
```typescript
const redirectHistory: string[] = [];
const MAX_REDIRECTS = 3;

const detectRedirectLoop = (path: string): boolean => {
  redirectHistory.push(path);
  
  // Keep only last 5 redirects
  if (redirectHistory.length > 5) {
    redirectHistory.shift();
  }
  
  // Check if same path appears 3+ times
  const pathCount = redirectHistory.filter(p => p === path).length;
  return pathCount >= MAX_REDIRECTS;
};

// In navigation logic
if (detectRedirectLoop(targetPath)) {
  console.error('Redirect loop detected, breaking to default dashboard');
  const defaultPath = user.role === 'ADVISOR' ? '/advisor/dashboard' : '/dashboard';
  navigate(defaultPath, { replace: true });
  redirectHistory.length = 0; // Clear history
  return;
}
```

### 4. Session Recovery

**Token Expiration During Session**:
- API returns 401
- Clear token from localStorage
- Save current path to sessionStorage
- Redirect to /auth
- After re-login, restore saved path (if valid for user type)

## Testing Strategy

### Unit Tests

Unit tests should focus on specific examples and edge cases:

1. **ProfileGuard Tests**:
   - Advisor user bypasses estate check
   - Admin user bypasses estate check
   - Executor with no estate redirects to onboarding
   - Executor with incomplete profile redirects to onboarding
   - Executor with complete profile renders children

2. **Auth Routing Tests**:
   - Advisor login routes to /advisor/dashboard
   - Executor login routes to /dashboard
   - Admin login routes to /admin
   - Advisor registration routes to /advisor/onboarding
   - Executor registration routes to /onboarding

3. **Session Management Tests**:
   - Logout clears auth_token
   - Logout clears redirect paths
   - Logout clears discovery data
   - Logout redirects to landing page

4. **RoleRoute Tests**:
   - Advisor accessing executor route redirects to /advisor/dashboard
   - Executor accessing advisor route redirects to /dashboard
   - Admin can access admin routes
   - Unauthenticated user redirects to /auth

### Property-Based Tests

Property tests should verify universal properties across all inputs (minimum 100 iterations each):

1. **Property Test: Advisor Profile Bypass**
   - **Feature: auth-advisor-separation-fix, Property 1**: For any user with role ADVISOR or userType ADVISOR, ProfileGuard should never fetch estate data
   - Generate random users with ADVISOR role/userType
   - Verify estate query is disabled
   - Verify no redirect occurs

2. **Property Test: Login Redirect Consistency**
   - **Feature: auth-advisor-separation-fix, Property 2**: For any authenticated user, login redirect matches their role/userType
   - Generate random users with various roles
   - Simulate login
   - Verify redirect path matches expected dashboard

3. **Property Test: Registration Routing**
   - **Feature: auth-advisor-separation-fix, Property 3**: For any newly registered user, redirect matches their userType
   - Generate random registration data with different userTypes
   - Simulate registration
   - Verify redirect to correct onboarding

4. **Property Test: Session Cleanup**
   - **Feature: auth-advisor-separation-fix, Property 4**: For any logout, all session artifacts are cleared
   - Set random session data
   - Simulate logout
   - Verify all storage cleared

5. **Property Test: Route Protection**
   - **Feature: auth-advisor-separation-fix, Property 5**: For any route access, users only access allowed routes
   - Generate random users and route combinations
   - Verify access granted only for allowed roles
   - Verify redirect to appropriate dashboard otherwise

6. **Property Test: Redirect Validation**
   - **Feature: auth-advisor-separation-fix, Property 6**: For any stored redirect, validation matches user type
   - Generate random redirect paths and user types
   - Verify mismatched redirects fall back to default dashboard

### Integration Tests

1. **Full Authentication Flow**:
   - Register as advisor → verify redirect to /advisor/onboarding
   - Complete advisor onboarding → verify redirect to /advisor/dashboard
   - Logout → verify session cleared
   - Login as executor → verify redirect to /dashboard

2. **Cross-User Type Navigation**:
   - Login as advisor
   - Attempt to access /roadmap
   - Verify redirect to /advisor/dashboard
   - Logout
   - Login as executor
   - Attempt to access /advisor/bookings
   - Verify redirect to /dashboard

3. **Redirect Loop Prevention**:
   - Simulate conditions that would cause loop
   - Verify loop detection triggers
   - Verify fallback to default dashboard

### Test Configuration

- Use Vitest for unit and property tests
- Use fast-check for property-based testing
- Minimum 100 iterations per property test
- Mock API calls for unit tests
- Use test database for integration tests
