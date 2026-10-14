# Exactly 12 implementation phases

Paste `MASTER-PROMPT.md` first; it authorizes and starts Phase 1 only. After reviewing each result, paste the next phase prompt below. Each prompt authorizes that phase only. A later explicit instruction may authorize a specified range, but an unfinished dependency cannot be treated as passing.

Every phase inherits the master prompt, repository rules, product contracts, security requirements, and previous verified work. Update `docs/STATUS.md` with delivered behavior, exact checks and outcomes, screenshots where useful, and remaining work. Record unavailable checks as **not run — BLOCKED**, with the exact missing credential, service, tool, or human setup step. Continue independent work within the authorized phase; never substitute a mock for integration evidence or claim completion while a mandatory gate remains blocked.

Human setup may include Google consent configuration, Atlas access, KMS permissions, and host secrets. Supply precise instructions without requesting secret values in chat. No phase authorizes paid resource provisioning or public launch. Prepare a reviewable build and configuration; use only an already-authorized private staging environment for deployment verification. Provisioning and public publication require separate authorization.

## 1. Foundation and implementation plan

**Goal and deliverables:** Establish a runnable, maintainable project after inspecting existing files. Reconcile specification conflicts in `DECISIONS.md`. Verify compatible stable versions against official documentation for Next.js, React, Node, authentication, MongoDB driver/encryption bindings, and the date library. Record the compatibility matrix, runtime, and package manager; commit the lockfile. Add only dependencies needed now. Create the application entry point, strict TypeScript setup, lint/typecheck/build commands, and honest test commands. Add environment validation, a secret-free `.env.example`, `.gitignore`, and a concise implementation map.

**Dependency and exit evidence:** Requires the supplied kit and a working development runtime. A fresh documented install and production build succeed; the local app opens in a browser. Scripts must run their advertised checks rather than return placeholder success. Configuration errors are intelligible. Record native encryption deployment compatibility as an explicit risk to prove in Phase 3.

```text
Implement Phase 1 only from docs/PHASES.md and MASTER-PROMPT.md. Inspect the repository, verify supported versions, create the runnable foundation, execute its checks, and update STATUS.md with evidence and blockers. Stop after this phase.
```

## 2. Visual system and responsive application shell

**Goal and deliverables:** Implement `DESIGN.md` tokens, typography, self-hosted fonts, navigation, layout hierarchy, and accessible styled primitives. Build Today’s week strip and agenda composition, desktop sidebar, phone bottom navigation, and responsive editing sheets. Establish loading, empty, error, focus, and reduced-motion states. Use clearly labeled synthetic fixtures to review the shell; keep fixture entry points development/test-only and production-safe. The sign-in surface may display configuration requirements but must not simulate an authenticated account or claim working Google login.

**Dependency and exit evidence:** Requires Phase 1’s runnable foundation. Inspect desktop and mobile screenshots, keyboard navigation, menu/dialog focus return, contrast, long titles, and 320px reflow. Verify primary controls remain reachable with a mobile keyboard. The build passes; fixture data cannot appear as real analytics or social activity. Record the shell as visual implementation, with real account integration still pending Phase 3.

```text
Implement Phase 2 only. Build the responsive shell and design primitives from DESIGN.md. Label synthetic fixtures, preserve honest authentication states, inspect phone and desktop layouts, fix visual/accessibility issues, and record actual evidence in STATUS.md.
```

## 3. Google authentication and encrypted database foundation

**Goal and deliverables:** Integrate Google OIDC and implement owner-scoped services, secure sessions, Atlas connection pooling, indexes, validation, and sanitized errors. Persist identity/profile payloads with official explicit randomized MongoDB field encryption and versioned lookup HMACs. Add per-user wrapped keys, server-only boundaries, local-test key handling, production KMS configuration, and startup rejection of unsafe production key modes. Document Google callback URLs, Atlas networking, and least-privilege secrets.

