# Implementation map

## Foundation plan and execution

1. Inspect the original specification pack and remote repository; preserve the kit and any remote history.
2. Verify stable package/runtime compatibility; record decisions; install only the foundation dependencies and generate a lockfile.
3. Build the public entry point, strict TypeScript/check tooling, safe environment validation, and a timezone-aware calendar boundary.
4. Run a frozen fresh install, type/lint/unit/build checks, and production-browser inspection; record actual results and hand off.

## Current boundaries

| Location | Responsibility |
| --- | --- |
| `src/app/` | Public introduction, unavailable/error states, Node route handlers |
| `src/app/api/v1/health/route.ts` | Secret-free process liveness, not database readiness |
| `src/server/config/environment.ts` | `server-only` process environment access |
| `src/server/config/schema.ts` | Pure schema validation and sanitized field-name diagnostics; no provider calls |
| `src/instrumentation.ts` | Runtime validation and production live database/key availability guard |
| `src/shared/time/calendar.ts` | IANA local date and half-open UTC day boundaries using Luxon |
| `scripts/check-config.ts` | CLI environment check using Next's env loader without printing inputs |
| `tests/unit/` | Configuration safety and real timezone/DST boundaries |
| `tests/e2e/` | Public foundation, liveness, keyboard, responsive reflow, screenshots |

## Next implementation steps

The visual-system work is implemented in `src/components/ui`, `src/components/layout` and `src/features/shell`. Its execution plan was: extend the existing entry point and tokens, add self-hosted typography and Radix primitives, compose responsive navigation/agenda/editor, then review development fixtures separately from production isolation. The reusable controls are styled once; the preview state, draft schema and fixture import stay separate from future domain services.

`src/app/dev/shell/page.tsx` denies production requests before dynamically importing server-only fixtures. No application auth bypass was introduced. Navigation destinations retain selected date/domain and use explicit availability panels where real workflows are not built. The temporary editor validates only the visible scheduled branch, preserves failed input, and returns focus to a connected trigger or the persistent quick-add action. Completed sample schedules are read-only. Fixture totals are fixed layout examples and never recalculated into rewards.

Follow the 12 existing stages in `PHASES.md`, with scope authorized separately. Add dependencies only when consumed. Authentication now uses stable NextAuth v4 and official MongoDB encryption, with live KMS/native-container gates outstanding. Future routes call shared authorized services, never raw repositories directly from client code. Scheduling feeds the one transactional completion service; analytics and friendships consume its server-derived projections.

The public preview remains `APP_MODE=foundation`; `live` adds strict Google/Atlas/encryption prerequisites. There is no test/demo identity hook. Placeholder settings are unused by the public preview and rejected in live mode. `test:e2e` uses a production server for public/private isolation; `test:shell` reviews synthetic layouts; `test:auth` tests installed protocol routes with synthetic configuration and no valid session. Local database tests exercise real native encryption/replica-set persistence, separate from blocked live Google/Atlas/KMS checks.

## Account implementation plan and execution

1. Inspect the completed shell/contracts; verify stable NextAuth v4 and official native driver/encryption compatibility.
2. Add live configuration, server-only encrypted identity/HMAC lookup, pooled TLS MongoDB, checksummed migration and retry-safe user/key/domain reservations.
3. Wire the library's Google OIDC protocol, minimal JWT callbacks, repository authorization/revocation, protected account handoff and no-store APIs. Add canonical origin, bounded bodies, fixed redirects/scopes, CSRF and signed-browser/shared rate buckets.
4. Exercise real isolated replica-set encryption, races/denial/revocation/tampering, protocol failures and responsive browser states; review security independently, document external gates and setup.

`src/server/auth` owns claims/OIDC configuration and session verification; `accounts/service` derives the owner, and `accounts/repository` enforces active status/version before decrypting. `encryption/payloads` uses official randomized CSFLE and validates inner owner/document/kind/version binding. `database` pools connections and verifies migrations/indexes. HTTP handlers accept no owner IDs and emit sanitized errors/DTOs. The public and account pages contain no synthetic authenticated records.

`db:migrate` records the account migration ID and checksum of actual schema/index definitions. `encryption:verify` requires dedicated verification namespaces and inspects raw BSON without auto-decryption. Live production startup checks real DB/key availability before the port is opened by the documented command; instrumentation adds a direct-Next guard. The Linux native probe is reviewable but unrun without Docker. Google/Atlas/KMS/staging configuration remains human setup.

## Rules to preserve

`GAMIFICATION.md` defines reward/time/analytics authority; `SECURITY.md` defines data classification and encryption. Browser code never reads process secrets or calculates authoritative XP. Keep future credentials, private data and key access in server-only modules. Authenticate at service/repository boundaries before decryption. No private content in URL parameters, logs, browser persistence, screenshots, or shared caches.
