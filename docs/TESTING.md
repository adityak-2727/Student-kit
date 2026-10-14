# Testing and release acceptance

This document defines evidence the implementation must produce before release. Build tests around observable product rules, authorization boundaries, money and time handling, and durable database state. Do not inflate the suite with component snapshots that merely repeat the implementation. Follow the twelve implementation phases in `PHASES.md`; the final phase assembles the release evidence below.

## Test environments and evidence

Use unit tests for pure reward, streak, analytics, and schedule calculations; integration tests for MongoDB transactions, authorization, encryption, and request validation; browser tests for the critical student journeys. Use a controllable clock in tests, while production qualification uses trusted server time exclusively. Integration testing must exercise the chosen MongoDB transaction topology. Verify deployment separately against a dedicated MongoDB Atlas staging database.

Seed deterministic, clearly synthetic accounts, subjects, occurrences, friendship states, and ledger transitions. A test-only identity fixture may support automated browser tests. It must be impossible to enable that bypass in a production build or deployment. Fixture success never counts as verified Google authentication.

Record each check as **passed**, **failed**, or **not run**, with environment, commit, command or manual procedure, and concise evidence. Never describe missing credentials, simulated sign-in, placeholder charts, or mocked persistence as a working live integration. Keep personal data, session values, keys, and OAuth secrets out of screenshots and reports.

## Core acceptance matrix

| Area | Required behavior and checks |
| --- | --- |
| Google sign-in | A real staging Google account signs in, finishes onboarding, signs out, and signs in again to the same durable account. Refresh and navigation preserve the session appropriately; sign-out revokes access. Cancelled consent and provider errors return useful recovery states. |
| Authorization | Signed-out API requests fail. User A cannot read, mutate, import, complete, export, or delete user B's objects by changing identifiers, nesting paths, query filters, or request bodies. Verify object ownership on the server, including subject/unit/topic parent relationships. |
| Onboarding | Username normalization and uniqueness withstand simultaneous claims. Canonical IANA timezone is explicitly chosen and confirmed. It remains locked after onboarding in v1; browser timezone changes do not change scheduling or streak attribution. |
| Study hierarchy | Create multiple subjects, units, and leaf topics; rename, reorder, archive, and reload. Empty levels have usable states. Completing a leaf awards once per stable identity; subject and unit completion displays are aggregates and award nothing. |
| Study planning | Import a college leaf into self-study, select its day and start time, and keep the source link. Editing the source label does not create another reward identity. Direct college completion and a separately completed study occurrence are distinct eligible actions. |
| Other domains | Fitness, relationships, finance, and custom domains support lightweight goals, actionable tasks, and notes. Explicit actionable task occurrences award XP. Notes, measurements, activity logs, goals merely created, and expense entries do not inherently award XP. |
| Finance | Manually enter, edit, and remove budgets and expenses; totals reconcile after reload. Validate amount, currency, date, and empty states. Clearly communicate manual recording; do not show a working bank connection. |
| Friends | Username discovery defaults off and requires explicit opt-in. With consent, exact-match lookup can find allowed usernames; request friendship, accept, decline, cancel, remove, and block. Handle duplicate and crossed requests consistently. Unauthorized users cannot accept someone else's request. No chat is implied. |
| Leaderboard | Metric sharing separately defaults off and requires explicit opt-in plus accepted friendship. Show permitted friends, XP, and streak using server-derived values and deterministic tie handling. Revoking consent or blocking removes visibility; blocking also prevents new requests. Private schedules, notes, finances, and emails never appear. Describe scores as self-reported activity. |
| Avatar | Create and edit an avatar from approved local SVG parts; persist it and render it on profile and allowed friend surfaces. Never inject arbitrary user-supplied SVG markup or fetch an external avatar service. |

## Reward and streak invariants

Each explicit actionable task occurrence, in any domain, earns **20 XP** on completion. A college leaf also earns **20 XP** for its completion state, using one stable identity. There is no effort bonus, multiplier, or daily XP cap. Only an eligible **self-study occurrence** can qualify a streak day.

Automate these transitions against persisted data:

1. Complete an eligible item: one `+20` ledger entry and one completed state. Retry the same request, double-click, and send simultaneous completion requests: still one award.
2. Undo: one `-20` entry and an incomplete state. Repeated or concurrent undo requests produce no additional reversal. Recomplete: one fresh `+20` transition, restoring the net award to 20.
3. Race completion and undo. The server serializes accepted state transitions; final item state, net ledger value, and qualification state agree. Reused operation identifiers cannot silently target another item or opposite transition.
4. Interrupt a database operation between its logical steps. Either the entire accepted transition persists, or none of it does. A retry cannot leave an orphan ledger entry or double award.
5. Verify total XP equals the signed ledger sum after mixed domain activity, reloads, retries, and reversals. Renaming, reordering, or archiving an item never manufactures a fresh reward identity.
6. Complete a college leaf or other-domain task: XP changes but streak does not. Completing an imported self-study occurrence does not silently complete its source leaf or issue a second award.

Use account timezone `Asia/Kolkata` and trusted server date 13 October 2026. A self-study occurrence scheduled for 09:00 has a UTC start of 03:30. At 03:29:59 completion fails without side effects; at 03:30 it earns 20 XP and qualifies 13 October. A future scheduled date fails. This pre-start restriction applies to every scheduled task, including other domains.

