# Daylight — Product specification

Daylight is a working name for a responsive student life application combining academic plans and personal commitments in a manageable daily schedule.

These suggested defaults resolve open decisions in the original brief. Treat them as the initial implementation contract and record subsequent changes.

## 1. Product promise and scope

Students can organize several areas of life, maintain a structured college syllabus, plan independent study, complete actionable tasks for XP, maintain a self-study streak, and compare progress with accepted friends. Their own records remain private; friendship exposes only the fields explicitly listed below.

The first release includes Google sign-in; username and avatar onboarding; Study, Fitness, Relationships, Finance, and custom domains; a daily and weekly planner; college syllabus management; self-study sessions; completion rewards; historical analytics; friend requests; and friend leaderboards. All routes must work on mobile. Google authentication and MongoDB-backed persistence must be real integrations when configured, with explicit setup instructions and useful missing-configuration states.

Other domains must be useful without growing into separate products. Each provides goals, actionable tasks, and private notes. Fitness adds simple habit measurements. Relationships adds private reminders and connection goals. Finance adds manual expense entry and a monthly budget in one user-selected currency, with no bank connection or currency conversion. An expense, note, or measurement is a record, not automatically an XP event. Users can create a separate actionable task associated with any domain.

Out of scope for this release: messaging, public social feeds, payments, banking, wearable integrations, runtime AI coaching, push delivery, collaborative editing, school administration, and streak freezes. Do not display controls for unfinished features as if they work.

## 2. Navigation and primary routes

| Route | Purpose |
| --- | --- |
| `/` | Short product introduction and Google sign-in |
| `/onboarding` | Choose username, avatar, canonical timezone, domains, and optional study goals |
| `/app/today` | Today's schedule, quick capture, active tasks, progress, and next action |
| `/app/planner` | Day/week views, task scheduling, recurring series, and unscheduled inbox |
| `/app/study/college` | Subjects and hierarchical syllabus management |
| `/app/study/college/[subjectId]` | Units, topics, subtopics, progress, and scheduling actions |
| `/app/study/self` | Independent study schedule and associated college topics |
| `/app/domains/[domainId]` | Domain goals, tasks, notes, and relevant lightweight tracker |
| `/app/analytics` | XP, activity, study time, syllabus progress, and streak history |
| `/app/friends` | Search by exact username, requests, friends, and leaderboard |
| `/app/profile` | Avatar, username, personal summary, and account settings |

Study contains clearly visible College and Self-study sections. Desktop uses a compact sidebar and generous content area. Mobile uses a bottom navigation with Today, Planner, Study, Insights, and More; Friends, Domains, and Profile are available from More. Preserve the same capabilities across devices.

## 3. Onboarding and identity

After successful Google authentication, collect a unique, case-insensitive username, chosen display alias, and avatar. Explain the limited profile fields available to accepted friends and provide separate “Find me by username” and “Share XP/streak with accepted friends” controls, both off by default. Each requires an explicit opt-in and remains editable in settings. Username format is 3–24 lowercase ASCII letters, numbers, or underscores, normalized before checking. Show availability feedback, but enforce uniqueness on the server when saving.

Detect a suggested timezone and require the student to confirm it. The confirmed IANA timezone is the canonical timezone for schedules, analytics days, and streaks; it is fixed for version one. Show this clearly before confirmation. Device travel must not silently alter it. Let the student select relevant domains and optionally add a first subject and first study session. Skipping optional steps produces helpful empty states, not invented activity or friends.

Provide an original configurable avatar using a curated set of accessible colors and facial/accessory options. Avatar editing must save, survive refresh, and appear consistently in the profile, friends list, and leaderboard. Photo upload is unnecessary for version one.

## 4. College study: syllabus to action

The college hierarchy is Subject → Unit → Topic → optional Subtopic. Students can create, rename, reorder, archive, and restore these entries. A topic without children is a leaf; when it has subtopics, its subtopics are the actionable leaves. Parent progress is calculated from descendant leaf completion, never manually invented.

A subject view shows completed leaves out of total active leaves, a progress bar, unit expansion controls, and a next-topic action. Directly completing an unlearned leaf can award XP once through its stable completion identity; repeating the checkbox cannot create new rewards. A leaf already marked learned through a study session must not receive another automatic direct-completion award. Completing a parent does not award XP for each descendant or create another reward. Archive operations preserve history and remove entries from active progress denominators. Syllabus entries support archive/restore only in v1; account deletion follows the separate privacy flow.

