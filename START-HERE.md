# Daylight — student life application build kit

This repository contains the original specification pack and a runnable application foundation. See `README.md` to run it and `docs/STATUS.md` for verified progress. Google authentication, encrypted persistence and the student workspace are not implemented yet. Daylight is a working name; change it before branding or launch if you prefer.

## How to use it

1. Extract this folder into a new project repository. Keep `AGENTS.md` at the repository root, with `docs/`, `MASTER-PROMPT.md`, and `.env.example` beside it. Review any existing repository instructions before merging files into an existing project.
2. Select **GPT-6.1 Sol** in your coding agent. Start with the reasoning setting offered by your client; use a higher supported setting when architecture or debugging needs it. Selecting a name in a prompt does not switch the actual model. See [official model documentation](https://developers.openai.com/api/docs/models/gpt-6.1-sol).
3. For a new build, paste the full contents of `MASTER-PROMPT.md` to begin Phase 1. This checkout has completed that foundation; resume from `docs/STATUS.md` and authorize the next prompt instead of restarting. Use a coding environment with filesystem, terminal, and browser access.
4. Continue with the phase prompts in `docs/PHASES.md`, in order. There are exactly **12 development phases**. Complete each phase's checks before proceeding. A phase may take several sessions; it is not a single-response deadline.
5. Provide your own Google OAuth, MongoDB Atlas, and encryption key service configuration when Phase 3 needs them. Enter secrets through local environment files or the host secret manager, never into a public repository or the conversation.
6. Keep `docs/STATUS.md` current. A new chat can resume by reading it, the master prompt, and the current phase. Avoid repeatedly asking the agent to rewrite the entire app.

The prompt separates product goals, constraints, context, and completion checks, consistent with [OpenAI's coding workflow guidance](https://learn.chatgpt.com/docs/learn/best-practices). The product rules and architecture in this kit are proposed decisions for your app, not requirements imposed by OpenAI.

## Files

| File | Purpose |
| --- | --- |
| `MASTER-PROMPT.md` | Paste this to start the project |
| `AGENTS.md` | Persistent coding rules |
| `docs/PRODUCT.md` | Features, journeys, scope, and acceptance criteria |
| `docs/DESIGN.md` | Visual identity, mobile layouts, interactions, and accessibility |
| `docs/ARCHITECTURE.md` | Stack, boundaries, repository structure, deployment approach |
| `docs/DATA-MODEL.md` | MongoDB collections, indexes, ownership, retention |
| `docs/API.md` | Server contracts and validation |
| `docs/GAMIFICATION.md` | Authoritative XP, streak, calendar, and analytics rules |
| `docs/SECURITY.md` | Authentication, encryption, private content, and threat boundaries |
| `docs/PHASES.md` | Exactly 12 phases with implementation prompts and exit checks |
| `docs/TESTING.md` | Functional, security, mobile, and release verification |
| `docs/SETUP-AND-DEPLOY.md` | Accounts, local environment, staging, and launch runbook |
| `docs/STATUS.md` | Honest progress and handoff template |
| `docs/DECISIONS.md` | Suggested defaults and future decision log |
| `docs/SOURCES.md` | Official references checked while preparing this pack |
| `.env.example` | Configuration placeholders, never real secrets |

## Product defaults you can change

- Each completed actionable task earns 20 XP. Only a self-study task scheduled for today and completed at or after its start time qualifies today's streak.
- One qualifying self-study task is enough. Missing an entire day breaks the streak. There are no streak freezes in version 1.
- The account timezone is selected during onboarding and remains fixed in version 1 so historical day boundaries stay predictable.
- Friends see only the profile and ranking information explicitly shared with them. Private study, finance, fitness, and relationship content remains private.
- Other domains have useful tasks, goals, and notes; finance adds manual expenses and budgets. There is no bank connection, public feed, chat, or AI assistant in version 1.
- The app is responsive web software for students. Google login does not prove student enrollment. Institutional verification is a separate future feature.

All database storage must be encrypted at rest, with TLS in transit and additional field encryption for private content. The proposed server can decrypt authorized content to serve the application; this is **not end-to-end encryption**. Operational metadata and intentionally shared profile/ranking fields are documented exceptions to field encryption, not exceptions to storage encryption.

## Practical build rhythm

After each phase, open the app yourself, try its main flow on your phone, and use the documented checks. Ask for specific corrections such as “On a 390px screen the date selector overlaps the task title; fix the layout and show the result.” Keep screenshots and test evidence in the project. Do not accept a polished screenshot as evidence that Google login, database persistence, or encryption works.

If credentials are missing, the agent may use an explicitly labelled demo with synthetic data. It must keep integration checks marked blocked until real staging verification passes. Do not publish a demo as a completed product.
