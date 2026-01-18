# Security Implementation

**Document Version**: 1.0
**Last Updated**: 2026-01-19

This document describes the security measures implemented in the TamilPSLE application.

---

## Overview

Security is implemented at multiple layers following defense-in-depth principles:
1. **Frontend** - Input validation, secure cookies, no credential exposure
2. **Backend** - Authentication, authorization, rate limiting, parameterized queries
3. **Infrastructure** - Security headers, HTTPS enforcement

---

## Security Checklist Status

| Category | Item | Status | Implementation |
|----------|------|--------|----------------|
| **Frontend** | HTTPS everywhere | ✅ | Vercel enforces HTTPS |
| **Frontend** | Input validation | ✅ | Zod schemas on all API endpoints |
| **Frontend** | No sensitive data in browser | ✅ | Supabase handles auth tokens |
| **Frontend** | CSRF protection | ✅ | SameSite cookies via Supabase SSR |
| **Frontend** | API keys server-side only | ✅ | `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Frontend** | No credentials in frontend | ✅ | Only `NEXT_PUBLIC_*` vars exposed |
| **Backend** | Password hashing | ✅ | Supabase Auth (bcrypt) |
| **Backend** | Authorization verification | ✅ | Role checks in all protected routes |
| **Backend** | API endpoint protection | ✅ | `getUser()` check on all routes |
| **Backend** | SQL injection prevention | ✅ | Supabase parameterized queries |
| **Backend** | Security headers | ✅ | Configured in `next.config.ts` |
| **Backend** | Rate limiting | ✅ | Applied to all write/AI endpoints |
| **Practical** | Error handling | ✅ | Generic messages, no stack traces |
| **Practical** | Secure cookies | ✅ | HttpOnly, Secure, SameSite |
| **Practical** | File upload validation | ✅ | Type, extension, size validation |

---

## Implementation Details

### 1. Security Headers (`next.config.ts`)

```typescript
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' }
];
```

**Purpose**:
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Legacy XSS protection
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Disables unused browser features

### 2. Rate Limiting (`src/lib/rate-limit.ts`)

Rate limits are applied per-user per-endpoint:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Standard API | 100 req | 1 min |
| Write operations | 30 req | 1 min |
| Admin operations | 50 req | 1 min |
| Meaning API (AI) | 60 req | 1 min |
| OCR API (AI) | 10 req | 1 min |
| Auth operations | 10 req | 1 min |

**Applied to routes**:
- `POST /api/attempts` - write
- `POST /api/classes` - write
- `POST /api/assignments` - write
- `POST /api/admin/questions` - admin
- `POST /api/meaning` - meaning (AI)
- `POST /api/admin/ocr-assist` - ocr (AI)

### 3. File Upload Validation (`src/components/image-upload.tsx`)

```typescript
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

function validateFile(file: File): ValidationError | null {
  // 1. Check file size
  // 2. Check MIME type
  // 3. Check file extension (defense in depth)
}
```

### 4. Input Validation (Zod Schemas)

All API endpoints validate input using Zod schemas:

**Location**: `src/lib/validators/`
- `meaning.ts` - Word meaning request validation
- `questions.ts` - Question creation validation
- `attempts.ts` - Attempt submission validation
- `assignments.ts` - Assignment creation validation

**Example**:
```typescript
const CreateQuestionSchema = z.object({
  section: z.enum(['vetrumai', ...]),
  question_text: z.string().min(1),
  options: z.array(z.object({...})).min(2),
  status: z.enum(['draft', 'published']),
});
```

### 5. Row-Level Security (RLS)

All database tables have RLS policies defined in `supabase/migrations/006_rls_policies.sql`:

| Table | Policy Summary |
|-------|----------------|
| `profiles` | Users read/update own; teachers see class members; admins see all |
| `questions` | Students read published; admins manage all |
| `attempts` | Users manage own; teachers see class students |
| `classes` | Teachers manage own; students see joined |
| `assignments` | Teachers manage class assignments; students see class assignments |

### 6. Authentication Flow

1. **Supabase Auth** handles user registration/login
2. **Middleware** (`src/middleware.ts`) protects dashboard routes
3. **API Routes** verify auth via `supabase.auth.getUser()`
4. **Role checks** verify `profile.role` for teacher/admin routes

---

## Environment Variables

| Variable | Exposure | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin API access |
| `GEMINI_API_KEY` | Server only | AI API access |
| `NEXT_PUBLIC_APP_URL` | Public | App URL for redirects |

---

## Future Improvements

1. **Redis-based rate limiting** - For horizontal scaling
2. **Content Security Policy (CSP)** - Restrict script sources
3. **Dependency scanning** - Automated vulnerability alerts (Dependabot)
4. **Penetration testing** - Before production launch
5. **Audit logging** - Track sensitive operations

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
