# Daylight — interface and experience specification

Daylight is a working name and can be changed. Build a student life workspace that feels personal, calm, and carefully typeset. White and pale blue establish the atmosphere; hierarchy, spacing, and useful detail give it character. The interface must support real planning on a phone as comfortably as on a laptop.

This document defines the visual target and interaction requirements. Use the product rules and data contracts elsewhere in this kit as the source of truth. Follow the exactly 12 development phases in `PHASES.md`; visual polish does not excuse incomplete behavior.

## 1. Visual direction

Use a quiet paper background, dark blue ink, fine dividers, and generous whitespace. Give each screen one dominant working area. Reserve compact cards for genuinely separate information; avoid turning every heading, label, and paragraph into another rounded rectangle. Avoid giant gradient headlines, decorative blobs, random emoji navigation, enormous empty hero sections, and invented productivity scores.

The signature composition is a compact week strip above a useful daily timeline, with a slim progress summary nearby. A faint blue calendar guide and typographic time labels create identity without decoration. Analytics should feel like a polished personal journal with clear evidence.

### Color and surface tokens

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F7FAFC` | Page background |
| `surface` | `#FFFFFF` | Working panels, menus, forms |
| `surface-blue` | `#EAF4FB` | Selected rows, gentle section background |
| `ink` | `#182C3B` | Headings and primary copy |
| `ink-muted` | `#536875` | Secondary copy on white/light surfaces |
| `accent` | `#216B99` | Primary buttons, links, selected controls |
| `accent-hover` | `#18577E` | Hover/pressed primary action |
| `border` | `#D7E3EB` | Decorative separators |
| `control-border` | `#6D8190` | Necessary input/control outlines |
| `success` | `#236C4D` | Completed state plus icon/text |
| `warning` | `#865514` | Attention state plus icon/text |
| `danger` | `#AF3442` | Error state plus message |

Use white labels on accent buttons. Keep muted copy legible; never use pale blue for small text. Verify actual combinations, including chart labels and disabled-adjacent content, against WCAG AA. Decorative borders may be faint; boundaries required to identify controls must remain distinguishable. Use text, shape, and icons alongside color.

Use a 4px spacing base: 4, 8, 12, 16, 24, 32, 48, and 64px. Inputs and touch actions are at least 44px tall. Corners: 8px for compact controls, 12px for cards, 20px for dialogs. Shadows should be restrained: `0 8px 24px rgb(24 44 59 / 7%)`. Use a 2px accent focus ring with a 3px offset.

Glass belongs only on the sticky top bar, mobile navigation, or an occasional floating toolbar: white at about 90% opacity with modest blur. Reading panels, dropdowns, and charts use opaque surfaces. Provide a solid fallback when transparency is unsupported or reduced.

### Typography and iconography

Use self-hosted Manrope for interface text and a restrained serif such as Newsreader for occasional page titles. Verify font licensing and bundle font files; avoid requests to third-party font services. Supply system fallbacks. The serif should introduce warmth, not dominate tables or controls.

Body: 16px/1.55; labels: 14px/1.4; supporting text: at least 13px/1.45; desktop page title: 32px/1.15; mobile title: 26px/1.2. Use tabular numerals for time, XP, streaks, and chart values. Keep line lengths near 60–75 characters. Use one consistent outline icon family, normally 18–20px, with a visible label or accessible name.

## 2. Application shell and responsive layout

Desktop at 1200px and above uses a 224px sidebar, a central content area, and an optional 280px context column. Keep content within roughly 1440px. The sidebar exposes Today, Study, Planner, Analytics, Friends, and Settings; a styled domain selector filters the workspace. The selected domain and date must stay visible. A persistent Add task action should be easy to find without covering content.

At 768–1199px, collapse the context column into the main flow and use a compact sidebar or accessible navigation drawer. Below 768px, use a single column and bottom navigation: Today, Planner, Study, Insights, and More. More contains Domains, Friends, Profile, and Settings. Preserve the current view and filters when switching destinations.

```text
DESKTOP
[Daylight]   Today / Tue 13            [Add task] [Avatar]
[Today   ]  [Mon] [Tue] [Wed] [Thu] [Fri] [Sat] [Sun]
[Study   ]  Today's plan                    Your week
[Planner ]  09:00  Calculus practice         XP / streak
[Insights]  11:30  Strength session          Next deadline
[Friends ]  16:00  Read operating systems   Small chart

MOBILE
[Daylight]                         [Avatar]
Today                         [Add task +]
[M 12] [T 13] [W 14] [T 15] [F 16] …
[2-day study streak] [80 XP this week]
09:00  Calculus practice          [Complete]
11:30  Strength session           [Complete]
[Today] [Planner] [Study] [Insights] [More]
```

On mobile, replace the week time grid with a date strip and an agenda for the selected date. Offer Day/Agenda views and a deliberate desktop Week view. Never squeeze seven tiny time columns into a phone. Respect safe-area insets, keep the bottom navigation clear of the keyboard, and prevent horizontal page overflow at 320px.

## 3. Screens and their primary actions

**Welcome and onboarding.** A short introduction leads to the official Continue with Google flow. Follow current Google button branding requirements. After authentication, collect a unique username, display name, timezone, domain choices, and optional avatar. Explain why timezone affects the calendar and streak. Provide useful defaults and a route to edit choices later. Never fabricate connected or successful login states.

**Today.** Prioritize tasks in chronological order, including a separate unscheduled section. Display time, domain, task title, status, and optional college-topic source. Allow domain filters, rescheduling, and completion. An overdue task remains understandable without turning the whole page red. Clicking a task opens its details without losing the selected date.

