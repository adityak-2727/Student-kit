# Implementation status

Current state: **Google authentication and encrypted account foundation implemented; mandatory live exit gates BLOCKED by external setup.** The public preview and responsive synthetic shell remain usable. Local replica-set encryption, ownership, revocation and concurrent provisioning are verified; real Google/Atlas/AWS KMS/Linux-container verification is unavailable. Onboarding, study workflows and rewards remain future work. No public deployment or paid resource has been created.

Next action: configure Google, restricted Atlas and AWS KMS privately using SETUP-AND-DEPLOY.md, install/enable Docker for the native-container probe, then finish Phase 3's live gates. Phase 4 is onboarding/profile/avatar/domain selection after those dependencies pass and the user authorizes it.

| Phase | Status | Evidence / blocker |
| --- | --- | --- |
| 1 Foundation | Complete within authorized scope | Fresh frozen install, type/lint/unit/build/browser checks pass; development audit finding remains visible below |
| 2 Design system and shell | Complete within authorized scope | Local fonts, Radix primitives, responsive shell, 18 development browser checks and 10 production browser checks; evidence below |
| 3 Authentication and encrypted database | Code/local checks delivered; live gates BLOCKED | User confirmed no Google/Atlas/KMS setup; Docker unavailable; evidence below |
| 4 Onboarding, profile, avatar, domains | Not started | — |
| 5 College study | Not started | — |
| 6 Self-study planner | Not started | — |
| 7 Completion, XP, streaks | Not started | — |
| 8 Other domains | Not started | — |
| 9 Friends and leaderboard | Not started | — |
| 10 Analytics | Not started | — |
| 11 Mobile and integration hardening | Not started | — |
| 12 Release verification and deployment readiness | Not started | Public launch requires explicit authorization |

## Update after each implementation phase

### Phase 3 evidence — 14 October 2026

Ref: `main`; commit subject: `Add Google sign-in and encrypted account storage`. This is an implemented integration with local evidence, **not** a claim of verified Google login or production readiness. The user confirmed no external setup exists yet.

Usable now: `/signin` has responsive setup/provider-error states; public preview mode works without accounts and does not show a fake login button. After private configuration, live mode uses real NextAuth Google OIDC, validated issuer/subject and verified email, a versioned HMAC lookup, per-user official randomized CSFLE, minimal sessions, owner-scoped `/api/v1/me`, session-version logout-all and library-managed sign-out. `/app/today` requires a valid active account and shows an honest account handoff, without synthetic student data. Discovery/sharing stay off; four built-in domain reservations stay disabled pending onboarding. No sign-in action awards XP or streak credit.

Implementation: stable NextAuth 4.24.15, MongoDB 7.7.0, mongodb-client-encryption 7.2.1 and AWS SDK credential-providers 3.1148.0 are pinned with the lockfile. Server-only modules separate auth, services, repositories, pooling, envelope encryption, indexes/migrations and HTTP policy. Identity payloads bind owner/document/kind/schema; no plaintext name/email/sub is duplicated. Collection validators reject plaintext payloads; repository enforces BSON subtype 6. Unique identity/key/domain indexes and retry-safe provisioning withstand concurrent requests. Actual migration-definition checksums are recorded and enforced.

Security behavior: canonical fixed origin/callback destinations; only minimal Google scopes, state/PKCE/nonce; no stored provider tokens or email linkage. Session/account versions are checked at data access. Private/auth HTML and JSON are no-store with nonce script CSP, no-referrer and sanitized errors. POST bodies are capped while streaming; Origin/content-type and library CSRF protect mutations. OAuth query overrides are refused. Signed browser limiter identities and shared Mongo windows apply per-browser/deployment limits; ingress bot/IP controls remain a host requirement. Production rejects local keys/bypasses and checks migrated DB plus fresh-context key wrapping/decryption before the documented server command opens a port. KMS failure has no local-key fallback.