Completing an overdue 12 October occurrence earns 20 XP but does not qualify either 12 or 13 October. Before its first completion, an overdue pending occurrence may be explicitly rescheduled to 13 October: record the schedule revision, then apply the normal start-time and qualification checks. This is an intentional self-report product rule.

Freeze schedule and qualification evidence on every accepted completion transition. The first **successful** completion locks the occurrence's historical schedule, including after undo. Rejected early completion attempts write no completion, reward, qualification, or schedule-lock state and do not prevent later permitted rescheduling. Recompletion evaluates eligibility afresh: reopening an old completed occurrence and completing it today restores XP without reviving its old streak credit.

Two valid completions on one local date qualify one day. Undoing one preserves the day while another valid event remains; undoing the last removes it. Recompute current and longest streaks after historical undo, including when it splits a previously continuous chain. Recompletion on the same scheduled date may qualify anew if all conditions still hold.

The current streak includes a chain ending yesterday while today is unfinished. After a full missed local day it becomes zero. Test local midnight boundaries, including a browser in another timezone, delayed requests crossing midnight, and incorrect client clocks. There are no freeze tokens or automatic grace days.

## Calendar and DST checks

Test overlapping entries, clear rejection of an overnight self-study span with guidance to split it, recurrence exceptions, and rescheduling without creating duplicate occurrences. A recurring series gives each occurrence its own stable identity. Editing a series must preserve completed history and audit permitted changes to pending occurrences.

Move a recurring Oct 12 occurrence to Oct 13 while an original Oct 13 occurrence exists. Both must retain distinct original keys; re-expanding the series must neither collide nor recreate Oct 12. Recheck cancellation and moved exceptions after a future-series edit. For linked learning, verify session-sourced topics cannot issue a direct second award or silently undo a session through a checkbox; an explicit source-session undo updates only its still-active learning source.

Reported-minutes tests include two concurrent edits that would jointly exceed 1,440, historical-day edits, undo, and recompletion on a different day. Each validates the correct completion-day total under the same per-user transaction lock.

Use an IANA zone with daylight-saving transitions. Reject a manually entered nonexistent local time with a clear correction path. For ambiguous manual input, require an explicit earlier/later choice. Recurring schedules skip nonexistent local times and show the reason; ambiguous repeats consistently select the earlier offset. Verify emitted instants, day grouping, and completion eligibility, not just formatted labels.

## Privacy and encryption verification

Read raw staging database documents: designated private payloads must contain valid encrypted BSON produced by official randomized CSFLE, with documented payload/key versions, rather than readable student content. Verify the documented plaintext metadata exceptions exactly; those exceptions must support necessary ownership, lookup, ordering, or analytics operations. Do not claim every stored byte is encrypted.

Decrypt using the authorized application path. Tamper with encrypted BSON and substitute ciphertext across owner/document contexts: the official library must reject integrity failures, and the application must reject mismatched decrypted bindings. Confirm invalid keys fail closed, randomized encryption remains library-managed, and documented key rewrapping works. Verify no key or plaintext private payload reaches client bundles, analytics events, logs, or error responses.

Encryption does not replace ownership checks. Test owner-scoped access even when identifiers and encrypted documents are known. Check deployed transport security, cookie/session configuration, secret provisioning, and permitted public-profile fields. The server can decrypt authorized data; user-facing copy must not claim end-to-end encryption.

## Analytics and visual QA

Create a fixture with completed, pending, overdue, rescheduled, and undone tasks across 7-, 30-, and 90-day windows. Reconcile every chart and summary with the documented metrics and ledger. Verify boundary inclusion using account-local dates, correct domain filters, stable denominators, and recomputation after undo. Distinguish scheduled duration from manually logged minutes; label logged time as self-reported.

Test no data, all-zero values, one point, a full window, unusually long labels, and high counts. Avoid division by zero, invented trend percentages, misleading empty graphs, and timezone-shifted heatmap cells. Charts need readable labels and accessible text or table alternatives; color alone cannot convey status.

Review widths **320, 360, 390, 768, 1280, and 1440 pixels**, plus narrow landscape and browser zoom. Exercise navigation, agenda entry, nested subjects, custom selects, menus, dialogs, charts, friend requests, and avatar editing. There must be no clipped primary action or unintended page-wide horizontal scrolling. Mobile dialogs and the on-screen keyboard must keep essential controls reachable.

Check keyboard navigation, visible focus, field labels, error associations, touch targets, contrast, screen-reader names, and focus restoration after dialogs close. Respect reduced-motion preferences. Custom controls must retain accessible semantics. Glass effects must preserve text legibility; congratulation animations must not block the next action.

## Release evidence

Finish with a production build, focused automated results, staging Atlas persistence verification, actual Google OAuth verification, and a short responsive/accessibility inspection report. Exercise loading, offline/network failure, expired session, duplicate submission, and recovery without losing entered work. Document deployment and rollback steps and demonstrate recovery using the documented backup procedure in staging. Any failed or unrun release-critical check remains visible in the handoff; never replace evidence with a claim that everything works.
