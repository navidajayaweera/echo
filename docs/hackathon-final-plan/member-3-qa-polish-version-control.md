# Member 3 Plan: QA, Polish, Docs, Version Control

## Mission

Own the team's operating system for the final 15 hours: version control, merge order, QA, final docs, demo script, visible polish, rehearsal, freeze discipline, and fallback readiness.

Members 1 and 2 should stay focused on Presence and backend. Your job is to prevent collisions, keep the demo route stable, and make sure the team always knows what is done, what is blocked, and what has been deliberately deferred.

## Current State

The project is substantially implemented, but it needs coordination and demo hardening:

- Core app screens exist: Auth, Home, Journal, Presence, Timeline, Settings.
- The live docs are under `docs/`.
- `README.md` is still the default Expo starter, so it is not useful for judges or teammates.
- There is no obvious `.git` folder in the workspace scan, so version control may need to be initialized immediately.
- There is no `test` script in `package.json`.
- `npm run lint` exists.
- `npx tsc --noEmit` is documented in `docs/tech-stack.md`, but not wired as an npm script.
- LiveKit is the highest-risk feature and must be timeboxed.

## Definition Of Done

Minimum demo-ready outcome:

- Git/version-control workflow is established.
- Members have non-overlapping ownership and merge rules.
- A visible checklist tracks must-demo, nice-to-have, and deferred items.
- The three member plans exist and remain accurate.
- Root README or demo notes clearly explain how to run and present the project.
- Lint/type/smoke checks have been run where possible.
- The end-to-end demo has been rehearsed at least three times.
- Backup route exists if LiveKit, embeddings, or a provider fails.

Stretch outcome:

- A short final demo script exists with exact prompts and expected responses.
- Screenshots or screen recording are available as backup.
- All final code is committed with clean status.
- The team has a clear one-minute technical explanation of the architecture.

## Owned Files

Primary ownership:

- `docs/`
- `docs/hackathon-final-plan/`
- `README.md`
- Any demo script or QA checklist docs.
- Version-control flow, branch naming, merge order, and release notes.

Shared lock files. Announce before editing:

- `package.json`
- `package-lock.json`
- `app.json`
- `.env.example`
- `supabase/migrations/`

Do not edit without handoff:

- `app/(tabs)/presence.tsx`
- `hooks/useAISession.ts`
- `components/presence/`
- `supabase/functions/`
- `lib/journal-sync.ts`
- `hooks/useTimeline.ts`

Polish rule:

- You may polish visible UI copy or docs after checking that the owning member is not editing the same file.

## Cursor Model Guide

- Use Composer 2 Fast for docs, README, demo script, checklists, and copy polish.
- Use Claude 4.6 Sonnet Max Thinking for code review, risk review, and deciding whether a change is too risky.
- Use GPT-5.5 High for failure triage and final go/no-go decisions.
- Use GPT-5.3 Codex only for small implementation fixes after the owner hands off the file.

## Version-Control Protocol

### First 30 Minutes

If this workspace is not already a Git repo:

```bash
git init
git add .
git commit -m "baseline: current echo hackathon state"
```

If it is already a Git repo:

```bash
git status
git log --oneline -5
```

Branch plan:

```bash
git checkout -b member-1-presence-livekit
git checkout -b member-2-supabase-memory
git checkout -b member-3-qa-polish
```

Use whatever branch process is fastest for the team, but keep one person responsible for merges.

Commit message format:

```text
member-N: short outcome
```

Examples:

```text
member-1: wire presence session store
member-2: seed demo memories
member-3: add final demo script
```

### Merge Cadence

- Merge every 90 minutes or at each working checkpoint.
- Merge backend/data verification before Presence integration.
- Merge Presence only after it boots locally.
- Do not batch 6 hours of work into one final merge.
- You are the conflict resolver unless the conflict is inside an owner's file.

### Lock Files

These files require a team announcement before editing:

- `package.json`
- `package-lock.json`
- `app.json`
- `.env.example`
- `supabase/migrations/*`

When one changes:

1. Announce who changed it.
2. Commit it immediately.
3. Tell the team what command to run.
4. Re-run lint or boot check.

## Timeline

### T+0:00 to T+0:30: Establish Control

Tasks:

- Confirm whether Git is initialized.
- Create baseline commit if needed.
- Create branches or assign a single-merger workflow.
- Confirm everyone understands file ownership.
- Confirm whether LiveKit dependency changes are allowed before `T+2:00`.