**Study.** Use two clearly named tabs: College study and Self study. College study contains subjects, expandable units, and nested topics. Show meaningful topic counts and progress based on actual states. On desktop, a subject list can sit beside the selected tree; mobile uses subject → unit → topic navigation with breadcrumbs/back actions. Add subject, Add unit, and Add topic actions belong near the item they affect. “Schedule in self study” opens a populated scheduling form and preserves the source-topic reference. Choosing a source topic alone must not silently mark it complete.

**Self study and Planner.** Show day/date, local start and end time, task details, recurrence where supported, and optional college-topic link. Task creation and recurrence edits must distinguish one occurrence from a series. Provide visible overlap feedback while allowing the documented product behavior. Dragging is an enhancement; every move must also work through a date/time form using keyboard and touch.

**Other domains.** Fitness, Relationships, Finance, and custom domains share a consistent task and schedule model. Give each a subtle icon and label. Domain management supports creation, naming, and the documented archive behavior. Do not imply features such as bank synchronization, investment advice, social messaging, or automatic health tracking that are outside the build contract. Keep sensitive notes out of shared social views.

**Analytics.** Lead with selectable date range and domain filters, then show completed tasks, earned XP, current/longest self-study streak, and completion rate with an explicit denominator. Use a daily completion bar chart, self-study activity calendar, and domain breakdown. Separate planned duration from explicitly logged actual duration; do not label scheduled time as time studied. Daily tooltips expose date, value, and unit. Streak visuals indicate qualifying self-study days and provide a concise rule explanation.

Charts must reflect real records and the user's timezone. Use honest axes, stable colors, readable ticks, and a date-range summary. Show zero and missing data distinctly. Provide a table/text alternative and keyboard-accessible data inspection. New accounts receive a helpful empty state, not fake impressive statistics. Seeded demo data, if supported, is visibly marked and isolated from real accounts.

**Friends and leaderboard.** Search exact usernames with useful validation, show request status, and make accepting or declining clear. Show only allowed shared identity, avatar, XP, and streak. Separate XP and streak ranking tabs or an explicit sort selector; label ranking period and tie behavior according to the contract. Avoid implying that XP measures academic ability. Handle no friends, pending requests, private profiles, and failed requests gracefully.

**Avatar and settings.** Provide a local SVG avatar builder using an allowlist of components, colors, and accessories. Include preview, randomize, reset, and save. All choices need keyboard-operable controls and meaningful names; selection must not depend on color alone. Never accept arbitrary executable SVG markup. Support a polished initials fallback. Settings display the canonical timezone as read-only after onboarding in v1, with account controls, privacy/sharing, animation preferences, and available export/deletion actions.

## 4. Component behavior, reward feedback, and states

Dropdowns, popovers, switches, tabs, dialogs, and date/time controls must be deliberately styled while retaining proven accessible behavior. Prefer accessible primitives over rebuilding keyboard interaction. Menus need Escape dismissal, correct focus management, and clear selected state. Switches need persistent text labels; date/time entry must support direct typing. Use confirmation dialogs only where consequences warrant them.

Each valid explicit task occurrence awards **20 XP**, regardless of domain. Direct college-leaf completion also awards 20 XP through its stable identity; parent subjects, units, and aggregate checkboxes award nothing. Explicitly marking a linked leaf learned during session completion must not generate a second reward. Show “Congrats — task completed” with the confirmed reward after the server accepts completion. Never celebrate a failed request or award twice through repeated clicks. Completing a valid self-study task for today can advance the streak under the documented rules; other tasks may award XP while leaving the streak unchanged. Present that distinction calmly: “+20 XP” and, when applicable, “Today's study streak secured.”

Use an inline completion state plus a brief accessible toast. Optional bigger celebrations belong to genuine streak milestones and must be dismissible. Avoid blocking every completion with a modal. Reduced-motion mode removes movement and confetti while preserving the success message. Any undo behavior must match server-side reward and streak rules.

Animate short transitions at 140–220ms with gentle easing. Avoid continuous bouncing, autoplay motion, and large parallax. Preserve layout during loading using skeletons that match final structure. Disable only the submitting action and show its progress. Retain form values on validation or network failure, describe the problem near the field, and offer a retry. Show a clear failed-save state rather than silently pretending data synchronized.

Empty states identify the next action: “Add your first subject,” “Plan one study session,” or “Find a friend by username.” Destructive actions explain the affected records. Session expiry must preserve recoverable local form input where safe and guide reauthentication.

## 5. Acceptance and visual review

Review real screens at 320, 360, 390, 768, 1280, and 1440px, including portrait and landscape mobile; spot-check intermediate breakpoints such as 1024px. Check long subject names, nested topics, dense days, empty accounts, large numbers, timezone boundaries, failed requests, and an open keyboard. Navigation, scheduling, college-topic import, completion, analytics, friends, and avatar editing must work at every supported size.

Verify keyboard-only use, visible focus, screen-reader labels, dialog focus return, chart alternatives, reduced motion, 200% text zoom, and reflow without clipping. Check contrast using computed colors, not appearance alone. Use semantic headings, landmark navigation, correctly associated form errors, and polite live announcements for completion feedback.

Capture and inspect desktop and phone screenshots of the implemented screens. Repair inconsistent spacing, unreadable chart labels, awkward wrapping, overlap, offscreen menus, and touch targets before claiming polish. Deliver a cohesive usable application whose visual appeal survives real data.