**Dependency and exit evidence:** Requires Phase 1 compatibility decisions and Phase 2 sign-in UI. Test the native encryption package in the intended Node/container runtime. Verify real Google sign-in/out, durable identity, cross-user denial, raw ciphertext storage, authorized decryption, key failure, and private cache behavior. Prove production KMS mode in authorized staging; absent credentials leave those gates BLOCKED, never passed by local-key tests. Continue independent code and documentation.

```text
Implement Phase 3 only. Build real Google authentication and encrypted Atlas persistence using SECURITY.md. Run native encryption/runtime and KMS checks, inspect raw stored ciphertext, test authorization, and record missing human configuration as BLOCKED without faking success.
```

## 4. Onboarding, profile, avatar, and domain selection

**Goal and deliverables:** Complete onboarding after authentication. Add normalized usernames with database-enforced uniqueness, public alias, confirmed canonical IANA timezone, domain selection, and separate discovery/metric-sharing opt-ins. The timezone becomes read-only after onboarding in v1. Build the local allowlisted SVG avatar editor with preview, randomize, reset, keyboard controls, and persisted configuration. Supply initials fallback and skipped-step empty states. Profile edits must keep private Google identity separate from intentionally shared fields.

**Dependency and exit evidence:** Requires Phase 3 identity and encrypted repositories. Two simultaneous username claims yield one winner and a clear conflict. Onboarding and avatar choices survive refresh and reauthentication. Test ownership, schema rejection, session expiry during editing, reduced motion, and phone form behavior. Verify optional social consent defaults off; profile responses expose only permitted fields. Never use browser timezone changes to silently rewrite the account setting.

```text
Implement Phase 4 only. Finish persisted onboarding, profile, avatar, consent, and domain selection. Enforce username uniqueness and the fixed canonical timezone, test reload and ownership behavior, inspect mobile forms, and update STATUS.md.
```

## 5. College subjects, units, topics, and progress

**Goal and deliverables:** Build Subject → Unit → Topic → optional Subtopic creation, editing, ordering, archiving/restoring, and bounded private search. Use stable identifiers, parent/owner checks, encrypted titles and notes, and optimistic concurrency. Derive progress from active descendant leaves and provide empty states, breadcrumbs, expansion controls, and unavailable-reference states. Reserve the scheduling action’s source contract. Define completion integration with Phase 7; do not create an unrewarded temporary completion path requiring ambiguous XP backfilling.

**Dependency and exit evidence:** Requires Phase 4 onboarding and Phase 3 secure repositories. CRUD survives reload; cross-user and wrong-parent mutations fail. Test aggregate progress using explicitly synthetic learned-state fixtures, including nested leaves and archived descendants. Verify rename/reorder never changes reward identity. Inspect long trees and phone navigation. Live reward-bearing completion remains clearly pending until the single authoritative service arrives in Phase 7.

```text
Implement Phase 5 only. Deliver secure persisted college hierarchy CRUD, archive/restore, search, and derived progress. Keep stable identities and the Phase 7 completion boundary; test nested ownership and fixtures, review mobile navigation, and record evidence.
```

## 6. Self-study schedule and college-topic import

**Goal and deliverables:** Deliver an unscheduled inbox, daily agenda, desktop week calendar, and create/edit/reschedule/cancel forms. Support explicit self-study categories, selected-weekday recurrence with end dates, bounded occurrence generation, stable occurrence IDs, and this-occurrence/future-pending edits. Import one owned college leaf per session with a source link and encrypted title snapshot; archived sources must not destroy sessions. Inbox ideas remain general Study tasks until explicitly scheduled as self-study. Show overlap warnings without silently moving tasks. Add direct date/time editing as the keyboard and touch alternative to dragging.

