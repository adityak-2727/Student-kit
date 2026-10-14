# Setup and deployment runbook

Google authentication, encrypted identity persistence, owner checks, revocation, migrations and verification commands are implemented. Real Google, Atlas, AWS KMS and Linux-container checks are blocked by missing setup; local MongoDB tests are separate evidence. The public preview runs without credentials. Follow `PHASES.md`; see `STATUS.md` for actual results.

## Run the current build

Use Node 24.x (tested 24.13.0) and pnpm 12.11.2. The exact installed versions and deferred compatibility choices are recorded in `DECISIONS.md`. If pnpm is not on PATH, prefix any command below with `npx --yes pnpm@12.11.2` instead of `pnpm`.

```powershell
npx --yes pnpm@12.11.2 install --frozen-lockfile
npx --yes pnpm@12.11.2 dev
```

Open `http://127.0.0.1:3000`. No external credentials or `.env.local` are required for this public development preview. It cannot sign in, save records, award XP, or create accounts. Copy `.env.example` to untracked `.env.local` only if preparing integration settings; leave `APP_MODE=foundation` and `ENABLE_TEST_AUTH=false`. Next.js sets `NODE_ENV`; do not set it in the copied file.

In development, `http://127.0.0.1:3000/dev/shell` displays the synthetic workspace. Every sample value is labelled. Edits live only in React memory until refresh; they never call an account/data API, earn rewards or simulate provider success. The server rejects the route before fixture imports unless `NODE_ENV=development`; production builds return 404 even with fixture/demo query parameters. The homepage links to it only during development. This route does not authenticate anyone.

These check commands are implemented:

```powershell
pnpm config:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:shell
pnpm audit
pnpm audit:production
pnpm start
```

`test:e2e` requires `build` first and starts its own local production server; stop any server using port 3000 first. It refuses to reuse an unknown or development server as production evidence. Screenshots go to `docs/evidence/`. `start` opens the same built app at port 3000; stop an existing local server before starting another. `dev`/`start` bind to loopback for local use; a future container will need an explicit host binding.

`test:shell` starts a separate development server at `127.0.0.1:3100`; stop any server using that port first. The suite inspects the shell at seven CSS widths, native keyboard events, focus trapping/return, menus/tabs/selects/date entry, rem-based 200% text sizing, long titles, state examples and 390×420 keyboard-space emulation. Axe checks cover WCAG A/AA rules supported by the checker; computed control-border contrast is checked too. Passing these checks is not a complete screen-reader or physical-phone keyboard audit. Font requests are verified local to the app; bundled Manrope/Newsreader licences are retained under `docs/licenses/`.

The dev/build/start scripts run configuration validation before launching Next; build/start load production env-file precedence. Next instrumentation also checks server runtime settings. Audit commands query the package advisory service and do not suppress reported vulnerabilities; see `STATUS.md` for known development-tooling findings.

`pnpm config:check --integration` checks syntax, not connectivity. `APP_MODE=live` makes complete integration validation mandatory at startup/build. Production live mode requires HTTPS/AWS KMS and rejects local wrapping keys. Test-auth bypass is rejected in every mode. `APP_ORIGIN` is canonicalized; optional `NEXTAUTH_URL` must resolve to the same origin. Restart after configuration changes. No request forwarding header determines callbacks.

`pnpm start` checks live database migrations/indexes and key wrapping/decryption **before launching Next**. Production Node instrumentation also checks these dependencies. The probe creates one temporary wrapped key, tests randomized encryption/decryption in memory, and deletes it. No account content is written. If cleanup is interrupted, maintain only `startup-probe:` key aliases; never remove retained user keys. Public `foundation` mode exposes no account services and requires no external dependencies.

`GET /api/v1/health` returns `{ "data": { "status": "ok" } }` with no-store caching. It proves process liveness only. Private/auth responses are private/no-store. `/app/today` redirects signed-out visitors to `/signin`; authenticated accounts see an account connection handoff until onboarding arrives. Real accounts never receive synthetic schedules or scores.