Every leaf has a “Schedule study” action. The student chooses a day, start time, duration, and optional recurrence, then reviews the resulting self-study session. That session references the college leaf and retains a title snapshot for history. Later renaming the leaf updates its current reference display without rewriting past descriptions. Removing or archiving a leaf must not destroy a scheduled session; show its retained label and unavailable-reference state.

Completing the scheduled session awards that occurrence's XP and can qualify for a streak. It does not automatically claim the syllabus leaf has been mastered. Offer an explicit optional “Mark linked topic learned” action that updates syllabus progress without a second XP award. If that session is the active learning source, direct unlearn is disabled; offer “Undo source session” with its XP/streak impact explained. A later revision session is separate work with its own occurrence and reward; simply toggling learned status cannot create extra awards.

## 5. Self-study and the whole schedule

Students can create a self-study session from scratch or attach one college leaf per session in v1. Required fields are title, local day, start time, and end time; suggested duration defaults to 45 minutes and is editable. Notes, related goal, recurrence, and the linked syllabus entry are optional. Self-study remains an explicit task category inside Study; simply putting a general task in the Study domain does not make it streak-qualifying. Keep each session within one local date; split overnight work into sessions. Use separate sessions for multiple linked leaves.

Support an unscheduled inbox plus date/time planning. Inbox study ideas are general Study tasks until they receive a complete schedule and are explicitly classified as self-study before completion. Daily and weekly views allow create, edit, reschedule, cancel, and complete actions. Recurrence supports selected weekdays and an end date, with bounded generation of occurrences. Editing a series asks whether the change affects this occurrence or pending future occurrences. Completed occurrences retain their history. Each generated occurrence has its own stable identity.

Overlapping tasks are allowed with a clear conflict indicator. The app must not silently move existing tasks. For local times made invalid or ambiguous by daylight saving, require an explicit valid time or offset choice rather than silently guessing. An explicit reschedule of a never-completed past task to today is allowed, recorded as a schedule revision, and can make that task eligible for today's streak before its first successful completion.

Completion of a scheduled task before its start is rejected by the server with a helpful explanation and no state writes. At the first successful completion, lock that occurrence's canonical local date, start-time snapshot, domain, task category, and reward identity. Schedule and domain edits are allowed only before that successful completion. Undo does not unlock these fields; an ever-completed occurrence permits private-content edits only. Create a new occurrence for a new revision session. Expose these constraints in the edit state. Unscheduled actionable tasks may complete for XP but never qualify for a self-study streak until scheduled before their first successful completion.

## 6. XP, congratulations, and streak contract

The default reward is **20 XP per actionable task occurrence**, regardless of domain or duration. There is no duration bonus, daily cap, or automatic XP for financial entries, notes, generic habit measurements, or opening the application. The server owns completion state and reward calculation. A college leaf's direct completion uses a separate stable identity and can earn its 20 XP only once at a time.

The first valid completion creates one reward. Retrying the request, using a second tab, or reopening the app must not duplicate it. Undoing completion reverses the reward. Re-completing restores that same reward rather than generating another reward, but evaluates streak eligibility anew against the current server time and locked schedule. It never restores a historical qualifying day. Show a restrained congratulations message and reward amount after confirmed success; reduced-motion users receive a static version. Failure must restore the previous UI state and explain the problem without displaying a false celebration.

A streak day qualifies only when the server accepts completion of at least one **self-study occurrence scheduled for that same canonical local day**, at or after its scheduled start. Use server time and the confirmed canonical timezone. Completing a task from a prior day can earn XP but cannot repair that day's streak. Completing a future task is disallowed. General domain tasks and direct college checkboxes never qualify the streak.

One qualifying occurrence is sufficient per day; further completions add their XP without incrementing the day count again. Current streak represents consecutive qualifying days ending today, or ending yesterday while today is still available. It resets when the next required day ends without qualification. Longest streak is calculated from valid qualifying history. If an undo removes the final qualifying completion for a day, recalculate current and longest streaks; either may decrease. Do not describe these self-reported records as perfect cheating prevention.

