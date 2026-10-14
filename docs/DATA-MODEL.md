# MongoDB data model

Logical schemas, not copied runtime code. Implement typed schemas, migrations, and index creation with the selected driver. All private text and sensitive values belong inside `privatePayload`, which is encrypted binary on disk. Every private payload includes `schemaVersion`, `ownerId`, `documentId`, and `recordKind`; decrypt and verify this binding before use. Common outer fields: `_id`, `ownerId` where applicable, `createdAt`, `updatedAt`, `revision`, `schemaVersion`, and `archivedAt` when archive is supported.

Avoid an unbounded single user document or unlimited subject arrays. Use references and validate ownership of every reference. IDs are opaque; unpredictability is not authorization.

## Collections

| Collection | Queryable fields | Encrypted / private content |
| --- | --- | --- |
| `users` | ID, providerIdentityHash/version, usernameNormalized, publicAlias, avatarConfig, timezone, onboardingState, discoverable, shareMetrics, sessionVersion, accountStatus, dataKeyId | Google issuer/sub/email/name; private preferences |
| `domains` | ownerId, builtInKind or custom, sortOrder, enabled, archivedAt | Custom title, description |
| `subjects` | ownerId, domainId, sortOrder, archivedAt | Title, description, optional course label |
| `units` | ownerId, subjectId, sortOrder, archivedAt | Title, description |
| `topics` | ownerId, subjectId, unitId, parentTopicId, sortOrder, leaf flag, learned, learnedSourceId/revision, everRewarded | Title, notes |
| `taskSeries` | ownerId, domainId/kind, studyKind, weekdays, wallStart/end, timezone, startDate/untilDate, slotId, revision, active | Template title, notes |
| `taskOccurrences` | ownerId, domainId/kind, studyKind, seriesId, immutable originalLocalDate, mutable scheduledLocalDate, slotId, startsAt/endsAt, sourceTopicId, goalId, state, everCompleted, scheduleRevision, completionRevision, lastCompletionLocalDate | Title, notes, source title snapshot, optional self-reported minutes |
| `completionTargets` | ownerId, targetKind task/topic, targetId, state, revision, currentAwardEventId, activeQualificationDate, firstCompletionSnapshot, lastCompletionAt | Only private fields if absolutely necessary; prefer source references |
| `xpLedger` | ownerId, targetKey, completionRevision, delta (+20/-20), reversesEventId, acceptedAt, eventLocalDate, qualifiesDate or null, ruleVersion | None; no task titles |
| `dailyActivity` | ownerId, localDate, qualifyingCount, signedXpDelta, completion counts, projectionVersion | Optional private aggregates only if necessary |
| `rewardState` | ownerId, totalXp, revision, projectionVersion | None |
| `mutationReceipts` | ownerId, operationId, requestFingerprint, resultCode, targetRevision, sanitized result, expiresAt | Do not store raw request text or notes |
| `scheduleRevisions` | ownerId, occurrenceId, revision, old/new schedule metadata, actorId, createdAt | Optional reason text |
| `goals` | ownerId, domainId, targetDate, state, sortOrder | Title, notes, optional target details |
| `notes` | ownerId, domainId, updatedAt | Title and plain-text body |
| `fitnessMeasurements` | ownerId, domainId, entryLocalDate, createdAt | Measurement label, quantity, unit, optional note; no reward linkage |
| `financeEntries` | ownerId, domainId, entryLocalDate, createdAt | Amount in integer minor units, currency, category, note, expense/income kind |
| `budgets` | ownerId, domainId, localMonth | Limit in minor units, currency, optional category allocations |
| `friendships` | canonical ordered user pair, requesterId, state pending/accepted/declined, created/updatedAt | None; private relation metadata |
| `blocks` | blockerId, blockedId, createdAt | None |
| `rateLimitBuckets` | hashed bucket key, time window, count, expiresAt | None |
| `deletionJobs` | userId, state, progress cursor, attempts, timestamps | No copied content |
| `deletionTombstones` | opaque userId, deletedAt, backup-expiry boundary | No profile or content |
| `encryption.__keyVault` | official library key document format, wrapped key material, key IDs | Never raw master key or unwrapped data key |

Habit checkboxes in Fitness are ordinary recurring task occurrences. Manual habit measurements use the separate private schema above and cannot create reward events. Relationship notes are just owner-private notes, not profiles of other users. The scope needs no student messaging or bank-account collection.