Local configuration: `pnpm config:keys` prepared three independent random secrets directly in ignored `.env.local`, printed no values, and left `APP_MODE=foundation`. Google and MongoDB settings remain placeholders. Existing non-placeholder secrets are preserved on rerun. Never commit or display that file. The build was checked against those configured values; no matches in static browser artifacts. Native Windows ACL setup verified disabled inheritance and access for the current user, SYSTEM and Administrators only.

Run: `npx --yes pnpm@12.11.2 dev`, then `http://127.0.0.1:3000/signin` for setup status or `/dev/shell` for labelled layout fixtures. Exact private Google/Atlas/KMS steps, migration privileges, probe cleanup and key retention are in SETUP-AND-DEPLOY.md. Local integration tests own a temporary loopback MongoDB replica set under ignored `test-results/mongo-*`; no existing Mongo service/production URI/database is used or dropped. Test Mongo transport is intentionally local and unencrypted; **it is not Atlas/TLS evidence**.

| Exact command / procedure | Actual outcome |
| --- | --- |
| `npm view next-auth version peerDependencies dist-tags`; Mongo driver/native engines/peers; official v4/Mongo/Next docs | Verified stable supported choices; v5 beta avoided; sources and exceptions documented in DECISIONS.md |
| `npx --yes pnpm@12.11.2 install --frozen-lockfile` | Passed; exact native install allowance, strict peers/engine, no fresh-release exception retained |
| `npx --yes pnpm@12.11.2 typecheck` | Passed strict TypeScript and route generation |
| `npx --yes pnpm@12.11.2 lint` | Passed with zero warnings |
| `npx --yes pnpm@12.11.2 test:unit` | Passed 41 tests: existing time/config contracts, Google claims/HMAC, minimal/revoked sessions, bounded requests, signed limiter, confirmed HTTP sign-out, and actual unsafe-production command preflight |
| `npx --yes pnpm@12.11.2 test:integration` | Passed 12 tests against real isolated MongoDB 8.2 replica set: migration repeat/checksum, fresh key probe, raw randomized ciphertext, fresh request persistence, 8 concurrent first logins, four disabled domain reservations, owner denial/revocation, binding substitution, tampering/wrong/missing keys without overwrite, plaintext DB rejection, interrupted provisioning/deleting status, shared rate windows and transaction rollback |
| `npx --yes pnpm@12.11.2 encryption:runtime` | Passed native loading: libmongocrypt 1.20.1, Node 24.13.0, Windows x64; encryption/storage behavior verified separately above |
| `npx --yes pnpm@12.11.2 build` | Passed Node/dynamic production build, including real auth/protected routes; public foundation mode, no live provider claim |
| `npx --yes pnpm@12.11.2 security:client-secrets` | Passed: 27 static build files checked against three configured private key values, zero matches; bounded evidence only |
| `npx --yes pnpm@12.11.2 test:e2e` | Passed 18 production browser checks: six login/welcome widths, axe, signed-out API/page protection, mutation owner spoof/Origin rejection, no-store, fresh script nonces, safe error copy, keyboard and fixture isolation |
| `npx --yes pnpm@12.11.2 test:auth` | Passed four browser/protocol checks using synthetic settings only: installed NextAuth Google/canonical URLs/no session, HttpOnly CSRF/limiter cookies, forbidden overrides/origins/bodies, CSRF sign-out and clearing an invalid cookie, simulated 429/offline retry without false success |
| `npx --yes pnpm@12.11.2 test:shell` | Passed 18 regression checks; focused `test:shell --grep '200%'` also passed after ensuring hydration before changing root styles. Covers accessibility, focus, mobile editor, reduced motion, local fonts and fixture behavior under the new CSP |
| `npx --yes pnpm@12.11.2 config:check --integration` | Expected exit 1: Google client ID/secret and Atlas URI are unconfigured; values are not printed |
| `npx --yes pnpm@12.11.2 encryption:verify` | Expected prerequisite failure with no DB connection; Node strip-only parameter-property error found first and corrected with erasable class fields / compiler enforcement |
| `npx --yes pnpm@12.11.2 db:migrate` | Expected exit 1 while integration settings are missing; no fake migration success or raw credential/database error printed |
| `npx --yes pnpm@12.11.2 audit --prod --audit-level high` | Passed: no reported production vulnerabilities |
| `npx --yes pnpm@12.11.2 audit --audit-level high` | Fails on the previously documented dev-only braces advisory; no patch/suppression, unchanged path |

