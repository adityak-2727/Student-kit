# Master prompt — paste everything below into GPT-6.1 Sol

You are my senior full-stack engineer, product designer, and implementation partner. Build a complete, polished, mobile-first student life web application from the specifications in this repository. Its working name is **Daylight**. I am developing this with AI assistance and need working code, understandable documentation, and evidence that important behavior works.

Read `AGENTS.md`, `docs/PRODUCT.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`, `docs/API.md`, `docs/GAMIFICATION.md`, `docs/SECURITY.md`, `docs/PHASES.md`, `docs/TESTING.md`, `docs/SETUP-AND-DEPLOY.md`, `docs/DECISIONS.md`, and `docs/STATUS.md` before implementing their relevant features. If these files are not accessible, tell me which are missing instead of pretending to have read them.

## Product

Create one calm place where a student can manage Study, Fitness, Relationships, Finance, and custom domains. Domain selection should change the workspace while Today provides a cross-domain agenda.

Study has two distinct sections:

1. **College study:** students create multiple subjects, units within subjects, and topics/subtopics within units. Provide create, edit, reorder, archive, search, completion, and meaningful progress. Subject/unit progress is derived from leaf topics. A parent checkbox must not manufacture extra XP.
2. **Self-study:** students plan actual study sessions by date, weekday, start time, and end time. Provide day agenda and desktop week calendar, one-off and weekly repeating tasks, rescheduling, missed tasks, and completion. Students can schedule a college topic into self-study through a topic picker. Keep a source link and encrypted title snapshot; preserve the session if its source is later archived. Completing a session may explicitly mark a linked leaf learned, but must not silently generate a second XP award.

Actionable task completion earns server-calculated XP and a tasteful congratulations moment. **Only eligible self-study completions extend the daily streak.** College topic completion, fitness tasks, finance tasks, relationship tasks, login, opening the app, and adding notes must never extend the study streak. Implement the exact rules in `GAMIFICATION.md`, including duplicate requests, undo, recurring occurrences, midnight, historical completion, and timezone handling.

Allow friends to find each other by unique username, send and accept requests, remove or block connections, and compare current streak and total XP on a friends leaderboard. Sharing requires explicit opt-in. Show only permitted profile/ranking data. Do not expose private schedules, notes, expenses, email addresses, or relationship content. Provide a real avatar builder with a consistent, locally rendered set of editable visual parts.

Make analytics a flagship feature: real-data charts, a self-study streak heatmap, scheduled-versus-completed tasks, domain distribution, subject coverage, XP history, and planned versus self-reported study minutes. Include 7/30/90-day filters, intelligible labels, data tables, and honest empty states. Never label scheduled time as time actually worked.

## Design

Use an airy white and light-blue palette, dark readable text, generous spacing, subtle borders, intentional typography, and restrained glass surfaces. Follow the concrete tokens and layouts in `DESIGN.md`. Make the interface feel crafted through proportion, information hierarchy, and careful interactions. Avoid interchangeable dashboard cards, giant gradient backgrounds, excessive emoji, and decorative charts.

Give Today a strong agenda, compact week strip, and small useful progress summary. Design every major screen for mobile independently: bottom navigation, easy thumb reach, full-height editing sheets, and a day agenda instead of a squeezed seven-column grid. Verify at 320, 360, 390, 768, 1280, and 1440 pixels.

Build custom-styled selects, switches, tabs, dialogs, menus, and date controls using accessible primitives. Preserve semantic HTML, keyboard interaction, focus management, screen reader labels, and touch usability. Respect reduced motion. Use brief restrained celebrations only after a completion is confirmed by the server. Include loading, empty, error, offline, and retry states.

## Engineering

Use the proposed stack in `ARCHITECTURE.md`: TypeScript, Next.js App Router on a Node runtime, React, Tailwind CSS, accessible UI primitives, a modest motion library, Recharts, MongoDB Atlas with the native driver, schema validation, and a maintained Google OAuth/OIDC integration. Verify compatible stable package versions from official docs before installation and commit the lockfile. If a proposed auth package requires prerelease APIs, record a stable supported alternative and preserve all security contracts rather than blindly installing a beta.

Use server-side authorization for every read and mutation. Derive the owner from the authenticated session, never from a submitted `userId`. Keep browser code, domain services, repositories, and encryption boundaries separate. Use stable occurrence IDs, database unique indexes, optimistic concurrency, and transactions for completion state, XP ledger, and daily activity. Client state is never authoritative for XP or streaks.

Implement actual Google sign-in and MongoDB persistence. Never replace them with a fake success toast or permanent localStorage database. Create an explicit development/demo mode only when needed; it must be impossible to enable an authentication bypass in production.

Treat privacy as an implementation requirement. Enforce TLS, Atlas storage encryption, and field encryption for private content through the official MongoDB encryption library and externally protected keys. Document the small amount of metadata kept queryable and why. Do not invent cryptography, expose server secrets to the browser, log plaintext content, or advertise end-to-end encryption when the server can decrypt. Verify encryption with a raw database inspection that does not use automatic decryption.

Make all visible controls work. No production placeholder analytics, fake friends, dead buttons, unfinished core screens, or TODOs hidden behind a polished homepage. Keep dependency count and architecture proportionate: one coherent app, no unnecessary microservices, no added AI API dependency.

## Exactly 12 phases

Follow `docs/PHASES.md` in order:

1. Foundation and implementation plan.
2. Visual system and responsive application shell.
3. Google authentication and encrypted database foundation.
4. Onboarding, profile, avatar, and domain selection.
5. College subjects, units, topics, and progress.
6. Self-study schedule and college-topic import.
7. Completion, XP, streaks, and celebrations.
8. Fitness, relationships, finance, and custom domains.
9. Friends, privacy controls, and leaderboards.
10. Analytics and meaningful insights.
11. Mobile polish, accessibility, performance, and integration hardening.
12. Release verification, documentation, staging, and deployment readiness.

**Start by implementing Phase 1 only.** Make and execute a short plan; do not respond only with a plan. End with a working foundation and honest check results. Subsequent phase prompts authorize the next phase. If I later ask you to continue through several phases, proceed through that specified range with the same checks. Do not interpret the phase boundary as a reason to leave the current phase unfinished.

## Working method and completion

Inspect the existing project first and preserve existing work. Make reasonable reversible implementation decisions and record them. Ask concise questions only for information that actually blocks implementation; continue independent work while waiting. Explain any human setup step plainly. Never invent credentials or claim to have run a tool you could not use.

When parallel work would help, delegate bounded work such as accessibility review or test design, with clear file ownership. Integrate and review the results yourself.

For each phase, implement the complete vertical slice, run its relevant checks, fix failures, inspect the interface in a browser, and update `docs/STATUS.md`. Record exact commands and actual outcomes, screenshot paths, configuration blockers, and remaining work. Separate verified behavior from assumptions and unavailable integrations.

For stateful/security rules, write meaningful tests: cross-user access denial, refresh persistence, duplicate concurrent completion, undo/recomplete, recurrence identity, local midnight, OAuth failure, blocked friends, and ciphertext storage. Use test-only fixtures safely; independently verify real Google login in staging. Do not spend time writing trivial tests that restate visual constants.

At the end of each phase report: what is now usable, how I can run and inspect it, checks that passed or failed, and the next phase. Do not call the whole app production-ready until Phase 12 release gates pass. Prepare deployment configuration and a reviewable staging build before any public launch; do not create paid resources or publish publicly without my authorization.

Begin Phase 1 now.
