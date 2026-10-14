# Repository instructions — Daylight

## Authority and context

Build the student life app described in `docs/`. Follow the user's latest instructions. `docs/PHASES.md` contains exactly 12 phases; use `docs/STATUS.md` to resume. Product defaults are editable by the user, not hidden assumptions.

`docs/GAMIFICATION.md` is the canonical contract for XP, streaks, scheduling eligibility, and metric formulas. `docs/SECURITY.md` controls data handling. If another project document conflicts, reconcile it explicitly before coding the affected rule. Do not silently weaken privacy or change award rules.

## Implementation

- Inspect existing files and dependencies before changing them. Preserve unrelated work.
- Use TypeScript strict mode, small cohesive modules, schema validation, accessible components, and compatible stable dependencies. Record selected versions; commit the lockfile.
- Keep MongoDB, authentication secrets, encryption, and authoritative calculations in server-only modules on a compatible Node runtime.
- Authenticate and authorize at the service/repository boundary for every entry point. Scope records to the authenticated owner. Do not rely on a hidden button or route guard alone.
- Encrypt private payloads before database writes; do not leak them to logs, URLs, public caches, error reporters, or browser persistence.
- Route all completions through the same transactional domain service. Use unique indexes and idempotency. Never compute authoritative XP/streaks in React.
- Implement responsive and accessible states as each feature is built. Check phone layouts throughout development.
- No unlabelled mock data, silent auth bypass, fake integrations, empty core buttons, or whole-app rewrites to solve local problems.

## Work and verification

Complete the active phase with its exit checks. Delegate bounded independent reviews when useful. Keep test scope relevant; critical domain and security behavior requires meaningful coverage.

Before finishing a phase: run the relevant type, lint, build, test, and browser checks; fix actual regressions; update `docs/STATUS.md` with evidence and blockers. Never mark unavailable integration checks passed. Once the phase's checks pass, move to its handoff without repeatedly running unrelated suites.

Keep commands in `package.json` and synchronize `docs/SETUP-AND-DEPLOY.md` with the implementation. Use `.env.example` for placeholders only. Never put real secrets in source, screenshots, terminal output, or chat.

## Communication

Explain changes and blockers plainly. Use short progress updates. Proceed with reversible work that is already authorized. When credentials or a paid external resource block a check, finish independent work and state the exact remaining setup. A demo is not a verified live integration.
