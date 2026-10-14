# Security and privacy contract

## What “encrypted” means here

All persisted database data must have encryption at rest and all network connections must use TLS. Atlas documents [always-enabled encryption at rest](https://www.mongodb.com/docs/atlas/security-encryption-at-rest-overview/) and [TLS plus field-encryption options](https://www.mongodb.com/docs/atlas/architecture/current/data-encryption/).

Additionally encrypt private payloads before they reach MongoDB. This limits exposure from a database dump or a database-only credential leak. The application server is trusted and can decrypt authorized content. It does not protect against a fully compromised application server with usable key permissions, a compromised signed-in browser, or a student voluntarily sharing an export. **Do not call this end-to-end encryption or claim that all fields are invisible to the server.**

“Client-side field-level encryption” refers to the MongoDB client running on our server, not necessarily the student's browser. Operational fields and intentionally shared profile data remain queryable under the explicit classification below, protected by storage encryption and access controls.

## Data classification

| Classification | Fields | Treatment |
| --- | --- | --- |
| Private content | Real name/email, Google subject, college subject/unit/topic names and descriptions, task titles/notes, relationship notes, custom-domain labels, goals, finance values/notes/currency, optional self-reported minutes | Encrypted payload using randomized CSFLE |
| Operational metadata | Internal IDs/owner IDs, source links, domain kind/IDs, ordering keys, task states, dates/times/timezone/day keys, recurrence rules, timestamps, revisions, completion identities, daily counts, ledger XP, friend relationship edges | Queryable; Atlas encryption at rest, TLS, strict authorization; document metadata leakage |
| Restricted lookup | Versioned HMAC of provider identity; sessionVersion; throttling keys | Server-only, queryable for lookup, never returned publicly; HMAC is not encryption |
| Intentionally shared | Chosen username, chosen public display alias, allowlisted avatar configuration, opted-in XP/streak metrics | Minimal friend/search DTOs under consent; separate from real Google identity |
| Secrets | Google client secret, auth secret, identity-HMAC key, local dev encryption master key, production KMS credentials | Host secret manager or untracked local environment, never database payload/source/browser |

Default all new fields to private until explicitly classified. Never add an unencrypted duplicate of an encrypted name “for search.” Private title search in v1 is bounded, owner-scoped, decrypted on the server; no global plaintext search index. Numeric finance summaries are computed after authorized decryption and not exposed to rankings. Account activity metadata remains sensitive even when queryable; database administrators can infer schedules and relationships from it.

## Field encryption implementation

Use the official MongoDB `ClientEncryption` implementation with explicit randomized CSFLE. See [MongoDB's explicit encryption guide](https://www.mongodb.com/docs/manual/core/csfle/fundamentals/manual-encryption/). Confirm driver and native encryption package compatibility on the deployment image before depending on it.

Serialize a validated, versioned private payload; include the internal owner ID, document ID, and record kind inside that encrypted payload. On decrypt, validate schema and compare this binding with the outer document. This detects ciphertext copied to another record. Use a per-user data encryption key, wrapped by a production cloud KMS key, with only the wrapped material in the key vault. Authorization happens before decryption. Keep decrypted material in memory only for the request and minimize cache lifetime.

Use random local master-key material only in local development/test, outside version control and outside the database. Production must fail startup if local-key mode or missing KMS protection is selected. Production key access uses a narrowly scoped workload identity where available. AWS KMS is the proposed default; switching KMS provider is an explicit infrastructure decision, not a reason to replace MongoDB or weaken encryption.

Implement collection validation for encrypted binary payload fields where feasible, plus repository-level validation. Reject plaintext writes. Missing keys or integrity failures return a safe error and do not overwrite data. Do not log ciphertext alongside keys, raw payloads, secrets, or full database errors.

Document key vault backup, recovery, KMS permissions, and rotation before launch. Test decrypting retained data after key rewrapping in staging. Rotating a wrapping key and re-encrypting all data are distinct operations; use the library-supported procedure, version it, and verify rollback/recovery. Never delete the only usable key while retained backups still require it.

## Authentication and authorization

- Google-only OIDC through a maintained library. Minimal `openid`, `email`, `profile` scopes; no Contacts, Drive, Gmail, or Calendar scopes for version 1.
- Rely on verified issuer/subject and protocol validation, including state/nonce and PKCE as supported by the chosen library/provider. Validate authorized callback origins; do not hand-roll these flows.
- Do not use email as the account identity or automatically link accounts with matching email. Require a verified Google email for onboarding if email is retained.
- Secure, HttpOnly, appropriately SameSite session cookies. Tokens never go in localStorage. Rotate sessions according to the library's supported configuration. Check expiration and server-side account status on each protected request.
- Every query, including nested subjects/units/topics and imported source IDs, checks the same authenticated owner. Cross-user object IDs must not bypass ownership. Return safe 404/403 without revealing private record existence.
- Treat all entry points as public attack surfaces. Client route guards are UX only. Enforce CSRF protection, trusted-origin validation, and content-type validation on cookie-authenticated mutations using the chosen framework/library's supported mechanism.
- Schema validation, maximum body/list/string sizes, safe URL protocols, output escaping, and no untrusted HTML rendering. Default notes to plain text. Avoid arbitrary SVG uploads; avatar values come from a fixed allowlist.

## Friends and privacy

Username discovery is opt-in and exact-match by default; normalize to lowercase ASCII `[a-z0-9_]{3,24}` with a unique index. Do not expose email search or a directory of all students. Rate-limit sign-in initiation, username lookup, friend requests, and reward mutations.

Friend requests do not confer read access. Accepted friendship plus metric-sharing consent is required for ranking visibility. Separate controls cover “Find me by username” and “Share XP/streak with accepted friends”; default off with clear onboarding choices. Blocking hides both parties from discovery and leaderboards, rejects new requests, and removes the friendship. Unblocking does not recreate it. Re-check visibility on every leaderboard request rather than trusting a cached membership list.

Private relationship notes about another person are never shared with that person or other friends. No public activity feed, chat, contacts import, or public study calendar in version 1.

## Browser, logs, and infrastructure

Use a suitable Content Security Policy, secure headers, dependency audit, sanitized error reporting, and host-level TLS. Prevent personalized responses from entering shared caches. Keep telemetry free of titles, notes, monetary amounts, OAuth parameters, and decrypted content; avoid third-party session replay on private pages. Use least-privilege Atlas credentials and narrowly scoped network access. Confirm hosting egress/private-network support rather than leaving the database open to all IPs as the default deployment guide.

No persistent offline queue of private content in v1. If connectivity fails, show unsaved status and retain a draft only in the current in-memory view. A completion is not successful until the server commits it.

## Export, deletion, and recovery

Authenticated export provides the student's own data only, via a no-store response after recent reauthentication. Explicitly tell the student that the downloaded export contains readable private data. Do not stage plaintext exports in public object storage. Avoid CSV formula injection if CSV export is later added; JSON is the v1 default.

Account deletion requires recent authentication and an explicit confirmation. Immediately disable the account and invalidate sessions, then remove private records, friend links, public projections, identity lookup, and owned key-vault records through a retryable deletion job. Check deleted status in requests and transaction commits to prevent in-flight recreation. Record only a minimal deletion tombstone needed for restore hygiene, with no private content.

Set a documented backup retention period during deployment. Explain that backups expire according to that policy rather than promising immediate erasure from all snapshots. A restore runbook must reapply deletion tombstones and revocations before serving traffic. Do not claim legal compliance, student verification, or certification merely because these controls exist.

## Required evidence

Before launch: raw database inspection shows ciphertext for private examples; unauthorized users cannot read or mutate each other's records; no keys appear in browser bundles/logs; KMS failure fails closed; session revocation works; blocked friends lose access; a restore and key-recovery exercise succeeds. Record actual evidence in STATUS.md.