Screenshots: `docs/evidence/signin-{320,360,390,768,1280,1440}.png` (disabled setup plus sanitized OAuth error), `signin-configured-390.png` (synthetic provider configuration only), `signin-retry-390.png` (simulated rate-limit failure). Public welcome screenshots refreshed. Visual inspection found readable wrapping, reachable actions and no clipping; axes/overflow checks pass. Physical phone keyboards, screen-reader announcement testing and actual account-state screenshots remain later/manual work. No real personal data/codes/cookies/keys appear in screenshots.

Corrections during verification: type checks found driver Binary/collection/test-callback type mismatches; corrected without casts weakening production contracts. Existing dev server blocked isolated ports/Next dev lock; stopped only the verified workspace Next process. Browser tests initially matched Next's empty route-announcer alert and assumed a CSRF/session cookie would be reissued when already present/absent; scoped application alerts and checked actual cookie state, including an explicitly invalid cookie. Independent read-only security review found global low throttling, OAuth query overrides, buffered body-size limits, sign-out false-success behavior and noncanonical origins; all were corrected and the follow-up found no material remaining issue. The expected generic authentication log during invalid-cookie rejection contains no token/provider metadata.

Mandatory **not run — BLOCKED**: real Google consent/sign-in/out/re-entry/refresh with durable staging identity; Atlas restricted-network TLS persistence/raw ciphertext; AWS KMS permission/failure behavior in production mode; intended Linux/container native encrypt/decrypt and final package behavior. Missing prerequisites: Google Web OAuth client/consent/test account, Atlas environment/restricted credentials/networking, AWS KMS key/workload permissions, Docker/runtime and an authorized private staging target. Local CSFLE/HTTP fixture success does not pass any of these gates. HMAC dual-read rotation, retained-key rewrap/recovery and backup/deletion restore exercises remain documented release work. Phase 3 remains incomplete until its live gates pass; Phase 4 has not started.

### Phase 2 evidence — 14 October 2026

Ref: `main`; commit subject: `Add responsive workspace shell and accessible controls`. Scope is a visual implementation; no real account is simulated and no provider/persistence check is claimed.

Usable: the public welcome/sign-in availability surface has self-hosted Manrope/Newsreader typography and an accessible information dialog. In development, `/dev/shell` shows a labelled synthetic Today agenda with week navigation, direct date entry, domain filtering, sample source links, a separate inbox, fixed sample XP/streak context, desktop sidebar, compact tablet sidebar, phone bottom navigation and a persistent quick-add action. Study tabs, More/profile menus and display switches work. Unimplemented real destinations explain their availability without fake charts/friends. The temporary editing sheet validates input, retains errors, applies only to current memory, and resets on refresh. Completed sample schedule/domain fields are locked. No completion, XP celebration, login, server save or fake synchronization is implemented.

Run/inspect: `npx --yes pnpm@12.11.2 dev`, then `http://127.0.0.1:3000/dev/shell`. No credentials or `.env.local` needed. The homepage links to the preview only in development. `pnpm start` intentionally provides the public page and returns 404 for the fixture route. The production gate runs on the server before dynamic fixture imports; fixtures also use `server-only`. No query parameter or auth-bypass flag can enable the route.

Changed modules: shared UI primitives under `src/components/ui`, public branding/frame/sign-in information, shell navigation/agenda/editor/state examples and separate preview schema/server fixtures under `src/features/shell`, the gated route, design tokens/styles and local font imports. Added `playwright.shell.config.ts`, `test:shell`, axe checks, OFL licences and the pinned UI dependencies/lockfile. Next's regenerated `next-env.d.ts` is ignored instead of tracked; the existing startup/build/typegen commands create it. Setup, README, implementation map and decisions are synchronized. Product reward/privacy contracts remain unchanged.

