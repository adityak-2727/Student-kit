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

The visual-system work is implemented in `src/components/ui`, `src/components/layout` and `src/features/shell`. Its execution plan was: extend the existing entry point and tokens, add self-hosted typography and Radix primitives, compose responsive navigation/agenda/editor, then review development fixtures separately from production isolation. The reusable controls are styled once; the preview state, draft schema and fixture import stay separate from future domain services.

`src/app/dev/shell/page.tsx` denies production requests before dynamically importing server-only fixtures. No application auth bypass was introduced. Navigation destinations retain selected date/domain and use explicit availability panels where real workflows are not built. The temporary editor validates only the visible scheduled branch, preserves failed input, and returns focus to a connected trigger or the persistent quick-add action. Completed sample schedules are read-only. Fixture totals are fixed layout examples and never recalculated into rewards.

Follow the 12 existing stages in `PHASES.md`, with scope authorized separately. Add feature dependencies only when consumed. Next, authentication adds stable NextAuth v4 and official MongoDB encryption, then proves native and KMS compatibility. Future routes call shared authorized services, never raw repositories directly from client code. Scheduling feeds the one transactional completion service. Analytics and friendships consume its server-derived projections.

The root is an explicitly labelled development preview. `APP_MODE=foundation` is the only supported mode. It cannot authenticate or save records. There is no test/demo authentication hook. Placeholder integration settings are intentionally unused by the public scaffold; the separate integration preflight rejects them. Database readiness, migrations, integration tests, CSFLE, Google login, and staging are future work, without placeholder success scripts. `test:e2e` uses a production server for the public surface/isolation gate; `test:shell` uses a separate development server for fixture-only interactions. A fixture pass is never provider evidence.

## Rules to preserve

`GAMIFICATION.md` defines reward/time/analytics authority; `SECURITY.md` defines data classification and encryption. Browser code never reads process secrets or calculates authoritative XP. Keep future credentials, private data and key access in server-only modules. Authenticate at service/repository boundaries before decryption. No private content in URL parameters, logs, browser persistence, screenshots, or shared caches.