Exit criteria:

- The team has a rollback point.
- No one is editing the same file accidentally.

### T+0:30 to T+1:00: Shared Checklist

Create a visible checklist with three categories.

Must-demo:

- App boots.
- Auth or guest login works.
- Home shows memory/sync status.
- Journal creates a memory.
- At least one memory exists in Supabase or local cache.
- Presence OpenAI/Gemini responds from memory.
- Timeline shows at least one media item or stable empty state.
- Settings persona traits are visible.
- End session does not crash.

Nice-to-have:

- LiveKit avatar video.
- PTT actually toggles mic.
- Real LiveKit data-channel memory overlay.
- `echo_sessions.ended_at` cleanup.
- Full-screen image viewer.
- Document upload.

Explicitly deferred:

- Any feature not supporting the final demo route.
- New providers.
- Large redesigns.
- Push notifications.
- Account deletion/export.

Exit criteria:

- Everyone knows what will and will not be attempted.

### T+1:00 to T+3:00: Docs And Coordination

Tasks:

- Keep the member docs current if ownership changes.
- Draft final demo script skeleton.
- Draft root README replacement or short demo notes.
- Confirm commands and expected platform:
  - `npm install`
  - `npm start`
  - `npm run lint`
  - `npx tsc --noEmit`
- Capture current known risks:
  - LiveKit native build.
  - embeddings/provider secrets.
  - migrations.
  - no automated tests.

Exit criteria:

- Team docs are usable without asking the original planner.

### T+3:00 to T+5:00: First QA Sweep

Tasks:

- Run lint if dependencies are installed.
- Run typecheck if possible.
- Boot the app.
- Smoke-test:
  - Login/signup or guest flow.
  - Home.
  - Journal create/search.
  - Timeline view/upload if backend ready.
  - Settings persona sliders.
  - Presence OpenAI/Gemini start.
- Log each failure with:
  - Owner.
  - Severity.
  - Timebox.
  - Fallback.

Exit criteria:

- The team has a real bug list, not guesses.

### T+5:00 to T+7:00: First Integration

Merge order:

1. Member 2 backend/env/demo-data verification.
2. Member 1 Presence work.
3. Your docs/README/checklist updates.

Tasks:

- Resolve conflicts.
- Run boot/lint check after merge.
- Ask Member 1 to demo Presence.
- Ask Member 2 to demo the memory prompt.
- Decide final provider order:
  - Primary provider.
  - Backup provider.
  - Offline/screenshot fallback.

Exit criteria:

- One end-to-end path is visible, even if rough.

### T+7:00 to T+10:00: Polish And README

Tasks:

- Replace generic Expo README with Echoes-specific run/demo instructions if time allows.
- Tighten visible copy on error states, empty states, and demo-critical buttons.
- Confirm the demo route has no confusing labels.
- Prepare a concise architecture explanation.
- Prepare fallback explanations that sound intentional.

Architecture talking point:

```text
Echoes captures memories through journal entries and media uploads. Supabase stores the user data, embeds journals into pgvector, and edge functions call OpenAI, Gemini, or Beyond Presence with a memory-grounded prompt. The Presence tab is the hero interface where those memories become a conversational echo.
```

Exit criteria:

- The app and docs tell the same story.

### T+10:00 to T+12:30: Three Full Rehearsals

Run the final demo route three times.

Rehearsal route:

1. Open app.
2. Authenticate or continue as guest.
3. Show Home.
4. Add or show seeded journal memory.
5. Show Timeline media by year.
6. Show Settings persona traits.
7. Open Presence.
8. Start primary AI provider.
9. Ask the locked memory question.
10. Show memory-grounded answer.
11. Show Beyond Presence room/video/fallback.
12. Show memory overlay.
13. End session.

For each rehearsal, record:

- Did it finish without code changes?
- Which step failed?
- Was the failure demo-blocking?
- Who owns the fix?
- What is the fallback?

Exit criteria:

- At least one complete run succeeds without code changes.
- Any remaining failure has a fallback.

### T+12:30 to T+14:00: Final Package

Tasks:

- Finalize demo script.
- Capture backup screenshots/video.
- Confirm branch/status is clean or known.
- Confirm `.env` is not committed.
- Confirm no service role secret is in app code or docs.
- Confirm exact device/platform for presentation.
- Write final talking points:
  - Problem.
  - Product.
  - Architecture.
  - AI/Cursor usage.
  - What works now.
  - What would come next.

