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
| `src/instrumentation.ts` | Validate supported foundation runtime configuration at Node startup |
| `src/shared/time/calendar.ts` | IANA local date and half-open UTC day boundaries using Luxon |
| `scripts/check-config.ts` | CLI environment check using Next's env loader without printing inputs |
| `tests/unit/` | Configuration safety and real timezone/DST boundaries |
| `tests/e2e/` | Public foundation, liveness, keyboard, responsive reflow, screenshots |

## Next implementation steps

Follow the 12 existing stages in `PHASES.md`, with scope authorized separately. Add feature dependencies only when consumed. The visual shell adds bundled licensed fonts and Radix primitives; authentication adds stable NextAuth v4 and official MongoDB encryption, then proves native and KMS compatibility. Future routes call shared authorized services, never raw repositories directly from client code. Scheduling feeds the one transactional completion service. Analytics and friendships consume its server-derived projections.

The root is an explicitly labelled development preview. `APP_MODE=foundation` is the only supported mode. It cannot authenticate or save records. There is no test/demo authentication hook. Placeholder integration settings are intentionally unused by the public scaffold; the separate integration preflight rejects them. Database readiness, migrations, integration tests, CSFLE, Google login, and staging are future work, without placeholder success scripts.

## Rules to preserve

`GAMIFICATION.md` defines reward/time/analytics authority; `SECURITY.md` defines data classification and encryption. Browser code never reads process secrets or calculates authoritative XP. Keep future credentials, private data and key access in server-only modules. Authenticate at service/repository boundaries before decryption. No private content in URL parameters, logs, browser persistence, screenshots, or shared caches.
