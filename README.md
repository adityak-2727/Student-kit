# Daylight

A mobile-first student life application, built incrementally from the contracts in `docs/`.

The current build provides a public welcome page and a responsive visual system with a development-only student workspace preview. It includes local typography, accessible controls, agenda composition and temporary draft editing. Google login, private persistence and rewards are not implemented. No authenticated identity or browser database is created.

## Run locally

Use Node 24 (24.13.0 or newer within the 24.x line) and pnpm 12.11.2:

```powershell
npx --yes pnpm@12.11.2 install --frozen-lockfile
npx --yes pnpm@12.11.2 dev
```

Open <http://127.0.0.1:3000>. No `.env.local` is needed for the foundation. If pnpm is already on PATH, use the shorter `pnpm` commands.

With `dev` running, open <http://127.0.0.1:3000/dev/shell> to inspect the synthetic shell. Navigation, domain/date filters, state examples and temporary editing work in memory and reset on refresh. The route returns 404 in production; it is not a login bypass. Real protected `/app/*` routes remain unavailable until authentication is built.

```powershell
pnpm config:check
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm test:shell
```

Browser tests start the production server and require a successful build first; stop any server on port 3000 before running them. Configuration prerequisites for future integrations can be checked with `pnpm config:check --integration`; missing values deliberately return a nonzero exit code. This does not verify provider connectivity.

`test:shell` starts its own development server on port 3100. It covers the labelled preview, keyboard/focus behavior, responsive reflow, axe accessibility checks, text resizing and keyboard-space layout emulation. It does not verify native phone keyboard behavior or a real account.

Read [current evidence](docs/STATUS.md), [implementation map](docs/IMPLEMENTATION-MAP.md), and [setup instructions](docs/SETUP-AND-DEPLOY.md). The next planned work, upon authorization, is real Google authentication and encrypted database persistence. Public deployment has not been authorized.