| Exact command / procedure | Actual outcome |
| --- | --- |
| `npm view` for Radix primitives, Lucide, Fontsource packages and axe checker | Stable versions/React peers and OFL-1.1 font licensing checked; exact installed versions and official documentation links in `DECISIONS.md` |
| `npx --yes pnpm@12.11.2 install --frozen-lockfile` | Passed with strict engine/peer and supply-chain policies; no fresh-release exemption retained |
| `npx --yes pnpm@12.11.2 typecheck` | Passed; Next route type generation and strict TypeScript |
| `npx --yes pnpm@12.11.2 lint` | Passed after ref access was moved from render to event handlers |
| `npx --yes pnpm@12.11.2 test:unit` | Passed: existing 23 configuration/timezone tests; those modules' behavior is preserved |
| `npx --yes pnpm@12.11.2 build` | Passed; optimized production build and its TypeScript check |
| `npx --yes pnpm@12.11.2 test:shell` | Passed: 18 Chromium checks against a dedicated development server on port 3100 |
| `npx --yes pnpm@12.11.2 test:shell --grep 'editor validates|long titles|empty-state'` | Passed: three focused reruns after explicit Study-category labelling; a new scheduled Study draft remains general Study, with no implicit self-study classification |
| `npx --yes pnpm@12.11.2 test:e2e` | Passed: 10 Chromium checks against its own production server on port 3000, including direct/query fixture 404s and no preview link in production |
| Axe A/AA checks at 320, 360, 390, 768, 1024, 1280, 1440px; dialog validation state | Passed: no detected violations in the inspected shell states; not a complete accessibility certification |
| Local font request and computed style/border-contrast checks | Passed: WOFF2 requests remain on app origin, Manrope renders, required control border has >=3:1 contrast; text contrast covered by axe |
| Keyboard events for select typeahead, tabs, menus, popover, skip link, switches and dialogs | Passed: correct selection/dismissal, visible skip link above chrome, Tab/Shift+Tab containment and focus return, including removed-trigger fallback |
| Reduced viewport/text/state checks | Passed: 390×420 keyboard-space emulation, 200% rem text size with 32px input text, 640×360 landscape, 160-character unbroken title, short-tablet navigation scroll and loading/error/offline/empty examples |
| Refresh/storage/URL check for edited synthetic draft | Passed: no local/session storage entries, no draft in URL, refresh removes the temporary draft, no reward/saved-success message |
| `npx --yes pnpm@12.11.2 audit:production` | Passed: no known vulnerabilities reported in production dependencies |
| `npx --yes pnpm@12.11.2 audit` | Failed: the same one high development-only `braces` advisory has no patched release reported; not suppressed |

Visual evidence: `docs/evidence/shell-{320,360,390,768,1024,1280,1440}.png`; phone viewport captures `shell-{320,360,390}-viewport.png`; `shell-editor-keyboard-space.png`, `shell-text-200.png`, `shell-landscape.png`; public page `welcome-{320,360,390,768,1280,1440}.png`. Opened/inspected the phone, tablet and desktop captures and editing/text-size states. Existing foundation screenshots are retained as historical evidence. Full-page captures include sticky chrome at the capture's viewport position; phone viewport captures show the actual visible framing.

Independent read-only review found and resolved detached-trigger focus return, hidden-field validation for unscheduled drafts, a skip link behind mobile chrome and short-sidebar reachability. Added targeted regression checks. Initial keyboard select test sent typeahead before primitive focus settled; waits now assert selected-option focus. The date control now has an explicit accessible name. The first production test attempt correctly refused an earlier preview server on port 3000; that known local process was stopped before the successful run. Next's development badge was disabled after visual review showed it over phone navigation.

