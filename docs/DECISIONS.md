# Initial decisions and change log

These are suggested defaults to make implementation concrete. The original user requested student domains, deep college study organization, self-study scheduling, XP, self-study-only streaks, friends/rankings, Google login, MongoDB online, encryption, analytics, avatars, a crafted white/light-blue theme, and mobile support. The user additionally requested exactly 12 development phases. Other specifics below are proposed implementation decisions, not claims that the user explicitly chose them.

| ID | Default | Reason / consequence |
| --- | --- | --- |
| D01 | Working name Daylight | Gives copy/design a coherent temporary identity; check naming before launch |
| D02 | Next.js TypeScript Node monolith + MongoDB native driver | One deployable application with clear server boundaries |
| D03 | Verify stable versions before coding; pin lockfile | Avoid incompatible generated examples and blindly copied prerelease auth APIs |
| D04 | +20XP per actionable completion, optional level per 200XP | Simple transparent rules; no inferred effort score |
| D05 | Same-day scheduled self-study only extends streak | Matches the core distinction; one valid session is enough |
| D06 | Confirmed account timezone fixed in v1 | Stable historical calendar semantics; travel support is future work |
| D07 | Direct leaf mastery may earn once; imported session is separate work | Supports college progress and revision without duplicate automatic awards |
| D08 | Freeze schedule/category after first successful completion | Undo and replay cannot move old credit between days |
| D09 | Private fields use official randomized CSFLE; operational metadata stays queryable | Storage remains encrypted; server-side scheduling and rankings remain practical; not E2EE |
| D10 | Google OIDC via maintained library, JWT session, no generic DB adapter baseline | Avoid raw profile persistence and unnecessary provider tokens |
| D11 | Discovery and friend metric sharing off until opted in | Student privacy is explicit |
| D12 | White/blue, Manrope with restrained Newsreader accent, custom accessible primitives | Concrete design direction without replacing native semantics |
| D13 | Same-date study sessions, weekly recurrence, one linked leaf per session | Manageable v1 scheduler; split overnight/multi-topic work into sessions |
| D14 | Optional self-reported minutes, no timer claim | Meaningful analytics without pretending planned time is actual time |
| D15 | Finance manual amounts/budget in one currency; no banking | Useful student tracking without unrelated integrations |
| D16 | Container Node hosting baseline, external KMS in production | Native encryption compatibility checked early; final host/cost remains a setup decision |
| D17 | Student-focused UX without enrollment verification | Google account does not prove student status |
| D18 | No public feed, chat, runtime AI, push/email delivery, or offline sync in v1 | Keeps the requested core build achievable |

## Changes during implementation

### 14 October 2026 — verified foundation baseline

- D03: Node 24 LTS is the runtime line; this machine runs 24.13.0. `engines` permits compatible 24.x patches and `.node-version` records the tested runtime. Prefer the latest security-patched 24.x when provisioning. pnpm 12.11.2 is pinned in `packageManager`, with exact direct dependency versions and `pnpm-lock.yaml`.
- Selected Next.js 16.4.0 and React/React DOM 19.3.0 from stable registry tags and official documentation. Next requires Node >=20.9; the future MongoDB 7 components require >=20.19; Node 24 meets both. TypeScript 5.9.3 is a conservative supported stable baseline (not the newer 7.0 compiler), with strict, unchecked-index and exact-optional checks. Compatibility is additionally exercised by the actual typecheck/build.
- D10: Use stable `next-auth` 4.24.15 and its v4 API when implementing Google identity, rather than v5's beta install path. Registry peers explicitly include Next 16 and React 19. Preserve JWT session minimization, Google issuer/subject mapping, encrypted profile payloads, no generic plaintext adapter, and supported protocol protections. Application `AUTH_*` settings will map explicitly to v4 options; configure `NEXTAUTH_URL` from validated `APP_ORIGIN`. No auth dependency is installed yet.
- Date library: Luxon 3.7.2 uses Node's IANA/Intl timezone support. Day boundaries add calendar days rather than 24-hour durations. Local midnight and 23/25-hour DST day tests form the first evidence. Manual ambiguous/nonexistent scheduling input and recurrence policy remain for the scheduling implementation; these helpers do not guess wall-time offsets.
- D16: Reserve MongoDB 7.7.0 with `mongodb-client-encryption` 7.2.1 (official 7.x component compatibility). They are not needed for the scaffold and are not installed. Native loading, real CSFLE, tampering, container packaging, KMS and backup recovery remain unverified risks to prove before data persistence. Target a Node 24 Debian/glibc container; no host, paid resource, or public deployment selected.
- Runtime mode reconciliation: the original env template's `APP_MODE=live` would imply services that do not exist. Replace it with explicit `foundation` for this build, reject live/demo and any authentication bypass, and leave integration placeholders unused by the public scaffold. Later live-mode introduction requires the security gates in `SECURITY.md`; there is no silent fallback. Production integration preflight rejects local encryption keys. Foundation startup validates only the settings used by this credential-free public surface.
- The product, XP, streak, privacy, and data-model contracts have no conflicting rule requiring a change. Full design tokens/primitives and Manrope/Newsreader self-hosting remain for the visual-system work; this entry point uses local system fonts without remote requests.

