# Requirements Document

## Introduction

This specification addresses critical authentication and user separation issues in the ExpectedEstate application. Users are experiencing redirect loops after login, and advisor users are incorrectly being routed to executor-specific features. The system currently fails to properly distinguish between EXECUTOR and ADVISOR user types, leading to broken authentication flows and mixed user experiences.

## Glossary

- **Auth_System**: The authentication and authorization system managing user sessions and access control
- **ProfileGuard**: A React component that validates user profile completion before allowing access to protected routes
- **User_Type**: An enumeration distinguishing between EXECUTOR and ADVISOR users
- **Role**: A user's authorization level (USER, EXECUTOR, ADVISOR, ADMIN)
- **Session_State**: The persisted authentication state including tokens and user data
- **Onboarding_Flow**: The initial setup process specific to each user type
- **Redirect_Loop**: A condition where users are continuously redirected between pages without reaching their destination
- **Route_Protection**: Access control mechanisms that restrict routes based on user type and role

## Requirements

### Requirement 1: ProfileGuard User Type Filtering

**User Story:** As an advisor or admin user, I want to bypass estate profile checks, so that I can access the system without being redirected to executor onboarding.

#### Acceptance Criteria

1. WHEN a user with role ADVISOR accesses a protected route, THE ProfileGuard SHALL skip all estate profile validation checks
2. WHEN a user with role ADMIN accesses a protected route, THE ProfileGuard SHALL skip all estate profile validation checks
3. WHEN a user with userType ADVISOR accesses a protected route, THE ProfileGuard SHALL skip all estate profile validation checks
4. WHEN an EXECUTOR user accesses a protected route without a complete profile, THE ProfileGuard SHALL redirect to /onboarding
5. WHEN an EXECUTOR user accesses a protected route with a complete profile, THE ProfileGuard SHALL allow access without redirection

### Requirement 2: Login Redirect Logic

**User Story:** As a user logging into the system, I want to be routed to the correct dashboard based on my user type, so that I see features relevant to my role.

#### Acceptance Criteria

1. WHEN an ADVISOR user successfully logs in, THE Auth_System SHALL redirect to /advisor/dashboard
2. WHEN an ADMIN user successfully logs in, THE Auth_System SHALL redirect to /admin
3. WHEN an EXECUTOR user successfully logs in, THE Auth_System SHALL redirect to /dashboard
4. WHEN a user logs in with a stored redirect path, THE Auth_System SHALL honor that redirect path after validating it matches their user type
5. IF a stored redirect path is for an advisor route and the user is an EXECUTOR, THEN THE Auth_System SHALL redirect to /dashboard instead
6. IF a stored redirect path is for an executor route and the user is an ADVISOR, THEN THE Auth_System SHALL redirect to /advisor/dashboard instead

### Requirement 3: Registration Routing

**User Story:** As a new user registering for an account, I want to be routed to the appropriate onboarding flow, so that I complete setup steps relevant to my user type.

#### Acceptance Criteria

1. WHEN an ADVISOR user completes registration, THE Auth_System SHALL redirect to /advisor/onboarding
2. WHEN an EXECUTOR user completes registration, THE Auth_System SHALL redirect to /onboarding
3. WHEN a user selects ADVISOR during type selection, THE Auth_System SHALL set userType to ADVISOR and role to ADVISOR
4. WHEN a user selects EXECUTOR during type selection, THE Auth_System SHALL set userType to EXECUTOR and role to USER
5. WHEN registration includes a stored redirect path, THE Auth_System SHALL validate the path matches the user type before redirecting

### Requirement 4: Session Management and Logout

**User Story:** As a user logging out of the system, I want my session completely cleared, so that the next user sees a clean login state.

#### Acceptance Criteria

1. WHEN a user initiates logout, THE Auth_System SHALL remove the auth_token from localStorage
2. WHEN a user initiates logout, THE Auth_System SHALL clear the user state in AuthContext
3. WHEN a user initiates logout, THE Auth_System SHALL clear any stored redirect paths from sessionStorage
4. WHEN a user initiates logout, THE Auth_System SHALL clear any discovery_data from sessionStorage
5. WHEN logout completes, THE Auth_System SHALL redirect to the landing page (/)
6. WHEN a logged-out user visits the landing page, THE landing page SHALL display "Sign In" not "Sign Out"

### Requirement 5: Route Protection and Separation

