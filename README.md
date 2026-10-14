# Daylight

A mobile-first student life application, built incrementally from the contracts in `docs/`.

The current build adds Google sign-in, encrypted MongoDB account storage, owner checks and session revocation to the responsive visual shell. Real Google/Atlas/AWS KMS verification needs private setup; local replica-set encryption tests pass. Public preview mode runs without credentials. Study planning, onboarding and rewards are still upcoming.

## Run locally

Use Node 24 (24.13.0 or newer within the 24.x line) and pnpm 12.11.2:

```powershell
npx --yes pnpm@12.11.2 install --frozen-lockfile
npx --yes pnpm@12.11.2 dev
```

Open <http://127.0.0.1:3000>. No `.env.local` is needed for the foundation. If pnpm is already on PATH, use the shorter `pnpm` commands.

With `dev` running, open <http://127.0.0.1:3000/dev/shell> to inspect the labelled synthetic shell. It resets on refresh and returns 404 in production. `/signin` explains setup; `/app/today` requires a valid Google session. Enable actual account access using the private configuration instructions below, never a demo identity.

```powershell
pnpm config:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:shell
pnpm test:integration
pnpm test:auth
```

Browser tests start the production server and require a successful build first; stop any server on port 3000 before running them. Configuration prerequisites for future integrations can be checked with `pnpm config:check --integration`; missing values deliberately return a nonzero exit code. This does not verify provider connectivity.

`test:shell` starts its own development server on port 3100. It covers the labelled preview, keyboard/focus behavior, responsive reflow, axe accessibility checks, text resizing and keyboard-space layout emulation. It does not verify native phone keyboard behavior or a real account.

Read [current evidence](docs/STATUS.md), [implementation map](docs/IMPLEMENTATION-MAP.md), and [exact Google/Atlas/KMS setup instructions](docs/SETUP-AND-DEPLOY.md). Finish live authentication/encryption gates before moving to onboarding. No public deployment has been made.
