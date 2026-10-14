# Canonical scheduling, rewards, streaks, and analytics rules

These are proposed version 1 product decisions, made explicit so separate screens and servers cannot implement different rules. Change this document and its tests together if the owner chooses different behavior. This document takes precedence over shorthand descriptions elsewhere in the pack.

## Reward units

| Action | XP | Study streak |
| --- | --- | --- |
| Valid completion of one actionable task occurrence in any domain | +20 | Only eligible self-study occurrence |
| Directly mark a previously unlearned college leaf topic learned | +20 through one stable topic reward identity | Never |
| Mark subject/unit/parent complete | No separate award; parent status derives from leaves | Never |
| Learn linked topic through completed self-study session | Session's +20 only; optional topic update adds no second reward | Session may qualify |
| Add/edit notes, expenses, budgets, goals, avatar, measurement, or profile | 0 | Never |
| Login, visit dashboard, view a chart, add a friend | 0 | Never |
| Undo an awarded completion | -20 | Removes that completion's qualification, if any |
| Recomplete after undo | Restores +20, net reward for identity at most 20 | Evaluate eligibility again at new server time |

An occurrence is one planned execution, not an entire recurring task series. A weekly task may award once for each scheduled date. Unscheduling/reordering/renaming the same task does not create a new reward identity. Explicitly creating a new revision session creates a new identity, so studying a topic again can earn XP again.

Rewarding direct topic mastery: create one stable `topic:<topicId>` completion target. Its direct learned/unlearned toggle uses the same completion service when learning was directly awarded. If a session marks that leaf learned, do not also complete the direct target. A leaf already learned through a session cannot collect a new direct award by being clicked again. For session-sourced learning, disable the direct unlearn checkbox and offer “Undo source session” with its XP/streak consequences explained; v1 has no separate learning-only undo. Reversing learning must identify the active learning source; undoing a session reverts the linked learning update only if that session is still its source. A later session must not replace an already-learned source simply by checking an unchanged state. Undoing an older source must never overwrite newer learning. Record the source and revision; test this explicitly.

Only leaves are rewardable. Once a leaf has a completion/history, do not add children to it in v1; require a new parent or sibling so reward identity cannot change meaning. Structural parents show calculated progress and have no “complete all for XP” action. Archiving content retains its historical reward records; deleting/archive is not undo. Account deletion is the exception that removes account history.

V1 XP is a self-reported encouragement metric. No reward amount submitted by a client is trusted. Flat 20 XP, no duration/effort multiplier, daily cap, spending currency, or leaderboard prize system. Rate limits and unique identities reduce accidental or automated duplication, but do not prove a student did the work. Do not market the ranking as cheat-proof.

Total XP = sum of immutable signed ledger entries for that user. An optional level display uses `1 + floor(totalXp / 200)` with progress `totalXp % 200`; no separate mutable level authority.

## Time and calendar model

- Select an IANA timezone during onboarding. Detect a candidate in the browser but require the user to see and confirm it. V1 keeps this canonical timezone fixed. Show it in settings and planner. Travel does not silently rewrite dates.
- Persist UTC instants for start/end/completion plus the account timezone and scheduled local date `YYYY-MM-DD`. Use calendar-aware timezone functions; do not assume every day is 24 hours or that the server runs in the user's timezone.
- A scheduled task cannot complete before its start instant. Once the start has passed, it may complete after its planned end. Unscheduled tasks can complete immediately but never qualify the study streak until explicitly scheduled before completion.
- Self-study requires a date, start, and end. For v1, keep sessions inside a single local date; tell the user to split overnight sessions at midnight. This is a documented scope choice.
- An overdue pending occurrence may be explicitly rescheduled to today before its first successful completion. Save an audit revision of the old/new schedule; evaluate the new schedule. This is intentional rescheduling, not retroactive streak repair.
- The first **successful** completion freezes reward identity, domain/category, source, schedule, and eligibility snapshot. Rejected attempts write nothing. After undo, the occurrence's frozen reward/schedule fields remain fixed; private wording can change. Use a new occurrence for a new date.
- Repeating weekly tasks store weekdays, local wall times, timezone, anchor/start date, and optional until date. Stable unique key: `(ownerId, seriesId, originalLocalDate, slotId)`. The immutable originalLocalDate identifies the generated slot; the separately mutable scheduledLocalDate determines current placement and streak eligibility. Rescheduling Oct 12's instance onto Oct 13 must not collide with Oct 13's original instance or let expansion recreate Oct 12. Retain moved/cancelled exceptions under their original keys. Materialize only a bounded horizon, retaining exceptions and completed history.
- Reject manually entered nonexistent DST times with a helpful explanation. For an ambiguous manual time, ask the user to choose first or second occurrence. For generated weekly instances, skip nonexistent times with a visible exception; choose the earlier offset for repeated times consistently. Test a DST-observing zone even if development uses Asia/Kolkata.
- Recurrence edits affect only pending occurrences within the chosen scope. Never regenerate a completed occurrence under a fresh ID. Deleting a series cancels future pending instances, preserving history.

## Streak eligibility

A successful completion qualifies exactly when all these conditions are true at the server:

```text
task.domainKind == study
task.studyKind == self_study
task has a valid saved schedule
localDate(serverNow, canonicalTimezone) == scheduledLocalDate
serverNow >= startsAt
completion transition is accepted and not reversed
```

