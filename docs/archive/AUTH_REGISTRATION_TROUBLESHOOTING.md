# Authentication Registration Troubleshooting Guide

## Common Registration Issues and Solutions

### 1. **Email Already Registered Error**
**Problem:** User tries to register with an email that already exists in the system.

**Solution:** The system should provide a clear message and redirect to login:
```typescript
// In AuthService.register()
if (existingUser) throw new Error("Email already registered");
```

**Frontend Fix:** Improve error handling in Auth.tsx:
```typescript
if (error.message.includes('User already registered') || error.message.includes('Email already registered')) {
    toast({
        title: 'Account exists',
        description: 'This email is already registered. Please sign in instead.',
        variant: 'destructive',
    });
    // Auto-switch to login mode
    setAuthMode('login');
}
```

### 2. **Validation Errors**
**Problem:** Form validation fails silently or shows unclear error messages.

**Current Validation Issues:**
- Password validation only checks minimum length (8 characters)
- No password strength requirements
- Name validation allows any characters

**Recommended Fixes:**

#### Enhanced Password Validation
```typescript
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');
```

#### Enhanced Name Validation
```typescript
const nameSchema = z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name is too long')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces');
```

### 3. **JWT Secret Configuration**
**Problem:** Missing or invalid JWT_SECRET environment variable.

**Error:** "Generic JWT_SECRET missing in environment variables. Server cannot start."

**Solution:** Ensure `.env` file has:
```
JWT_SECRET=your-super-secret-jwt-key-here
```

### 4. **Database Connection Issues**
**Problem:** Prisma database connection fails.

**Common Causes:**
- Invalid DATABASE_URL
- Database server not running
- Network connectivity issues

**Debug Steps:**
1. Check DATABASE_URL in `.env`
2. Test database connection
3. Verify database server is running

### 5. **Email Service Issues**
**Problem:** Registration succeeds but verification email fails to send.

**Error:** EmailService might not be properly configured.

**Solution:** Check email service configuration and ensure:
- SMTP settings are correct
- Email templates exist
- Email service is accessible

### 6. **Skeleton Estate Creation Issues**
**Problem:** Registration fails when trying to create skeleton estate for executors.

**Error Location:** AuthService.register() line ~45-55

**Fix:** Make skeleton estate creation non-blocking:
```typescript
// CREATE SKELETON ESTATE FOR EXECUTORS
if (assignedRole === 'EXECUTOR') {
    try {
        await prisma.estate.create({
            data: {
                userId: user.id,
                deceasedFirstName: "",
                deceasedLastName: "Estate",
                deceasedState: state || "CA",
                status: "active"
            }
        });
    } catch (estateError: any) {
        logger.error("Failed to create skeleton estate:", estateError.message);
        // Continue registration even if estate creation fails
    }
}
```

### 7. **Role Assignment Issues**
**Problem:** User role assignment logic is complex and error-prone.

**Current Logic Issues:**
- Multiple role assignment paths
- Hard-coded email checks
- Inconsistent role/userType mapping

**Simplified Fix:**
```typescript
// Simplified role assignment
let assignedRole = role as any;
let assignedUserType = userType || "EXECUTOR";

if (!assignedRole) {
    if (assignedUserType === "ADVISOR") {
        assignedRole = 'ADVISOR';
    } else if (assignedUserType === "HEIR") {
        assignedRole = 'HEIR';
    } else {
        assignedRole = 'EXECUTOR';
    }
}
```

### 8. **Frontend State Management Issues**
**Problem:** Auth component state management is complex and can cause UI issues.

**Issues Found:**
- Multiple state variables for similar purposes
- Complex conditional rendering logic
- Inconsistent error handling

**Recommended Simplification:**
```typescript
// Simplified state management
const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    userType: null as UserType | null
});

const [errors, setErrors] = useState<Record<string, string>>({});
const [loading, setLoading] = useState(false);
```

### 9. **Environment Variable Issues**
**Problem:** Missing required environment variables.

**Required Variables:**
```
JWT_SECRET=your-secret-key
DATABASE_URL=your-database-url
NODE_ENV=development|production
APP_URL=http://localhost:5173
```

### 10. **CORS and Security Issues**
**Problem:** Registration fails due to CORS or security middleware.

**Solution:** Check server CORS configuration in `server/index.ts`:
```typescript
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

## Quick Debug Checklist

### Server-Side Checks:
- [ ] JWT_SECRET is set in environment
- [ ] DATABASE_URL is valid and accessible
- [ ] Email service is configured
- [ ] CORS allows frontend origin
- [ ] Server logs show no startup errors

### Client-Side Checks:
- [ ] Network tab shows successful API calls
- [ ] Console shows no JavaScript errors
- [ ] Form validation messages are clear
- [ ] Error handling provides helpful feedback

### Database Checks:
- [ ] Users table exists and is accessible
- [ ] Estates table exists (for skeleton creation)
- [ ] No duplicate email constraints violated

## Testing Registration Flow

### Manual Testing Steps:
1. Navigate to `/register` or `/auth?mode=signup`
2. Fill out registration form with valid data
3. Submit and verify success message
4. Check email for verification link
5. Verify user appears in database
6. Test login with new credentials

### Automated Testing:
```bash
# Run frontend tests
npm test -- --testPathPattern=Auth

# Run backend tests
npm test -- --testPathPattern=auth

# Test API endpoints
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","fullName":"Test User"}'
```

## Error Recovery

### If Registration Fails:
1. Check browser developer console for errors
2. Check server logs for detailed error messages
3. Verify all required fields are filled correctly
4. Try with different email address
5. Contact support with error details

### If Email Verification Fails:
1. Check spam folder
2. Verify email service configuration
3. Check server logs for email sending errors
4. Try resending verification email

This troubleshooting guide should help identify and resolve most common registration issues.