## 1. Establish a compatible baseline

At implementation time, verify supported stable versions of Node.js, Next.js, React, TypeScript, pnpm, the MongoDB driver, its native encryption package, and the selected authentication library. Record versions and sources in `STATUS.md`, commit the lockfile, and pin the package-manager version. Follow the current [Next.js installation guidance](https://nextjs.org/docs/app/getting-started/installation).

Confirm authentication release status explicitly: the [Auth.js Next.js reference](https://authjs.dev/reference/nextjs) currently documents a beta installation path. That is not evidence of a stable release. Use one verified supported integration and matching documentation, recording any replacement decision; never mix v4 and v5 configuration examples.

Prove official `ClientEncryption` can load, encrypt, decrypt, and reject tampering both locally and inside the intended container. Validate driver/native package/runtime compatibility before committing to a host. Run application services in Node, not Edge. Choose one supported container architecture and a compatible base image; native modules must survive the actual production build and packaging process.

## 2. Prepare separate environments

Create isolated development, test, staging, and production databases, key vaults, credentials, and encryption configuration. Use a transaction-capable MongoDB replica set for automated integration tests; a standalone development server cannot prove the completion transaction design. Run real deployment checks against staging Atlas.

Copy the pack's `.env.example` into an untracked local configuration file once the repository exists. Replace placeholders privately on your machine or in the host's secret manager. Do not send credentials into chat. Reject missing or placeholder production settings at startup; never fall back silently to demo storage, fixture users, or local encryption.

Generate independent random values for authentication and identity lookup. Use the selected auth library's documented secret-generation method. Generate the HMAC key with a cryptographically secure generator, using at least 32 random bytes. For local CSFLE only, generate **96 random bytes**, then base64-encode for configuration; validate the decoded byte length. Node's `crypto.randomBytes` is suitable for the generation script. Write results directly to protected untracked configuration without printing them in shared logs. The local-provider size follows MongoDB's [encryption specification](https://github.com/mongodb/specifications/blob/master/source/client-side-encryption/client-side-encryption.md).

Keep existing keys across restarts. Regenerating a local master key makes previously wrapped keys unusable. Back up development keys only in an appropriate private secret store.

## 3. Configure real Google authentication

In Google Cloud, create the appropriate OAuth consent configuration and a Web application client. Configure the app name and required consent information; add permitted test accounts while the app is in testing mode. Use only `openid`, `email`, and `profile` scopes.

Register exact redirect URIs for each environment. With the planned default auth route these are `http://localhost:3000/api/auth/callback/google` locally and `https://YOUR_STAGING_DOMAIN/api/auth/callback/google` or `https://YOUR_PRODUCTION_DOMAIN/api/auth/callback/google` remotely. Confirm the route used by the actual integration. Match scheme, host, port, and path; avoid uncontrolled preview origins. These paths follow the [Google provider documentation](https://authjs.dev/reference/core/providers/google).

Store client credentials server-side. The baseline uses library-managed JWT sessions containing internal account ID and session-version metadata, without a generic database adapter. Map verified Google issuer/subject through a versioned HMAC lookup; retain raw subject and private profile only in encrypted payloads. Do not store Google tokens for unused APIs or identify accounts by email. Verify real sign-in, sign-out, re-entry, and revocation in staging; automated identity fixtures are separate evidence.

## 4. Configure Atlas and key protection

Create an Atlas project/cluster suitable for the transaction and backup requirements. Create scoped application credentials for the environment's database and key vault; use separate elevated migration credentials when needed. Restrict network access to approved developer addresses and deployment egress or private connectivity. Keep TLS validation enabled. Do not make unrestricted IP access the deployment default.

Apply collection validation, required unique indexes, key-vault indexes, and migrations before serving traffic. Verify private payloads appear as encrypted BSON data through a raw database inspection. Only the exceptions in `SECURITY.md` remain queryable.

AWS KMS is the proposed production wrapping-key provider. Provision a suitable KMS key, region, narrowly scoped runtime identity, and the permissions needed by the documented MongoDB encryption flow. Prefer workload identity over long-lived access keys. Keep per-user wrapped data keys in the environment's key vault. Follow MongoDB's [key management guide](https://www.mongodb.com/docs/manual/core/csfle/fundamentals/manage-keys/).

Local master keys are development/test only. Production must fail closed when KMS configuration or key access is unavailable. Until production KMS is configured and verified, report deployment as blocked on that dependency; do not claim encrypted production readiness.

## 5. Run the implemented commands

The implemented migration command installs validators, unique indexes and a migration ID/checksum. Use a separate migration identity, then restore the restricted runtime URI before starting:

```text
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Local integration tests start and stop their own loopback MongoDB replica set. Install MongoDB Community and put `mongod` on PATH (Windows default: `C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe`) or set `MONGOD_BINARY`. They never consume an existing MongoDB URI, drop databases, or modify an existing service. Test storage is retained under ignored `test-results/mongo-*`; it contains synthetic records and wrapped test keys. Missing mongod is a failure, not a silent skip. These tests do not prove Google, Atlas, network TLS, KMS or Linux-container behavior.

`pnpm test:auth` starts a separate development server on port 3101 with synthetic provider settings and no valid identity/session fixture. It tests actual NextAuth protocol routes and simulated network/429 retry states; it never performs successful Google login. Stop other Daylight development servers before running it or `test:shell`; Next allows only one development server for this working tree. Run browser suites sequentially because they share `test-results`.

Implemented verification commands:

```text
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm test:auth
pnpm encryption:runtime
pnpm exec playwright install
pnpm test:e2e
pnpm build
pnpm start
```

Scripts must return failure for unmet prerequisites or failed checks. Seed commands, when added, refuse production by default. Browser tests cover responsive layouts, authorization, forms, completion flows, and accessibility; Google staging verification remains an actual provider flow. Record real results rather than marking skipped tests passed.

## Enable your development account integration

1. In Google Cloud's Google Auth Platform, configure Branding/Audience for a testing app and add your test Google account. In Clients, create a **Web application** OAuth client. Use only `openid email profile`. Register `http://localhost:3000/api/auth/callback/google`, matching `APP_ORIGIN=http://localhost:3000`, and use that hostname in your browser. Copy the client ID/secret privately into `.env.local`. See [Google's web client setup](https://developers.google.com/identity/protocols/oauth2/web-server) and [NextAuth v4 Google](https://next-auth.js.org/providers/google). Do not add API scopes or offline access.
2. Use a dedicated Atlas development database and separate key-vault database, for example `daylight_dev` and `daylight_dev_keys.__keyVault`. Register only your current developer IP or approved private network; keep validated TLS and Atlas storage encryption. Put the SRV URI in `.env.local`. Provision paid resources only after a separate decision by the owner.
3. Run `pnpm config:keys`. It copies `.env.example` to ignored `.env.local` if absent and replaces only missing placeholder `AUTH_SECRET`, `IDENTITY_HMAC_KEY_BASE64` (32 random bytes), and local wrapping key (96 random bytes), without printing values. Existing real values are retained. Fill Google/Atlas settings privately. Keep keys across restarts; do not regenerate them or change HMAC version on existing accounts. Restrict the file to your OS account; POSIX mode 0600 is requested, while Windows ACL protection must be confirmed separately. After a build, `pnpm security:client-secrets` scans static artifacts for configured secret byte values and fails on a match; it is a bounded check, not a full security audit.
4. Run `pnpm config:check --integration`, then `pnpm db:migrate` using the migration URI. Restore the runtime URI. Set `APP_MODE=live`, run `pnpm dev`, and open `http://localhost:3000/signin`. Production builds reject local wrapping keys; use development for this local-key workflow.
5. Confirm actual Google consent, `/app/today`, refresh, sign-out and re-entry to the same internal account. Test a second account and logout-all. Record real outcomes privately; never screenshot emails, subject IDs, cookies, keys or callback codes. Cancelled consent/provider failure must return retry guidance. Local sign-in does not replace the required staging check.

Least privilege: the serving Atlas identity needs find/insert/update on users, domains and rate buckets; read of migration metadata and collection/index metadata; find/insert/remove on its key vault (startup probe cleanup and later deletion). It does not need `collMod`, index creation or database dropping. Use a separate migration identity for createCollection/collMod/createIndex plus migration metadata writes. Validate exact custom-role privileges in your Atlas environment; do not grant project admin or broad cross-database access. Restrict ingress Host to the configured origin, strip untrusted forwarding headers and add host IP/bot throttling. Signed-browser rate buckets default to 10/minute and a separate deployment safety ceiling to 300/minute, adjustable through `.env.example`; they do not replace ingress abuse controls.

## Verify AWS KMS and the intended container

Use an authorized private staging environment with its own Google client, Atlas database/vault and HTTPS origin. Set `ENCRYPTION_PROVIDER=aws`, matching `KMS_AWS_REGION` and key ARN. Give a scoped workload role `kms:Encrypt` and `kms:Decrypt` on that key; rewrap/rotation permissions require a separate operational decision. MongoDB refreshes credentials through the official AWS SDK provider chain (role/web identity/profile); no AWS credentials are persisted in MongoDB. Do not expose them through `NEXT_PUBLIC_`. Run migrations, then production build/start with the appropriate staging secret store. Missing/denied KMS access must prevent live startup and sign-in; never switch production to local keys as a fallback.

`Dockerfile.encryption` is a Node 24.13 Debian/glibc native-loading probe, not a deployable release image. With Docker installed, run `docker build -f Dockerfile.encryption -t daylight-encryption-probe .` and `docker run --rm daylight-encryption-probe`. No Docker was available in the current workspace; this gate remains unverified. Actual encrypt/decrypt/key-failure checks must also run in the final host image in staging.

For independent raw BSON inspection, use a **dedicated** configured database named `daylight_verify_<suffix>` with vault `daylight_verify_<suffix>_keys.__keyVault`, then run `pnpm encryption:verify`. It fails for all other namespaces, creates one synthetic record/key, reads with no autoEncryption client, requires encrypted BSON subtype 6, decrypts, and removes only those generated IDs. Run in AWS mode in staging to prove KMS; local mode is not AWS evidence. Do not run with real account databases. This CLI still requires complete environment validation, including Google settings, but does not contact Google.

Key vault backup and matching external wrapping key access must accompany application backups. Do not change the HMAC key/version without the planned dual-read lookup migration; changing it directly would create duplicate identities. Wrapping-key rewrap, retained-data recovery, deletion restore hygiene and final host packaging remain release gates in Phase 12. No public deployment is authorized by these commands.

## 6. Deploy and prove recovery

Use a containerized Node deployment as the portable baseline; [Next.js supports Node and Docker deployments](https://nextjs.org/docs/app/getting-started/deploying). Select the host after proving native encryption support, reliable egress, TLS, secret injection, health checks, and backup needs. Document the chosen service's actual plan and operating costs when selected; this pack does not promise a free production stack.

Deploy the same tested image to staging, run migrations with controlled credentials, verify readiness, and exercise OAuth, persistence, KMS failure, and mobile flows. Release production with the correct domain, callbacks, secrets, and network restrictions. Keep the previous image available; rollback requires schema compatibility, not merely an older image tag.

Document backup retention and test restoration of application data plus the matching key vault into an isolated environment. Preserve access to required KMS keys. Before restored data serves traffic, reapply account-deletion tombstones and session revocations; disable accounts pending deletion and resume their retryable deletion jobs. Verify owners can decrypt retained records and deleted accounts cannot return. Record restoration and key-recovery evidence, operational ownership, and remaining dependencies in `STATUS.md` before launch.