Limits: native iOS/Android software keyboards, physical device gestures and assistive-technology announcements were **not run** (no connected phone/assistive-technology session); keyboard-space resizing, browser keyboard events, DOM semantics and axe scans are the verified evidence. The VisualViewport handler resizes/positions the phone editor, and its actions remain visible under the tested reduced space. Full device/integration hardening remains Phase 11. Real Google/Atlas/KMS/CSFLE and persisted owner isolation remain **not run — future Phase 3 work**, requiring implementation and private provider configuration. No paid resources or public hosting were created. The known dev linter advisory from Phase 1 remains open.

Next: Phase 3, upon authorization. Implement the stable Google flow, active-account session/service authorization, encrypted repositories and native/KMS checks; finish independent code before reporting exact unavailable external setup.

### Phase 1 evidence — 14 October 2026

Ref: `main`; initial commit subject: `Add runnable Daylight foundation and configuration checks`. Remote: `https://github.com/adityak-2727/Student-kit.git`. Remote was verified empty before Git initialization; the original specification pack is retained.

Usable: public development-preview page at `/`, responsive introduction and honest availability states, keyboard skip/anchor/home navigation, 404 recovery, a retry error boundary, and `/api/v1/health` process liveness. The application creates no identity, account data, rewards, fake statistics, or browser database. Only `APP_MODE=foundation` is accepted. Dev/build/start validate configuration before Next launches; server instrumentation checks it again. Integration preflight is syntax validation only, not provider verification.

Run: Node 24.x (tested 24.13.0), pnpm 12.11.2. `npx --yes pnpm@12.11.2 install --frozen-lockfile`, then `npx --yes pnpm@12.11.2 dev`; open `http://127.0.0.1:3000`. No `.env.local` is required. All check commands below used this exact pinned `npx` prefix because pnpm was not on the machine PATH. See `SETUP-AND-DEPLOY.md` and `README.md` for ordinary `pnpm` equivalents.

Files/modules: `src/app`, `src/server/config`, `src/shared/time`, `src/instrumentation.ts`, the config CLI, unit/e2e tests, TypeScript/Next/ESLint/Tailwind/Vitest/Playwright config, package manifest, pnpm policy and lockfile, `.env.example`, README and implementation map. `DECISIONS.md` records the version/source matrix, stable NextAuth v4 selection, deferred native-encryption risk, supported modes, and configuration startup behavior. Full typography/primitives/navigation remain for Phase 2.

| Exact command / procedure | Actual outcome |
| --- | --- |
| `npx --yes pnpm@12.11.2 install` | Passed after explicitly allowing the reviewed `unrs-resolver@1.12.2` build; strict engine/peer resolution and lockfile recorded |
| `npx --yes pnpm@12.11.2 --dir .fresh-install install --frozen-lockfile --offline` | Passed in a new isolated copy with no node_modules; 382 packages restored from the previously downloaded package store, no lockfile changes |
| `npx --yes pnpm@12.11.2 build` from that fresh installation | Passed with the final preflight command; optimized Node build and its TypeScript check |
| `npx --yes pnpm@12.11.2 typecheck` | Passed; Next route type generation + strict `tsc --noEmit` |
| `npx --yes pnpm@12.11.2 lint` | Passed, zero errors/warnings |
| `npx --yes pnpm@12.11.2 test:unit` | Passed: 23 tests in two files; unsafe mode/bypass/origin/TLS/placeholder/key configuration, sanitized diagnostics, Kolkata midnight, invalid dates/zones and 23/25-hour New York DST days |
| `npx --yes pnpm@12.11.2 config:check` | Passed without integration credentials |
| `npx --yes pnpm@12.11.2 config:check --integration` | Expected exit 1: missing integration settings identified by name, without values; real integrations remain unavailable |
| `$env:ENABLE_TEST_AUTH='true'` then `npx --yes pnpm@12.11.2 start --port 3001` in a separate process | Expected exit 1 before Next starts; no authentication bypass enabled |
| `npx --yes pnpm@12.11.2 build` in working repository | Passed; `/`, `/_not-found`, `/api/v1/health` use Node and dynamic responses |
| `npx --yes pnpm@12.11.2 exec playwright install chromium` | Passed; Chromium test browser installed locally |
| `npx --yes pnpm@12.11.2 test:e2e` | Passed: eight checks against the production server; liveness/no-store, all six widths, no page errors or page-wide overflow, empty browser storage, working anchor/skip/home navigation and 404 response |
| Open and inspect all six generated PNGs | Passed visual review of the public foundation: readable text, wrapping, useful status copy, reachable link, no clipping or overlap |
| `npx --yes pnpm@12.11.2 dev` | Passed; local Next development server starts and serves the preview |
| `npx --yes pnpm@12.11.2 audit --audit-level high` | Failed: one high development-only `braces` advisory, documented below; no suppression added |
| `npx --yes pnpm@12.11.2 audit --prod --audit-level high` | Passed: no known vulnerabilities reported in production dependencies at verification time |