## 7. Friends and comparison

Search by exact username among students who enabled discovery, send a request, accept or decline an incoming request, cancel an outgoing request, remove a friend, and block a user. Prevent self-requests and duplicate relationships. Discovery-off and blocked profiles must not appear in search. Blocking ends friendship, cancels pending requests, and prevents new requests in both directions until unblocked. Unblocking does not restore friendship automatically.

The friends leaderboard includes the current student and accepted, unblocked friends who enabled metric sharing. The current student always sees their own metrics, even with sharing disabled. Disabling sharing immediately removes that student's ranking data from friends' views. Provide separate XP and current-streak tabs. Sort XP by total XP, then current streak; sort streak by current streak, then total XP. Resolve remaining ties by normalized username for a stable order and explain the tie rule in a tooltip. Show the user's own position even when the list is long.

Visible friend data is limited to username, chosen display alias, avatar, and, with metric-sharing consent, total XP, current streak, and longest streak. Never expose a friend's subjects, notes, schedule, expenses, measurements, email, timezone, or detailed activity history. No public global leaderboard in version one.

## 8. Analytics that explain real activity

Provide 7-day, 30-day, and 90-day ranges with timezone-aware boundaries. Cards show XP earned, completed tasks, qualifying self-study days, current streak, and longest streak. Charts include daily completions, net XP change, a self-study activity calendar, domain distribution, and syllabus progress by subject. Include accessible text/table alternatives, readable axes, useful tooltips, and clear empty states.

Show scheduled minutes, completed planned minutes, and optional self-reported study minutes separately. A completed 45-minute session contributes 45 completed planned minutes; this is an estimate, not measured focus time. At completion or later, students may enter an integer from 0 to 1,440 self-reported minutes per self-study session. Unreported is distinct from zero. Validate that the sum of active completed sessions' reported minutes for one canonical local completion day never exceeds 1,440; reject the conflicting change with an explanation. Edits to reported minutes do not alter XP or streaks. Do not imply these numbers were measured by a timer. Count completed tasks and reported minutes on the latest accepted completion date; undo removes their active contribution and re-completion applies current-date validation. Late completion can contribute XP and activity without adding a streak day. Reversed rewards must be reflected consistently in totals and charts.

## 9. Visual and interaction requirements

Use white, soft blue, deep readable ink, generous spacing, and restrained glass effects on small surfaces. Typography and composition should feel deliberate: a clear hierarchy, consistent spacing, thin dividers, and a restrained accent palette. Avoid excessive gradients, generic motivational filler, and decorative dashboards without useful information.

Build styled, accessible menus, toggles, selects, tabs, dialogs, date/time controls, and bottom sheets. All controls need keyboard interaction, visible focus, clear labels, and touch targets at least 44 CSS pixels where practical. Honor reduced motion. Never communicate status only through color. Mobile layouts must fit 320 CSS pixels without horizontal page scrolling; wide charts use purposeful internal scrolling or alternative summaries. Keep primary completion and scheduling actions reachable with one hand.

## 10. Release acceptance

- A new student signs in with Google, completes onboarding, returns later, and sees persisted private data.
- A subject with multiple units, topics, and subtopics displays correct aggregate progress and survives refresh.
- A college leaf creates a linked self-study session with its chosen day/time, and archived source content does not break that session.
- Concurrent completion retries create one reward; undo and re-completion produce the correct balance and streak history.
- General tasks earn XP, direct college completions earn their own stable reward, and only eligible self-study completions affect streaks.
- Yesterday, midnight, daylight-saving, rejected early completion, historical completion, rescheduling, and timezone boundaries have verified behavior.
- Two accounts with discovery enabled can request and accept friendship; only opted-in ranking data is shared, disabling consent removes visibility, and private records remain inaccessible.
- Avatar changes, finance entries, goals, notes, and fitness measurements persist and follow the documented XP rules.
- Analytics agree with underlying completion/reward records, distinguish planned from self-reported minutes, and reject per-session or daily minutes above 1,440.
- Core journeys work at 320, 360, 390, 768, 1,280, and 1,440 CSS pixels, with keyboard and reduced-motion support, useful errors, loading states, and empty states.

Follow the separate twelve-phase development plan and enforce the companion security, encryption, persistence, and operational contracts.