One qualifying completion is enough to qualify that date. Two qualifying sessions on the same date still add only one streak day. Maintain a per-day `qualifyingCount` so undoing one of several qualifying completions does not erase the date. Compute from events; the counter is a rebuildable projection.

Let Q be the set of local dates with at least one active qualifying completion:

- If today is in Q, current streak is the consecutive run ending today.
- Otherwise, if yesterday is in Q, current streak is the run ending yesterday. Today is still available to extend it; show “Study today to continue.”
- Otherwise current streak is 0.
- Longest streak is the longest consecutive run in Q. Reversing historical completions may reduce it; do not preserve a no-longer-supported record.
- No freeze, grace day, login streak, or backdated completion. Late completion earns XP but cannot add a qualifying past date or today's streak.

Recompletion after undo uses the current server timestamp. It can qualify only if the frozen scheduled date is still today. Undo yesterday and recomplete today: XP restores, yesterday's streak credit does not. Browser clock changes and client-supplied completion timestamps have no authority.

Examples with canonical timezone Asia/Kolkata:

| Situation | Expected |
| --- | --- |
| Oct 13 10:00 session completed Oct 13 10:30 | +20 XP; Oct 13 qualifies |
| Second Oct 13 session completed | +20 XP; same one qualifying day |
| Fitness task completed Oct 13 | +20 XP; no study streak change |
| College leaf directly completed | +20 XP once; no study streak change |
| Oct 12 session completed Oct 13 | +20 XP; neither date gains streak credit |
| Oct 14 09:00 session completed Oct 13 | Reject with no writes |
| Today incomplete, yesterday run is 5 | Display current 5 until today's deadline |
| A full local day passes without qualifying | Current becomes 0 at the following day's read |
| Undo only qualifying Oct 13 session | Reverse XP; remove Oct 13 from Q |

## Atomic completion service

Inputs: authenticated account, target ID, desired completed state, `expectedRevision`, and client-generated operation UUID. Optional self-reported minutes are a separate validated value, never a reward multiplier.

1. Authenticate, verify active account, validate schema, load owner-scoped target and any linked leaf. Read a trusted current time once for the accepted operation; do not trust browser dates.
2. Check idempotency `(ownerId, operationId)`. A retry with the same request fingerprint returns the original result; the same operation ID with different parameters returns conflict.
3. In a transaction, acquire/update the per-user reward revision and compare target revision. A fresh operation against stale state returns 409; it does not silently flip state. A no-op matching state earns nothing.
4. Validate eligibility. Atomically update target state/revision, append a unique signed ledger entry when an award transition occurs, store completion/qualification snapshot, update relevant day count and XP projection, optionally update linked learning using its source revision, and persist the operation result.
5. Commit. Only then emit a completion response with authoritative totals, streak, target revision, and whether this operation newly qualified the day. The UI celebrates only a newly applied positive transition, never an idempotent replay.
6. On transient retry/unknown commit outcome use the driver's supported mechanisms and the same operation ID. Do not rerun external side effects inside a transaction callback. If failure is unresolved, show retryable “not confirmed,” not success.

Ledger keys must distinguish transitions: `(ownerId, targetId, completionRevision)`. Reversals reference the award event they reverse and cannot reverse it twice. Daily counts never go below zero. Periodic reconciliation can rebuild projections from retained history; failures must not be silently repaired by client arithmetic.

## Analytics definitions

All charts use one authenticated analytics service and the same data source as Today and rankings. Date filters are inclusive local dates with UTC boundaries calculated from the canonical timezone; 7/30/90 days include today. Weekly views begin Monday by default.

| Metric | Definition |
| --- | --- |
| Scheduled completion rate | Completed, non-cancelled occurrences scheduled in range / all non-cancelled scheduled occurrences in range. State reflects current completion; disclose late completions count here. Unscheduled tasks excluded. |
| On-time completion rate | Same denominator, numerator completed on their scheduled local day at/after start. Kept separate from overall completion. |
| Active study days | Distinct qualified self-study dates in range, after reversals |
| Planned minutes | Sum of saved scheduled durations for non-cancelled self-study occurrences in range |
| Completed planned minutes | Scheduled duration of currently completed self-study occurrences in range; label as planned duration, never actual work |
| Self-reported study minutes | Optional nonnegative integer actualMinutes on completed self-study occurrences; bucket by accepted completion date; no double counting on undo/recomplete. Label self-reported and show missing-entry count. |
| College coverage | Learned active leaves / all active leaves in selected subject. Units/parents derived; adding leaves changes denominator. Archived leaves excluded from current coverage. |
| XP history | Signed ledger delta by event date; undo appears as negative XP. Cumulative total includes opening balance before the filter range. |
| Domain distribution | Count of currently completed occurrences by domain, or explicitly selected planned-minute measure. Direct topic mastery presented separately so sessions and topics are not double-counted. |

Validate self-reported minutes as integer 0..1440 per occurrence and total at most 1440 for its assigned completion local date; test updates across concurrent sessions. Zero means an explicit zero, null means not recorded. This is an input guard, not proof of effort.

For a zero denominator display “No tasks scheduled,” not 0% failure. When previous comparison period is zero, show absolute change instead of infinite growth. Avoid invented productivity scores. Deterministic insights may state “You completed 4 of 6 planned sessions this week”; they may not infer attention, health, relationship quality, or learning mastery beyond the recorded data.