Screenshot evidence (Chromium at CSS widths 320, 360, 390, 768, 1280, 1440): `docs/evidence/foundation-320.png`, `foundation-360.png`, `foundation-390.png`, `foundation-768.png`, `foundation-1280.png`, `foundation-1440.png`. These show the public scaffold, not authenticated persistence. Browser tests start their own production server and refuse to reuse another server; stop any local preview on port 3000 before rerunning them.

Failures corrected during verification: pnpm's first install returned `ERR_PNPM_IGNORED_BUILDS` for the native linter resolver; added a version-specific build allowance and current pnpm policy location. Initial lint rejected a plain home anchor; replaced it with Next Link. The first production-mode CLI change attempted assignment to Next's readonly `NODE_ENV` type; fixed by passing a validated environment copy, then reran the type/build checks. Instrumentation alone logged invalid configuration after a port bind; command preflight now exits first. Next dev appended a managed AGENTS block; `agentRules: false` preserves the user's original repository instructions. Initial sandbox `npx`/network attempts failed because its cache/proxy was unavailable; network-enabled executions succeeded. No unavailable checks were represented as passing.

Known tooling issue: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) affects `braces <=3.0.3`; the reviewed advisory lists no patched release. Locked path: `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. It is a dev-only dependency; production audit reports none. The app does not accept glob patterns from students or expose the linter as a service. Keep the full audit failing/visible and recheck upstream before release; do not infer an entirely clean dependency tree. ESLint 9.39.5 is deprecated but still required by the installed React/JSX lint plugins' <=9 peer contracts; upgrading to 10 requires compatible tooling first.

Real integrations verified: package-registry installation and GitHub remote access only. Google sign-in/out, Atlas persistence, cross-user database authorization, raw ciphertext, native encryption, KMS, transactions, key recovery and staging: **not run — BLOCKED / future integration work**, requiring the auth/database implementation plus Google Web OAuth client/consent configuration, restricted transaction-capable Atlas access, separate environment keys and AWS KMS workload identity. These are not Phase 1 exit gates. No paid resources or public hosting were provisioned. No full-app accessibility, analytics, reward or persistence claims are made.

Next: Phase 2, upon authorization; begin with licensed self-hosted fonts, the full design tokens, accessible primitives and responsive application shell. Phase 1 has no outstanding mandatory exit check.

```text
Phase:
Date and commit/ref:
What is usable:
How to run and open it:
Files/modules changed:
Decisions changed:
Exact checks and actual results:
Browser/device evidence and screenshot paths:
Real integrations verified:
Skipped or blocked checks and reason:
Known issues:
Next phase and first concrete action:
```

Use “blocked,” “failed,” and “not run” honestly. A passing mocked test is not a passing real provider check. A screenshot is not proof of persistence. Never include secrets, private user content, or sensitive account identifiers in this file.

## Resume prompt

> Read AGENTS.md, MASTER-PROMPT.md, docs/STATUS.md, and the relevant section of docs/PHASES.md. Inspect the actual implementation before assuming this status is current. Resume the first incomplete authorized phase, preserve working features, complete its exit checks, and update STATUS with actual evidence. Report genuine configuration blockers while continuing independent work. Do not restart or rewrite the application from scratch.