**Dependency and exit evidence:** Requires Phase 5 hierarchy and the confirmed timezone. Test recurrence retries, exceptions, same-local-date session validation, source archival, date boundaries, and DST rules from `TESTING.md`. Differentiate templates from occurrences. Verify pending schedule revisions and preserve completed-history constraints in the contract used by Phase 7. Scheduling persists and works on phones; completion feedback must not claim rewards before Phase 7 supplies the transactional service.

```text
Implement Phase 6 only. Build the persisted planner, self-study scheduling, recurrence, and college-topic import. Verify stable occurrence identity, timezone/DST behavior, source preservation, accessible editing, and phone agenda usability; update STATUS.md.
```

## 7. Completion, XP, streaks, and celebrations

**Goal and deliverables:** Implement the authoritative completion/undo service and connect college leaves and scheduled/unscheduled task occurrences. Apply exactly 20 XP per eligible stable identity, signed ledger reversals, immutable completed schedule evidence, and explicitly linked learned-state updates without a second reward. Use MongoDB transactions, unique indexes, operation identifiers, concurrency controls, and rebuildable daily/XP projections. Only valid self-study completion for today at or after its start qualifies today’s streak. Show congratulations after confirmed commit, with reduced-motion support.

**Dependency and exit evidence:** Requires Phases 5–6 data structures and Phase 3 transactional persistence. Pass duplicate and concurrent request tests, transaction rollback, undo/recomplete, late/early/future completion, midnight, yesterday-ending streak, historical undo, and multiple qualifying tasks. Ledger balance and task state must agree after races. Direct college and other-domain completion never advances the study streak. Failed requests never celebrate.

```text
Implement Phase 7 only using GAMIFICATION.md exactly. Connect the transactional completion service, XP, undo, current/longest streaks, and restrained celebrations. Exercise concurrency and time-boundary tests against persisted data and report evidence or blockers honestly.
```

## 8. Fitness, relationships, finance, and custom domains

**Goal and deliverables:** Add domain pages using the shared planner and completion service, with goals, actionable tasks, and encrypted private notes. Fitness adds simple manual measurements; Relationships adds private reminders and connection goals; Finance adds manual expenses and monthly budgets in one user-selected currency. Implement validated money representation, encrypted financial payloads, and correctly recomputed totals. Allow custom-domain naming and archiving while retaining history. Avoid banking, wearable connections, AI coaching, or social messaging.

**Dependency and exit evidence:** Requires Phase 7’s reward service. Verify persistence, validation, owner isolation, domain filtering, archival, and empty states. Explicit task occurrences earn 20 XP; creating or editing a note, goal, expense, or measurement earns none. No non-self-study action qualifies a streak. Reconcile finance totals after edits/deletions and refresh; keep financial and relationship content absent from public DTOs and logs. Inspect phone forms.

```text
Implement Phase 8 only. Finish lightweight Fitness, Relationships, Finance, and custom-domain workflows using existing secure services. Verify manual finance totals, persistence, privacy, and exact task-versus-record reward rules; review mobile forms and update STATUS.md.
```

## 9. Friends, privacy controls, and leaderboards

**Goal and deliverables:** Add exact normalized username discovery with opt-in, rate limiting, request/accept/decline/cancel/remove/block flows, and safe handling of crossed or repeated requests. Require accepted friendship and current sharing consent for others’ ranking visibility. Build separate total-XP/current-streak rankings with documented deterministic ties and the student’s own position. Return minimal shared profile and score DTOs. Blocking removes visibility and pending relationships; unblocking never silently restores them.

**Dependency and exit evidence:** Requires Phase 4 profile/consent and Phase 7 authoritative scores. Exercise the journey with two accounts plus an unauthorized third account. Verify ownership of requests, consent changes, exact discovery restrictions, block behavior, and cache invalidation. Check responses for leaked email, schedule, timezone, private notes, or finance fields. Rankings must reflect server values and reversals; label them as self-reported activity. Inspect empty, pending, blocked, error, and long-list mobile states.