**User Story:** As a system administrator, I want advisor and executor routes completely separated, so that users only access features appropriate to their role.

#### Acceptance Criteria

1. WHEN an ADVISOR user attempts to access executor-only routes, THE Route_Protection SHALL redirect to /advisor/dashboard
2. WHEN an EXECUTOR user attempts to access advisor-only routes, THE Route_Protection SHALL redirect to /dashboard
3. THE Route_Protection SHALL define executor-only routes as: /dashboard, /assets, /roadmap, /probate/*, /discovery, /liabilities, /accounting, /distribution
4. THE Route_Protection SHALL define advisor-only routes as: /advisor/dashboard, /advisor/bookings, /advisor/earnings, /advisor/payouts
5. THE Route_Protection SHALL define shared routes as: /marketplace, /my-bookings, /profile, /settings, /help

### Requirement 6: Navigation Component Separation

**User Story:** As an advisor user, I want to see only advisor-relevant navigation items, so that I'm not confused by executor-specific features.

#### Acceptance Criteria

1. WHEN an ADVISOR user views navigation, THE navigation component SHALL display only advisor-specific menu items
2. WHEN an EXECUTOR user views navigation, THE navigation component SHALL display only executor-specific menu items
3. THE navigation component SHALL hide estate-related items (Roadmap, Assets, Probate Tools) from ADVISOR users
4. THE navigation component SHALL hide advisor-related items (Bookings Management, Earnings, Payouts) from EXECUTOR users
5. THE navigation component SHALL show shared items (Marketplace, Profile, Settings) to all authenticated users

### Requirement 7: Authentication State Persistence

**User Story:** As a returning user, I want my authentication state properly restored, so that I can continue where I left off without redirect loops.

#### Acceptance Criteria

1. WHEN the application initializes with a valid auth_token, THE Auth_System SHALL fetch current user data from the API
2. WHEN user data is successfully fetched, THE Auth_System SHALL set the user state with complete role and userType information
3. IF the auth_token is invalid or expired, THEN THE Auth_System SHALL remove it from localStorage and set user state to null
4. WHEN authentication state changes, THE Auth_System SHALL trigger re-evaluation of route protection
5. THE Auth_System SHALL complete initialization before rendering protected routes

### Requirement 8: Onboarding Flow Isolation

**User Story:** As a new user completing onboarding, I want to stay within my user type's flow, so that I'm not redirected to the wrong onboarding process.

#### Acceptance Criteria

1. WHEN an ADVISOR user is on /advisor/onboarding, THE ProfileGuard SHALL not redirect them
2. WHEN an EXECUTOR user is on /onboarding, THE ProfileGuard SHALL not redirect them
3. WHEN an ADVISOR user completes /advisor/onboarding, THE system SHALL redirect to /advisor/dashboard
4. WHEN an EXECUTOR user completes /onboarding, THE system SHALL redirect to /dashboard
5. THE Onboarding_Flow SHALL not allow cross-contamination between advisor and executor onboarding paths

### Requirement 9: Error Recovery and Fallback

**User Story:** As a user experiencing authentication issues, I want clear error messages and safe fallback behavior, so that I can recover from errors without being stuck in loops.

#### Acceptance Criteria

1. WHEN ProfileGuard encounters an error fetching estate data for an EXECUTOR, THE system SHALL redirect to /onboarding with an error message
2. WHEN Auth_System encounters an error during login, THE system SHALL display a specific error message and remain on the login page
3. WHEN Auth_System encounters an error during registration, THE system SHALL display a specific error message and remain on the registration page
4. IF a redirect loop is detected (same redirect attempted 3+ times), THEN THE system SHALL break the loop and redirect to the appropriate default dashboard
5. WHEN authentication initialization fails, THE system SHALL set loading to false and allow access to public routes

### Requirement 10: API Configuration and Token Management

**User Story:** As a developer, I want consistent API token management, so that all API calls include proper authentication headers.

#### Acceptance Criteria

1. WHEN a user logs in successfully, THE Auth_System SHALL store the auth_token in localStorage
2. WHEN a user registers successfully, THE Auth_System SHALL store the auth_token in localStorage
3. WHEN any API call is made, THE api client SHALL include the auth_token in the Authorization header
4. WHEN an API call receives a 401 Unauthorized response, THE api client SHALL clear the auth_token and redirect to /auth
5. THE api client SHALL handle token refresh if the backend supports refresh tokens
