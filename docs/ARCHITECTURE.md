# Architecture

## Decisions

Build one full-stack TypeScript application. The browser presents data and requests changes; authenticated server services own authorization, encryption, rewards, and analytics. MongoDB Atlas is the production database. Do not introduce a second database or a microservice fleet for version 1.

Proposed stack; verify current stable compatibility during Phase 1 rather than copying historical version numbers:

| Concern | Default |
| --- | --- |
| Web | Next.js App Router, React, TypeScript strict mode, Node runtime |
| Styling | Tailwind CSS plus a documented token system |
| Controls | Radix-based accessible primitives, customized to DESIGN.md |
| Motion | Motion for React, CSS for simple transitions |
| Charts | Recharts with accessible summaries and tables |
| Forms | React Hook Form and Zod |
| Persistence | Official MongoDB Node driver; explicit schemas and indexes |
| Authentication | Auth.js Google OIDC with JWT session strategy, subject to stable-version verification |
| Field encryption | Official MongoDB ClientEncryption/CSFLE, explicit randomized encryption |
| Dates | One timezone-aware library, chosen and tested in Phase 1 |
| Tests | Vitest, Testing Library, Playwright, axe accessibility checks |
| Package manager | pnpm, version recorded in packageManager and lockfile |
| Deployment | Containerized Node app as a portable baseline; managed host chosen after native encryption compatibility check |

Do not install every dependency immediately. Choose supported versions, document them, and add feature dependencies when used. Do not mix Auth.js v4 and v5 examples. If a currently stable auth integration cannot satisfy this plan, propose and record one supported replacement before wiring identity; preserve the Google-only flow and encrypted profile contract.

The recommended authorization boundary follows Next.js's [authentication guidance](https://nextjs.org/docs/app/guides/authentication): access checks belong near data access, and client responses should expose only required fields.

## Boundaries

```text
Browser / server-rendered pages
           |
Authenticated route handlers
           |
Domain services: owner checks, validation, transactions, policies
           |
Repositories: owner-scoped queries + private payload encryption
           |
MongoDB Atlas ----- encrypted data-key vault
                          |
                     external KMS
```

Use Route Handlers for the documented API. Server-rendered pages may call the same service functions directly. Do not implement a second mutation path with different business rules. Use server-only modules to prevent bundling database and key code into the browser. No database access from Edge runtime unless the chosen driver/encryption path explicitly supports it and is verified; the baseline is Node.

Private responses use `Cache-Control: private, no-store`; no shared/static cache of user data. Client cache keys include authenticated account identity. On logout or account change, clear private in-memory caches and cancel pending requests. Optimistic UI may show “Saving”; XP/streak changes and celebrations wait for a confirmed server result.

## Suggested repository structure

```text
src/
  app/
    (public)/              # landing, sign-in, privacy
    (app)/                 # protected Today, Study, domains, analytics, friends
    api/                   # thin authenticated HTTP handlers
  components/
    ui/                    # styled accessible primitives
    layout/
    charts/
    avatar/
  features/
    study/ schedule/ domains/ friends/ analytics/ profile/
  server/
    auth/                  # Google integration, session verification
    services/              # completion, planning, friendships, analytics
    repositories/          # owner-scoped persistence, DTO projection
    encryption/            # official-library wrapper + key provider
    db/                    # pooled connection, migrations, indexes
  shared/
    schemas/               # input/output types and validation
    time/                  # IANA timezone/day-key helpers
    rules/                 # pure domain calculations, no secrets
tests/
  unit/ integration/ e2e/ fixtures/
scripts/                   # migrations, demo seed, aggregate rebuild
docs/
```

These are boundaries, not a demand for empty directory scaffolding. Prefer cohesive modules over dozens of tiny wrappers.

## Identity and sessions

Use the auth library's verified Google identity. Map `(issuer, sub)` to an internal user ID using a versioned server-side HMAC lookup. Never identify accounts by email. Store the original subject and private profile in the encrypted payload for future lookup-key migration. The provider subject is stable identity; Google explicitly warns against using email as the unique account key in its [OIDC documentation](https://developers.google.com/identity/openid-connect/openid-connect).

Baseline: library-managed JWT sessions containing only internal ID, sessionVersion, issued/expiry metadata. Do not persist Google access/refresh tokens when no Google API access is needed. Read `users` on protected service calls to enforce active status and sessionVersion, supporting logout-all/deletion. Do not copy Google email/name into session payloads or public user DTOs. Adapt library callbacks with tests; use its protocol and cookie implementation rather than handwritten OAuth or JWT cryptography.

This baseline intentionally does not use a generic auth database adapter that might store raw provider profile fields. If an adapter is adopted, its storage transformations and behavior require an explicit security review and documented field coverage.

## State, transactions, and scheduling

Model task templates and scheduled occurrences separately. Each occurrence has stable identity; changing a list order cannot create a second reward. Weekly recurrence expands a bounded horizon (for example, the next 60 days), on creation and idempotently on read. Never generate an infinite series. Completed past occurrences remain stable when the series is edited. MVP recurrence edits support “this occurrence” and “this and future pending occurrences,” with preview and explicit boundaries.

Use native driver transactions for completion state, ledger, daily activity, and aggregate revision. Run operations within a transaction sequentially. Driver retries mean the callback must not send notifications or perform non-idempotent external effects; create those effects after commit. The [MongoDB driver transaction documentation](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/) describes transaction atomicity and retry behavior.

Serialize a user's reward mutations with a shared per-user reward revision document updated inside each transaction; this prevents two different tasks racing to corrupt a daily count. Unique keys still protect the individual completion identity and operation id. Multi-instance rate limiting must use shared storage, not process memory alone; an atomic MongoDB fixed-window counter with explicit expiry comparison is sufficient at the intended initial scale. TTL cleanup does not replace expiry checking.

Self-reported-minutes edits acquire that same per-user transactional lock. Validate the daily total after owner-authorized decryption under the lock, including concurrent edits, undo, and recompletion, so two individually valid changes cannot jointly exceed the daily cap.

Store authoritative records and rebuildable projections. Analytics and leaderboard totals are projections from the same completion/ledger sources, never independently incremented in the browser. Compute current streak at read time from qualifying days so inactivity does not require a midnight cron job. Use pagination, bounded date ranges, and compound indexes. A small scheduled maintenance job may extend calendars or reconcile aggregates later, but the core app must function without it.

## Operational requirements

- Pool/reuse the MongoClient per server process. Bound connection and request timeouts; never reveal connection strings in exceptions.
- Separate dev, test, staging, and production databases and keys. Seed scripts refuse production by default and require a conspicuous explicit environment guard.
- Log event codes, durations, sanitized IDs, and errors without private content or tokens. Add health/readiness checks with no sensitive payload.
- Include migrations, unique-index creation, aggregate reconciliation, container configuration, CI, and a documented backup/restore procedure.
- Use static asset caching; authenticated HTML and JSON remain private. PWA installation is optional; offline private-data synchronization is out of scope for version 1.
- No push/email reminders by default. In-app upcoming/missed indicators are required. Add external notifications later only with consent and a reliable delivery model.