Exit criteria:

- The team can present even if the live network becomes unreliable.

### T+14:00 to T+15:00: Code Freeze

Rules:

- No new features.
- No refactors.
- No dependency changes.
- No migrations unless the demo cannot run.
- Only critical fixes approved by you and the owning member.

Tasks:

- Run one final demo pass.
- Keep terminal/logs ready.
- Keep fallback screenshots/video ready.
- Prepare final submission text.

Exit criteria:

- Submission/demo-ready.

## QA Matrix

Use this as the core smoke-test matrix.

| Area | Test | Expected |
| --- | --- | --- |
| Boot | Start app | No red screen |
| Env | Missing env check | Clear warning, no crash |
| Auth | Continue as guest | Lands in tabs |
| Auth | Email sign-in | Lands in tabs |
| Home | Stats | Shows memory and sync status |
| Journal | Create entry | Appears immediately |
| Journal | Sync | Pending state clears or clear pending state shown |
| Timeline | View media | Items grouped by year or stable empty state |
| Timeline | Upload | Item appears with signed URL if backend ready |
| Settings | Persona sliders | Values save or no crash |
| Presence | OpenAI/Gemini start | Assistant greeting appears |
| Presence | Memory prompt | Response references seeded memory |
| Presence | BP start | Room info/video/fallback appears |
| Presence | Overlay | Memory panel opens and closes |
| Presence | End session | Returns to idle |

## Failure Triage Rules

Severity 1: demo cannot start or app crashes.

- Stop other work if needed.
- Assign one owner.
- Fix or choose fallback within 45 minutes.

Severity 2: demo route works but one important feature fails.

- Timebox to 30 minutes.
- If not fixed, document fallback.

Severity 3: polish or nice-to-have.

- Fix only before `T+10:00`.
- After `T+10:00`, defer.

## Final Demo Script Template

Use this structure and fill in exact seeded details from Member 2.

```text
1. "Echoes is an AI memory avatar. It captures memories, embeds them, and lets you talk to them through a Presence experience."
2. Open Home: "This is the personal memory dashboard."
3. Open Journal: "I can add a memory offline-first. It appears immediately and syncs in the background."
4. Open Timeline: "Media is grouped by memory year, so the story has both text and artifacts."
5. Open Settings: "Persona traits shape how the echo speaks."
6. Open Presence: "Now we start a memory-grounded session."
7. Ask: "[locked prompt from Member 2]"
8. Point out answer: "The response is grounded in the journal memory about [seed detail]."
9. Show BP/video/fallback: "For the avatar path, Beyond Presence creates a LiveKit-backed room. If native video is unavailable in this build, the room handoff and fallback remain stable."
10. Show Memory Mode: "When a memory is recalled, the overlay surfaces the exact context."
11. End: "The core product loop is capture, recall, and presence."
```

## Backup Plan

If LiveKit fails:

- Demo OpenAI/Gemini memory chat.
- Show Beyond Presence room credentials or clear provider error.
- Trigger memory overlay manually/simulated.
- Explain that SDK 54 native modules require a dev build, and the app has the room/token handoff ready.

If embeddings fail:

- Use recency fallback.
- Use the latest seeded journal for the prompt.
- Explain the vector path exists and fallback keeps responses grounded.

If provider API fails:

- Switch provider.
- Use screenshots/video captured during rehearsal.
- Continue with journal, timeline, settings, and architecture explanation.

If Supabase fails:

- Use local journal cache to show capture.
- Use screenshots/video for AI response.
- Explain the cloud-backed path and show code/docs if needed.

## Final Checklist

- [ ] Git baseline exists.
- [ ] Team ownership is clear.
- [ ] Lock files are controlled.
- [ ] Member 1 Presence path chosen.
- [ ] Member 2 backend status known.
- [ ] Demo data exists.
- [ ] Primary provider selected.
- [ ] Backup provider selected.
- [ ] `npm run lint` run or reason documented.
- [ ] `npx tsc --noEmit` run or reason documented.
- [ ] Three rehearsals attempted.
- [ ] One full demo succeeds without code changes.
- [ ] Screenshots/video backup captured.
- [ ] Final demo script ready.
- [ ] Code freeze enforced at `T+14:00`.
