# Server API contract

Implement these capabilities through thin Next.js Route Handlers and shared domain services. Exact handler organization may change; capability, authorization, and state contracts must remain intact. Generate/update typed request/response schemas alongside implementation. Google protocol routes are owned by the auth library, not manually implemented here.

## Shared conventions

- `/api/v1` for app endpoints. Authenticate every endpoint except public health, public assets, and the auth library's protocol endpoints.
- Derive owner ID from the verified session. Reject submitted owner IDs and server-owned properties such as XP, `qualifiesDate`, `learnedSourceId`, or completion timestamp.
- Validate input/output with schemas. Use bounded strings, lists, and page sizes; opaque IDs; local dates `YYYY-MM-DD`; UTC ISO instants; explicit IANA timezone rules.
- Return only authorized DTOs, never raw Mongo documents, encrypted blobs, key IDs/material, provider hashes, or private fields from other users.
- Successful reads: `{ data, nextCursor? }`. Successful mutation: `{ data, revision, operationId? }`. Errors: `{ error: { code, message, fieldErrors?, requestId } }`. No stack traces in production responses.
- Status codes: 200/201 success; 400 malformed; 401 no valid session; 403 operation not permitted; 404 absent or inaccessible record; 409 stale revision/duplicate conflict; 422 invalid business action; 429 rate limit; 503 dependency unavailable.
- Cookie-authenticated mutations require CSRF/trusted-origin defenses. Set private/no-store responses. Use `If-Match` or an `expectedRevision` field for edited resources, consistently.
- Cursor pagination: default 30, max 100. Analytics range max 366 days. Date-window occurrence reads may use explicit bounded dates instead of cursor pagination.
- Sensitive actions such as export/account deletion require recent reauthentication. All limits apply on the server even when the UI disables a button.

## Identity, profile, settings, and domains

| Method and path | Behavior |
| --- | --- |
| GET `/me` | Own profile, onboarding state, timezone, permitted privacy settings, own reward summary |
| POST `/onboarding` | Unique username, public alias, avatar config, confirmed timezone, selected domains, explicit discovery/sharing choices; retry-safe finalization |
| PATCH `/me` | Own alias/avatar/private preferences; username availability checked atomically; timezone immutable after onboarding |
| PATCH `/me/privacy` | Toggle discovery and metric sharing; visibility changes apply immediately |
| POST `/me/logout-all` | Increment sessionVersion and clear caller session |
| GET `/me/export` | Recent-auth protected no-store JSON stream containing own data only |
| DELETE `/me` | Recent-auth + confirmation; disable account and queue retryable deletion; return 202 pending removal |
| GET/POST `/domains` | List enabled/archived own domains; create custom domain |
| PATCH `/domains/:id` | Edit custom label/order/enable state; cannot turn built-in type into another type |
| POST `/domains/:id/archive` | Preview/confirm impact; retain historical records and cancel future pending instances if requested |

Server-provided Google name/email must never be used as public alias by default. Avatar values are allowlisted part IDs/colors. Username lookup and uniqueness use normalized ASCII form, with reserved usernames rejected. A privacy update does not reveal prior data retroactively.

## College content

| Method and path | Behavior |
| --- | --- |
| GET/POST `/subjects` | List/create subjects owned by caller |
| GET/PATCH `/subjects/:id` | Subject detail/edit with derived coverage |
| GET/POST `/subjects/:id/units` | Unit list/create after parent ownership check |
| PATCH `/units/:id` | Edit/reorder unit; movement validates old/new parents |
| GET/POST `/units/:id/topics` | Read/create tree nodes with validated parent and bounded depth |
| PATCH `/topics/:id` | Rename/reorder; prevent cycles, cross-user references, and leaf-to-parent conversion with reward history |
| POST `/{subjects|units|topics}/:id/archive` | Archive or restore through explicit boolean/action; keep history |
| POST `/topics/:id/schedule` | Create self-study occurrence or series with linked source + encrypted snapshot; same validation as planner create |

Use `/completion` below for direct leaf mastery; do not add an independent XP-increment endpoint. V1 imports one leaf per session; students may create multiple sessions. Parent bulk-completion is not a reward path. Search is owner-scoped and bounded; private plaintext titles never enter shared indexes.

## Planner and completion

| Method and path | Behavior |
| --- | --- |
| GET `/occurrences?from=...&to=...&domainId=...` | Own bounded schedule; idempotently ensure required recurrence horizon |
| POST `/occurrences` | Create one task/session; require self-study date/start/end; optional source topic and goal |
| PATCH `/occurrences/:id` | Edit/reorder/reschedule before first successful completion; record schedule revision; private content edits permitted afterward |
| POST `/occurrences/:id/cancel` | Cancel pending occurrence, preserve series exception and history |
| POST/PATCH `/series[/:id]` | Weekly series create/edit; explicit scope `this` or `this_and_future_pending`, anchor occurrence, expected revision |
| POST `/series/:id/cancel` | Cancel future pending instances, preserve past/completed instances |
| POST `/completion` | One authoritative completion/undo service for occurrence or college leaf |
| PATCH `/occurrences/:id/reported-minutes` | Integer minutes or null; completed self-study only, day cap enforced transactionally; no XP effect |

