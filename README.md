# Daylight

A mobile-first student life application, built incrementally from the contracts in `docs/`.

The current build provides a runnable public foundation, configuration validation, timezone utilities, and automated checks. Google login, private persistence, and the student workspace are not implemented yet. No account, demo identity, or browser database is created.

## Run locally

Use Node 24 (24.13.0 or newer within the 24.x line) and pnpm 12.11.2:

```powershell
npx --yes pnpm@12.11.2 install --frozen-lockfile
npx --yes pnpm@12.11.2 dev
```

Open <http://127.0.0.1:3000>. No `.env.local` is needed for the foundation. If pnpm is already on PATH, use the shorter `pnpm` commands.

```powershell
pnpm config:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests start the production server and require a successful build first; stop any server on port 3000 before running them. Configuration prerequisites for future integrations can be checked with `pnpm config:check --integration`; missing values deliberately return a nonzero exit code. This does not verify provider connectivity.

Read [current evidence](docs/STATUS.md), [implementation map](docs/IMPLEMENTATION-MAP.md), and [setup instructions](docs/SETUP-AND-DEPLOY.md). The next planned work, upon authorization, is the responsive visual system and application shell. Public deployment has not been authorized.