```text
Implement Phase 9 only. Deliver consent-aware username discovery, friendship lifecycle, blocking, and server-derived leaderboards. Test with separate accounts, verify permitted DTOs and immediate privacy changes, inspect mobile states, and record actual results.
```

## 10. Analytics and meaningful insights

**Goal and deliverables:** Implement real-data 7/30/90-day analytics using canonical local dates, completion records, reward ledger, and syllabus state. Deliver daily completions, net XP history, self-study activity heatmap, domain distribution, subject coverage, and current/longest streak summaries. Distinguish scheduled minutes, completed planned minutes, and manually reported actual minutes. Define denominators and date attribution in help and technical contracts. Include domain filters, accessible tables, tooltips, and zero-data states.

**Dependency and exit evidence:** Requires Phases 7–8 authoritative activity and domain records. Reconcile every metric against deterministic fixtures covering undo, late completion, recurrence, midnight, and archive changes. Test zero denominators, one-point series, long labels, and all-zero ranges. Raw user accounts must never display fabricated charts. Verify chart keyboard access, responsive labels, filter consistency, owner isolation, and query bounds. No unsupported claim about measured study time or academic performance is allowed.

```text
Implement Phase 10 only. Build the specified analytics from authoritative stored records. Reconcile each chart and metric, distinguish planned from self-reported time, handle empty/boundary cases, verify accessible mobile charts, and record evidence in STATUS.md.
```

## 11. Mobile polish, accessibility, performance, and integration hardening

**Goal and deliverables:** Integrate and refine every core journey across the complete app. Fix clipped actions, long-label overflow, dialog/keyboard collisions, chart readability, bottom-navigation state, focus order, and reduced-motion behavior. Complete export, session/account controls, and the documented retryable deletion flow if not already delivered; validate safe failure and restore-hygiene requirements. Profile representative real flows for excessive queries, avoidable client bundles, and layout instability. Optimize measured problems without introducing speculative architecture.

**Dependency and exit evidence:** Requires Phases 1–10 integrated. Run end-to-end journeys, cross-user authorization checks, refresh persistence, network failure, session expiry, and accessible keyboard/screen-reader checks. Inspect 360, 390, 768, 1280, and 1440px, plus 320px reflow and zoom. Record screenshots and measured performance conditions. Verify private caching, export ownership, deletion session revocation, and prevention of in-flight data recreation. Every production-facing control works or is removed from scope explicitly.

```text
Implement Phase 11 only. Integrate and harden all workflows, finish account privacy controls, fix mobile/accessibility defects, and optimize measured bottlenecks. Run representative real-data journeys and security checks; save screenshots and honest results in STATUS.md.
```

## 12. Release verification, documentation, staging, and deployment readiness

**Goal and deliverables:** Produce a reproducible release candidate, locked dependencies, production container/host configuration, CI, migrations/index setup, health checks, and provisioning instructions. Finish setup, rollback, backup/restore, key recovery/rotation, deletion retention, and operational runbooks. Prepare a reviewable staging build; deploy only to an already-authorized private staging target. Resolve critical defects and align user/setup instructions with implementation. Identify pending infrastructure/publication decisions.

**Dependency and exit evidence:** Requires completed earlier gates. Run the production build and tests, real staging Google login, Atlas persistence, raw ciphertext inspection, production KMS/native-runtime checks, key recovery/restore exercise, privacy checks, and responsive review. Confirm secrets stay out of bundles/logs and unsafe demo/local-key modes cannot run in production. Missing credentials or unavailable recovery checks remain BLOCKED. Deliver run/deploy steps and evidence; never infer production readiness or launch approval from a build alone.

```text
Implement Phase 12 only. Finish the release candidate, documentation, and authorized staging verification. Execute TESTING.md release gates, prove deployment encryption and recovery, record blockers, and provide a reviewable readiness report. Do not provision paid resources or publish publicly.
```