`taskOccurrences.state` and `completionTargets.state` must update in the same transaction and have a reconciliation rule; avoid independently mutable duplicate state. Direct topic targets can be created lazily on first direct completion. Linked learning uses `learnedSourceId` to avoid clearing newer learning when an old session is undone.

## Required indexes

| Collection | Index / purpose |
| --- | --- |
| users | Unique `(providerIdentityHashVersion, providerIdentityHash)`; unique partial `usernameNormalized` where assigned |
| domains | `(ownerId, archivedAt, sortOrder)`; unique partial `(ownerId, builtInKind)` for built-ins |
| subjects | `(ownerId, domainId, archivedAt, sortOrder)` |
| units | `(ownerId, subjectId, archivedAt, sortOrder)` |
| topics | `(ownerId, unitId, parentTopicId, sortOrder)` and `(ownerId, subjectId, learned)` |
| taskSeries | `(ownerId, active, untilDate)` |
| taskOccurrences | `(ownerId, scheduledLocalDate, startsAt)` and `(ownerId, domainId, state)`; unique partial `(ownerId, seriesId, originalLocalDate, slotId)` only for recurring records |
| completionTargets | Unique `(ownerId, targetKind, targetId)` |
| xpLedger | Unique `(ownerId, targetKey, completionRevision)`; `(ownerId, acceptedAt)`; unique partial `reversesEventId` for reversal records |
| dailyActivity | Unique `(ownerId, localDate)` |
| rewardState | Unique `ownerId` |
| mutationReceipts | Unique `(ownerId, operationId)`; TTL `expiresAt` for bounded retry window |
| scheduleRevisions | Unique `(ownerId, occurrenceId, revision)` |
| goals / notes | `(ownerId, domainId, updatedAt)` |
| fitnessMeasurements | `(ownerId, entryLocalDate)` |
| financeEntries | `(ownerId, entryLocalDate)` |
| budgets | Unique `(ownerId, domainId, localMonth)` for v1 one budget per month |
| friendships | Unique `(lowerUserId, higherUserId)`; indexes on each member and state |
| blocks | Unique `(blockerId, blockedId)`; reverse lookup `blockedId` |
| rateLimitBuckets | Unique bucket key/window; TTL `expiresAt` |
| deletionJobs / tombstones | Unique `userId`; expiry policy only after backup-retention requirements |
| key vault | Library-recommended unique partial keyAltNames index, if used |

Choose exact MongoDB partial-filter syntax supported by the selected server version. Build indexes in a migration, detect existing duplicates, and fail with actionable diagnostics; do not assume a TypeScript type enforces uniqueness. Projection repair must not drop unique indexes.

## Consistency and lifecycle

- Transactions require a replica set or compatible Atlas deployment. Test against a replica set; a standalone local database is not an adequate reward test environment.
- Race-safe first login: upsert user by unique provider hash, then provision domains and a key with retry-safe state. An incomplete onboarding/provisioning record cannot decrypt or write private data until the key is ready.
- Per-user KMS data keys and HMAC lookup keys have different purposes. Rotate provider lookup HMAC using versioned dual-read migration; do not silently create duplicate accounts after rotation.
- Task recurrence edits carry revision scope. Archived source topics leave encrypted snapshots and historical references intact. Cancel pending occurrences when archiving an active series; preserve completed records.
- Recurring originalLocalDate and slotId are immutable generation identity; scheduledLocalDate can move before first successful completion. Preserve original-key exceptions for moved/cancelled occurrences. Expansion deduplicates by original identity, while date-window reads use scheduledLocalDate. Series edits never erase exceptions and recreate already moved work.
- Use bounded page size (default 30, maximum 100) and analytics range (maximum 366 days). Index filtering metadata before decrypting result pages. Large private search must paginate, never download every student's content.
- Mutation receipt retention may be 7 days; beyond that, stale target revisions still prevent replaying an old completion. Deleting receipts must never delete ledger identity protections.
- Friend leaderboards query only the accepted visible friend set plus self. Maximum initial friend count 200 is a documented operational limit. No global leaderboard scan.
- Finance v1 uses a selected account currency, no automatic conversion or mixed-currency totals. Changing currency is a display/data migration decision, not multiplication by a guessed rate.
- Account deletion removes owned content and both directions of friendship/block links, invalidates sessions, and follows the key/backup lifecycle in SECURITY.md.

## Migrations

Track applied migration IDs/checksums. Include initial schema/index creation, schemaVersion compatibility, key metadata initialization, and projection rebuild scripts. Migrations are explicit commands; the web request path must not create/drop indexes repeatedly. Test migrations on an empty database and an existing synthetic dataset before release.
