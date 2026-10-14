# Setup and deployment runbook

The public application foundation is implemented. Authentication, encrypted database persistence, migrations, containers and deployment remain future work. Sections below distinguish commands that run now from the later infrastructure setup. Follow the twelve phases in `PHASES.md`; see `STATUS.md` for actual evidence.

## Run the current build

Use Node 24.x (tested 24.13.0) and pnpm 12.11.2. The exact installed versions and deferred compatibility choices are recorded in `DECISIONS.md`. If pnpm is not on PATH, prefix any command below with `npx --yes pnpm@12.11.2` instead of `pnpm`.

```powershell
npx --yes pnpm@12.11.2 install --frozen-lockfile
npx --yes pnpm@12.11.2 dev
```

Open `http://127.0.0.1:3000`. No external credentials or `.env.local` are required for this public development preview. It cannot sign in, save records, award XP, or create accounts. Copy `.env.example` to untracked `.env.local` only if preparing integration settings; leave `APP_MODE=foundation` and `ENABLE_TEST_AUTH=false`. Next.js sets `NODE_ENV`; do not set it in the copied file.

These check commands are implemented:

```powershell
pnpm config:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm audit
pnpm audit:production
pnpm start
```

`test:e2e` requires `build` first and starts its own local production server; stop any server using port 3000 first. It refuses to reuse an unknown or development server as production evidence. Screenshots go to `docs/evidence/`. `start` opens the same built app at port 3000; stop an existing local server before starting another. `dev`/`start` bind to loopback for local use; a future container will need an explicit host binding.

The dev/build/start scripts run configuration validation before launching Next; build/start load production env-file precedence. Next instrumentation also checks server runtime settings. Audit commands query the package advisory service and do not suppress reported vulnerabilities; see `STATUS.md` for known development-tooling findings.

`pnpm config:check --integration` checks future prerequisite syntax and returns failure for missing or placeholder values. It never connects to Google, MongoDB, or KMS. Diagnostics print setting names and controlled messages, not submitted values. Runtime startup rejects unsupported modes, unsafe origins, and test-auth bypasses. The foundation production build intentionally requires no future secrets; once live services exist, production startup must enforce the complete integration/KMS checks too.

`GET /api/v1/health` returns `{ "data": { "status": "ok" } }` with `Cache-Control: no-store`. It proves process liveness only. There are no migration, seed, readiness, or integration-test commands yet; they will be added with real implementations rather than placeholder success.

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

The following database commands are a future contract, **not runnable yet**:

```text
pnpm install --frozen-lockfile
pnpm db:migrate
pnpm dev
```

Future database/provider verification requires a selected non-production environment. Current lint/type/unit/build/browser scripts already run; `db:migrate` and `test:integration` do not exist yet:

```text
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm exec playwright install
pnpm test:e2e
pnpm build
pnpm start
```

Scripts must return failure for unmet prerequisites or failed checks. Seed commands, when added, refuse production by default. Browser tests cover responsive layouts, authorization, forms, completion flows, and accessibility; Google staging verification remains an actual provider flow. Record real results rather than marking skipped tests passed.

## 6. Deploy and prove recovery

Use a containerized Node deployment as the portable baseline; [Next.js supports Node and Docker deployments](https://nextjs.org/docs/app/getting-started/deploying). Select the host after proving native encryption support, reliable egress, TLS, secret injection, health checks, and backup needs. Document the chosen service's actual plan and operating costs when selected; this pack does not promise a free production stack.

Deploy the same tested image to staging, run migrations with controlled credentials, verify readiness, and exercise OAuth, persistence, KMS failure, and mobile flows. Release production with the correct domain, callbacks, secrets, and network restrictions. Keep the previous image available; rollback requires schema compatibility, not merely an older image tag.

Document backup retention and test restoration of application data plus the matching key vault into an isolated environment. Preserve access to required KMS keys. Before restored data serves traffic, reapply account-deletion tombstones and session revocations; disable accounts pending deletion and resume their retryable deletion jobs. Verify owners can decrypt retained records and deleted accounts cannot return. Record restoration and key-recovery evidence, operational ownership, and remaining dependencies in `STATUS.md` before launch.