Example completion request:

```json
{
  "targetKind": "occurrence",
  "targetId": "opaque-id",
  "completed": true,
  "expectedRevision": 2,
  "operationId": "client-generated-uuid",
  "markLinkedTopicLearned": false,
  "reportedMinutes": null
}
```

Example authoritative result shape, illustrating a newly qualified first day:

```json
{
  "data": {
    "applied": true,
    "completed": true,
    "xpDelta": 20,
    "totalXp": 20,
    "currentStreak": 1,
    "longestStreak": 1,
    "newlyQualifiedDay": true,
    "qualifyingDate": "2026-10-13"
  },
  "revision": 3,
  "operationId": "client-generated-uuid"
}
```

Retrying the same operation returns its prior outcome with an explicit replay marker so the client does not celebrate again. A 409 returns enough information to reload current own state and retry deliberately. A timeout shows unconfirmed state; retry the same operation ID, not a new one. On undo, `xpDelta` is -20 only if reversing an active award, and any learning-source change follows GAMIFICATION.md.

Minutes updates share the same per-user reward serialization/transaction lock as completion and undo. Decrypt authorized minute entries for the edited record's latest accepted completion local date, even if that date is historical; check the sum including the proposed update and commit under that lock. Recompletion reassigns its active contribution to the new accepted local completion date and validates the new day.

## Other domains

| Method and path | Behavior |
| --- | --- |
| GET/POST/PATCH `/goals[/:id]` | Private goals by domain; progress from linked actionable tasks; goal edits/closure add no XP |
| GET/POST/PATCH `/notes[/:id]` | Owner-private plain-text notes by domain |
| DELETE `/notes/:id` | Explicit own-note deletion, no reward effect |
| GET/POST/PATCH `/fitness-measurements[/:id]` | Optional manual habit quantity/date/unit record; private, no automatic XP |
| DELETE `/fitness-measurements/:id` | Remove own measurement |
| GET/POST/PATCH `/finance-entries[/:id]` | Manual income/expense; integer minor units, selected currency, encrypted content |
| DELETE `/finance-entries/:id` | Remove own entry; recalculate own budget view, no reward effect |
| GET/PUT `/budgets/:localMonth` | One own monthly budget, encrypted amounts; no bank APIs |
| DELETE `/budgets/:localMonth` | Remove own monthly budget without removing expenses or changing XP |

Generic domain tasks use `/occurrences` and the shared completion service. Fitness habit checkboxes are recurring tasks; a measurement is separate. Relationship reminders are tasks with private titles, not invitations or messages to other people. Do not require access to contacts.

## Friends and leaderboards

| Method and path | Behavior |
| --- | --- |
| GET `/people?username=exact_name` | Exact discovery-enabled match; minimal username/alias/avatar only; enforce block checks |
| GET `/friends` | Accepted friend DTOs plus own incoming/outgoing requests |
| POST `/friend-requests` | Send by target ID returned from search; reject self/blocked/duplicate requests |
| POST `/friend-requests/:id/respond` | Recipient only accepts/declines pending request |
| DELETE `/friend-requests/:id` | Sender cancels pending request |
| DELETE `/friends/:id` | Either member removes friendship |
| POST `/blocks` | Block target, atomically end friendship/cancel pending requests |
| DELETE `/blocks/:targetId` | Unblock without restoring old relationship |
| GET `/leaderboard?sort=xp|streak` | Self + accepted unblocked sharing-enabled friends; no private activity details |

Leaderboard ordering: XP tab sorts totalXP desc, currentStreak desc, normalized username asc. Streak tab swaps first two keys. Return position as stable ordinal order and disclose tie handling. Current streak is computed against each user's canonical local day; never assume all friends share the viewer's timezone. Rankings may differ by viewer because only their friends are included. Show own position even if sharing is off.

## Analytics and operational endpoints

GET `/analytics?range=7d|30d|90d&domainId=...` returns locally bucketed metrics, chart series, definitions, empty-state flags, and last calculated time. It must obey GAMIFICATION.md formulas. Range-specific rows exclude inaccessible and cancelled data according to those formulas, while cumulative XP includes opening balance.

GET `/activity?from=...&to=...` returns the caller's heatmap/daily qualification data only. GET `/health` exposes process liveness without secrets. Readiness checks can validate dependencies internally; never return connection URIs or key identifiers publicly. Administrative migrations/rebuilds are CLI operations, not unauthenticated web endpoints.