| Concern | Verified version / choice | Official evidence |
| --- | --- | --- |
| Runtime | Node 24.x; executed 24.13.0 | [Node releases](https://nodejs.org/en/about/previous-releases) |
| Web | Next 16.4.0, React/DOM 19.3.0 | [Next installation](https://nextjs.org/docs/app/getting-started/installation), [React versions](https://react.dev/versions) |
| Compiler / package manager | TypeScript 5.9.3, pnpm 12.11.2 | Stable npm registry version and engine metadata; [TypeScript releases](https://github.com/microsoft/TypeScript/releases), [pnpm installation](https://pnpm.io/installation) |
| CSS / schema | Tailwind + PostCSS 4.3.3; Zod 4.6.7 | [Tailwind Next guide](https://tailwindcss.com/docs/installation/framework-guides/nextjs), [Zod](https://zod.dev/) |
| Auth, deferred | NextAuth 4.24.15; v5 5.0.0-beta.32 not selected | [v4 introduction](https://next-auth.js.org/getting-started/introduction), [v5 beta reference](https://authjs.dev/reference/nextjs); stable registry peer metadata |
| Driver/encryption, deferred | MongoDB 7.7.0 / encryption 7.2.1 | [Official component matrix](https://github.com/mongodb/node-mongodb-native#component-support-matrix); registry engine metadata |
| Dates | Luxon 3.7.2 | [Official API including IANAZone and DateTime](https://moment.github.io/luxon/api-docs/index.html) |
| Checks | ESLint 9.39.5, matching Next config 16.4.0, Vitest 5.0.4, Playwright 1.64.0 | Stable registry engine/peer metadata; Node 24 meets Vitest ^24 and Playwright >=20 |

Radix, Motion, Recharts, React Hook Form, and native database/auth dependencies are deferred until used. Lockfile peer resolution plus actual checks verify the installed subset; registry compatibility alone is not live-integration evidence.

Installer follow-up: pnpm 12 requires non-auth settings in `pnpm-workspace.yaml`, so exact-version, strict engine/peer checks and one reviewed native build (`unrs-resolver@1.12.2`, used by the linter) are configured there. No blanket build-script permission is enabled. ESLint 9.39.5 is the newest 9.x patch; Next's installed React and JSX accessibility plugins still declare only ESLint <=9, so adopting 10.12.0 would violate their peer contracts. Recheck that boundary with a future Next tooling update.

Startup verification: Next instrumentation aborts request preparation for invalid configuration but Next can still bind a port before that error. Dev/build/start therefore run the configuration CLI first, which terminates with exit 1 before launching Next for invalid settings. The instrumentation hook remains a secondary runtime defense.

Append an entry for material changes: date, affected decision, reason, options considered, chosen behavior, migration/test implications, and user-facing impact. Do not create an architecture document for every small styling choice. Reconcile edits across PRODUCT, GAMIFICATION, DATA-MODEL, API, SECURITY, and tests whenever behavior changes.

## Decisions requiring real environment information

- Verified supported package versions and authentication integration.
- Hosting provider, deployment region, Atlas cluster/backup plan, and expected budget.
- Production domain and exact Google callback URLs.
- KMS provider/region/identity configuration, key and backup ownership.
- Backup retention, operational contact, and actual target launch audience.

Prepare code and documentation before requesting these values when possible. Never fabricate them or mark the dependent integration verified without evidence.
