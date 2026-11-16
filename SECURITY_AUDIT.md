# Security Audit: Login & Register Logic

## 🔴 CRITICAL Issues

### 1. **Missing Email Verification**
**Severity: HIGH**
- Users can register with any email without verification
- Attackers can register with others' emails and claim ownership
- **Impact**: Account takeover, email spoofing, verification badge abuse

**Fix**:
```typescript
// Add email verification flow
interface IUser {
  email: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
}

// On register, send verification email
// Prevent login until email is verified (for agents especially)
```

### 2. **Password Strength Not Enforced**
**Severity: MEDIUM**
- Minimum 6 characters is too weak
- No complexity requirements (uppercase, numbers, symbols)
- Suggests "password123" is valid

**Fix**:
```typescript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const schema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(passwordRegex, "Must contain uppercase, lowercase, number, and symbol")
});
```

### 3. **Role Can Be Manipulated by Client**
**Severity: CRITICAL**
- Client sends `role: "agent"` in registration
- No server-side validation prevents anyone becoming an agent
- Agents get dashboard access and listing privileges

**Fix**:
```typescript
// NEVER trust client role selection
const user = await User.create({
  name,
  email: email.toLowerCase(),
  passwordHash,
  role: "buyer", // Always default to buyer
  // Agents must be manually approved by admin
  verificationStatus: "pending", // Require verification for agent features
});
```

---

## 🟠 MAJOR Issues

### 4. **No Rate Limiting on Login**
**Severity: HIGH**
- Only registration endpoint has rate limiting (8/hour)
- Login endpoint has NO rate limiting
- Enables brute force attacks on passwords

**Fix**:
```typescript
// Add to login route
const ip = getClientIp(req);
const { allowed } = await checkRateLimit({ 
  key: `login:${ip}`, 
  limit: 10,  // 10 attempts
  windowSeconds: 900  // per 15 minutes
});
if (!allowed) {
  return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
}

// Add failed attempt tracking
const { allowed: canRetry } = await checkRateLimit({
  key: `login-fail:${email}`,
  limit: 5,
  windowSeconds: 300
});
```

### 5. **Password Reset Token in URL (Plain Text)**
**Severity: HIGH**
- Reset token sent in plain text in email URL
- If email is intercepted, attacker can reset password
- Token not time-limited in frontend

**Fix**:
```typescript
// Current: ?token=abc123&email=user@example.com (EXPOSED in email)
// Better: Email contains link to frontend, frontend sends token in POST body (encrypted)

// Reset token should:
// 1. Have very short expiry (15-30 minutes, not 1 hour)
// 2. Be one-time use (delete after use)
// 3. Require user to know their email (not in URL)
```

### 6. **No CSRF Protection**
**Severity: MEDIUM**
- NextAuth provides CSRF by default, but verify it's enabled
- Custom endpoints might not have protection
- Check `.env` for proper cookie settings

**Fix**:
```typescript
// Ensure this is in middleware or route handlers
headers: {
  "X-CSRF-Token": "required",
}

// In next.config.mjs:
// headers: async () => [{
//   key: "X-Frame-Options",
//   value: "SAMEORIGIN",
// }]
```

---

## 🟡 MODERATE Issues

### 7. **No Login Audit Logging**
**Severity: MEDIUM**
- Can't detect suspicious login patterns
- No alerts for logins from new locations
- No track of failed attempts

**Fix**:
```typescript
// Create LoginAudit model
interface ILoginAudit {
  userId: ObjectId;
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  reason?: string; // "invalid_password", "account_suspended"
  createdAt: Date;
}

// Log every login attempt
await LoginAudit.create({
  userId: user._id,
  email: user.email,
  ip: getClientIp(req),
  userAgent: req.headers.get("user-agent"),
  success: passwordValid,
  reason: !passwordValid ? "invalid_password" : null,
});
```

### 8. **Session Not Invalidated on Password Change**
**Severity: MEDIUM**
- User can reset password but old sessions remain active
- User must manually log out to invalidate session
- Attacker with old token can still access account

**Fix**:
```typescript
// After password reset, invalidate all sessions
await invalidateUserSessions(user._id);

// Or use token version:
user.sessionVersion = (user.sessionVersion || 0) + 1;
await user.save();
// Include sessionVersion in JWT, reject if it doesn't match
```

### 9. **Account Enumeration via Email Verification**
**Severity: LOW-MEDIUM**
- Forgot password endpoint returns different response time for existing vs non-existing emails
- Attacker can enumerate registered emails (partially mitigated by generic response)
- Good: Returns `{ success: true }` for both cases (intentional)

**Current**: ✅ Good (generic response for both cases)

---

## 🔵 LOW Priority / Best Practices

### 10. **Missing Security Headers**
- No HSTS
- No Content-Security-Policy
- No X-Content-Type-Options

**Fix**: Add to `next.config.mjs`:
```javascript
headers: async () => [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]
```

### 11. **Missing Input Sanitization**
- User input sanitized by Zod (good)
- But consider HTML sanitization for name field to prevent stored XSS

**Fix**:
```bash
npm install sanitize-html
```

```typescript
import sanitize from 'sanitize-html';

const user = await User.create({
  name: sanitize(name, { allowedTags: [] }),
  // ... rest
});
```

### 12. **No 2FA/MFA for Agents**
**Severity: MEDIUM**
- Agents can list properties and receive inquiries
- No two-factor authentication available
- Anyone with password can access agent account

**Consider Adding**:
- Mandatory TOTP for agents
- Backup codes
- Session notifications

---

## ✅ What's Done Well

1. ✅ **Password hashing** - Using bcryptjs with proper salt rounds (10)
2. ✅ **Email not leaked** - Forgot password returns same response for existing/non-existing
3. ✅ **Rate limiting** - Implemented for registration
4. ✅ **Token hashing** - Reset tokens are SHA256 hashed, not stored plain
5. ✅ **Consent tracking** - NDPR compliance with `consentedToTermsAt`
6. ✅ **Input validation** - Zod schemas validate all inputs

---

## 🚀 Recommended Priority Fixes

**IMMEDIATE** (Do today):
1. ✅ Enforce role: "buyer" on registration (prevent agent privilege escalation)
2. ✅ Add email verification before account activation
3. ✅ Add rate limiting to login endpoint

**THIS WEEK**:
4. Add password strength requirements
5. Add login audit logging
6. Implement session invalidation on password reset
7. Fix password reset token (remove from URL, use POST body)

**THIS SPRINT**:
8. Add 2FA for agents
9. Add security headers
10. Add input sanitization
11. Set up login alerts (email on new device/location)

---

## Testing Checklist

- [ ] Register with weak password (e.g., "123") - should reject
- [ ] Register with existing email - should reject with 409
- [ ] Try to register as "agent" - should create as "buyer"
- [ ] Try brute force login - should hit rate limit
- [ ] Try password reset token replay - should fail (one-time use)
- [ ] Check no console errors exposing stack traces
- [ ] Verify HTTPS in production
- [ ] Test logout invalidates session immediately
