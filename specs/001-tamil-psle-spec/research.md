# Research: TamilPSLE Exam-Prep App

**Branch**: `001-tamil-psle-spec` | **Date**: 2026-01-16 | **Spec**: [spec.md](./spec.md)

---

## Technology Decisions & Rationale

### Framework: Next.js 14+ (App Router)

**Decision**: Use Next.js with App Router for a fullstack TypeScript monorepo.

**Rationale**:
- Server Components reduce client-side JavaScript bundle for faster initial load
- App Router provides built-in layouts for consistent dashboard structure across roles
- API routes co-located in same codebase simplifies deployment and type sharing
- Excellent Vercel integration for zero-config deployment
- Strong TypeScript support with strict mode
- Established patterns from shadcn/ui ecosystem

**Alternatives Considered**:
| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Remix | Better data loading patterns | Smaller ecosystem, fewer component libraries | shadcn/ui optimized for Next.js |
| SvelteKit | Smaller bundle, fast runtime | Team unfamiliarity, TypeScript less mature | Learning curve risk for 1-week MVP |
| Vite + React | Faster dev server | No SSR, separate API deployment needed | Increased complexity |

---

### Backend: Supabase (PostgreSQL + Auth + Storage)

**Decision**: Use Supabase as the primary backend platform.

**Rationale**:
- Built-in Row Level Security (RLS) satisfies constitution's security-by-default principle
- Auth with email/password and role management out-of-the-box
- PostgreSQL supports ENUM types for sections, roles, status
- Real-time subscriptions available for future features (not MVP)
- Storage bucket available for OCR image uploads with access control
- Free tier sufficient for MVP (<100 users)

**RLS Strategy**:
- Every table with user data has RLS enabled
- Policies enforce: students see own data, teachers see class data, admins see all
- `auth.uid()` used for all ownership checks
- No service_role key exposed to client

**Alternatives Considered**:
| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Firebase | Familiar to many | NoSQL, RLS-like rules more complex | PostgreSQL relational model better for this domain |
| PlanetScale | Serverless MySQL | No built-in auth, need separate solution | Additional integration complexity |
| Self-hosted Postgres | Full control | DevOps overhead, security burden | Not viable for 1-week timeline |

---

### AI: Gemini 2.0 Flash API

**Decision**: Use Gemini 2.0 Flash for word meanings and OCR assist.

**Rationale**:
- Fast response times (<2s target for word meaning)
- Multimodal capability for OCR image extraction
- Cost-effective for high-volume word lookups
- Good Tamil language understanding
- Simple REST API with JSON responses

**Usage Patterns**:
1. **Word Meaning**: Low-latency, high-frequency (60/min/user limit)
   - Structured JSON output with Zod validation
   - Caching by (word + context_hash + language_mode)
   - Target 70%+ cache hit rate after warm-up

2. **OCR Assist**: Higher latency acceptable, low-frequency (10/min/user limit)
   - Image upload → structured MCQ extraction
   - Human review required before publishing

**API Key Security**:
- Keys stored in environment variables
- Only accessed from API routes (server-side)
- Never bundled in client JavaScript
- Rate limiting enforced before API calls

**Alternatives Considered**:
| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| OpenAI GPT-4 | Strong reasoning | Higher latency, cost | Gemini better price/performance for this use case |
| Claude API | Strong language | No native multimodal (images) | OCR assist requires image input |
| Local LLM | Privacy, no API cost | GPU required, complexity | Not viable for 1-week MVP |

---

### UI Framework: shadcn/ui + Tailwind CSS

**Decision**: Use shadcn/ui component library with Tailwind CSS.

**Rationale**:
- Components are copied into codebase, not dependencies (full control)
- Consistent, accessible design out-of-the-box
- Tailwind utility classes enable rapid styling
- Dark mode support (defer to post-MVP)
- Radix UI primitives for accessibility (popovers, dialogs, etc.)

**Key Components Needed**:
- Button, Card, Dialog, Popover (for word meanings)
- Form, Input, Select (for question entry)
- Table, DataTable (for results/roster views)
- Toast (for feedback messages)

---

### Testing: Playwright

**Decision**: Use Playwright for E2E smoke tests.

**Rationale**:
- Cross-browser testing (Chrome, Safari, Firefox)
- Good TypeScript support
- Page Object Model for maintainable tests
- CI integration via GitHub Actions
- Can test authenticated flows with test users

**Smoke Test Coverage (Day 7)**:
1. Login/logout flow
2. Student practice session (start → answer → submit)
3. Hover/tap word meaning lookup
4. Class join (student)
5. Assignment completion (student)
6. Teacher results view
7. Admin question creation
8. CSV import

---

### Deployment: Vercel

**Decision**: Deploy to Vercel.

**Rationale**:
- Zero-config Next.js deployment
- Preview deployments for PR review
- Edge functions for API routes (low latency)
- Built-in analytics (optional)
- Free tier sufficient for MVP

**Environment Configuration**:
- Production: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`
- Preview: Same with test Supabase project
- All secrets via Vercel environment variables (not committed)

---

## Tamil Text Handling

### Tokenization Strategy

**Challenge**: Tamil words need to be individually wrapped for hover/tap meaning lookup.

**Approach**:
1. Split text on whitespace and punctuation
2. Wrap each token in a `<span>` with hover/click handlers
3. Detect Tamil script using Unicode range (U+0B80-U+0BFF)
4. Non-Tamil tokens rendered without hover functionality

**Implementation**:
```typescript
// Pseudocode for TokenizedText component
const tamilPattern = /[\u0B80-\u0BFF]+/g;
const tokens = text.split(/(\s+|[,.:;!?])/);
// Each Tamil token wrapped with hover handler
```

### Context Window

**For word meaning requests**:
- Extract 2-3 words before and after the target word
- If at sentence boundary, include full sentence instead
- Hash context for cache key generation (MD5 or similar)

---

## Rate Limiting Strategy

**Implementation**: Token bucket algorithm per user

**Word Meaning API** (`/api/meaning`):
- 60 requests per minute per authenticated user
- Store counter in Supabase or memory (redis-like)
- Return 429 with friendly message when exceeded

**OCR Assist API** (`/api/admin/ocr-assist`):
- 10 requests per minute per admin user
- Higher cost per call justifies lower limit

**Implementation Options**:
| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Upstash Redis | Fast, serverless | Additional service | Consider post-MVP |
| Supabase table | No new service | Slightly slower | MVP choice |
| In-memory Map | Fastest | Lost on redeploy | Not suitable |

**MVP Implementation**: Use a simple `rate_limits` table in Supabase with (user_id, endpoint, window_start, count). Check and increment atomically.

---

## Caching Strategy

### Word Sense Cache

**Key Structure**: `(word_normalized, context_hash, language_mode)`

**Normalization**:
- Lowercase (though Tamil doesn't have case, normalize spacing)
- Remove leading/trailing punctuation
- Trim whitespace

**Context Hashing**:
- Take 2-3 words before + after
- MD5 or SHA-256 hash for fixed-length key
- Include original sentence if short (<50 chars)

**Cache Invalidation**: No invalidation for MVP (meanings don't change)

**Target Metrics**:
- 70%+ hit rate after warm-up period
- <50ms for cache hits
- <2s for cache misses (includes AI call)

---

## Question Selection Algorithm

**Adaptive Selection** (per FR-030):

```
1. Get all published questions for selected section(s)
2. Filter by assignment criteria if assignment context
3. Prioritize:
   a) Questions student answered INCORRECTLY in past attempts
   b) Questions student has NEVER seen
   c) Random from remaining pool
4. Limit to requested count (default 10)
5. Shuffle final selection
```

**SQL Implementation**:
```sql
-- Pseudocode for question selection
WITH scored_questions AS (
  SELECT q.id,
    CASE
      WHEN EXISTS (incorrect attempt) THEN 3  -- highest priority
      WHEN NOT EXISTS (any attempt) THEN 2    -- medium priority
      ELSE 1                                   -- lowest priority
    END as priority
  FROM questions q
  WHERE q.section = ANY($sections)
    AND q.status = 'published'
)
SELECT id FROM scored_questions
ORDER BY priority DESC, random()
LIMIT $count;
```

---

## Security Considerations

### OWASP Top 10 Mitigations

| Vulnerability | Mitigation |
|--------------|------------|
| Injection | Supabase parameterized queries; Zod validation |
| Broken Auth | Supabase Auth with email verification |
| Sensitive Data Exposure | RLS, no PII logging, API keys server-only |
| XML External Entities | Not applicable (JSON only) |
| Broken Access Control | RLS policies on all tables |
| Security Misconfiguration | Strict TypeScript, ESLint rules |
| XSS | React's default escaping; CSP headers |
| Insecure Deserialization | Zod schema validation on all inputs |
| Using Components with Vulnerabilities | npm audit in CI |
| Insufficient Logging | Request IDs, status codes (no PII) |

### Additional Security Measures

1. **CORS**: Configure for production domain only
2. **CSP**: Add Content-Security-Policy headers
3. **Image Uploads**: Validate MIME type, max 5MB, ephemeral storage
4. **Join Codes**: Cryptographically random, 6 chars, alphanumeric

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Word meaning response | <2 seconds | P95 latency |
| Practice session load | <3 seconds | Time to interactive |
| Cache hit rate | 70%+ | After warm-up |
| Concurrent users | <100 | MVP scale |

---

## Open Questions (Resolved)

All clarifications resolved in spec.md:

1. **Question ordering** → Adaptive selection (incorrect → unseen → random)
2. **Assignment retries** → Teacher-configurable 1-3 attempts
3. **Default role** → All signups default to student

---

## References

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Playwright Testing](https://playwright.dev/)
- [Tamil Unicode Block](https://en.wikipedia.org/wiki/Tamil_(Unicode_block))

---

**Research Status**: Complete | **Last Updated**: 2026-01-16
