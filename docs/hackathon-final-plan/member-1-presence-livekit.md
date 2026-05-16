# Member 1 Plan: Presence, LiveKit, Hero Experience

## Mission

Own the hero experience: the Presence tab, AI session state, Beyond Presence room flow, LiveKit attempt, push-to-talk behavior, captions, and memory overlay trigger path.

The goal is a demo that feels complete even if the native LiveKit path becomes risky. Real avatar video is the best outcome, but the non-negotiable outcome is a stable Presence flow that proves the product idea: a memory-grounded echo session with a visible room/session state, captions, and a memory overlay.

## Current State

The app already has:

- Expo SDK 54, React Native 0.81, React 19.1.
- `app/(tabs)/presence.tsx` with provider picker, OpenAI/Gemini chat, Beyond Presence placeholder, PTT UI, captions, and `MemoryModePane`.
- `hooks/useAISession.ts` with session start, text chat, provider persistence, and local end-session reset.
- `hooks/useMemoryOverlay.ts` with a LiveKit data-channel parser ready for `RoomEvent.DataReceived`.
- `components/presence/MemoryModePane.tsx` and `components/presence/MemoryRecallCard.tsx`.
- Supabase `start-ai-session` returns Beyond Presence LiveKit credentials.

The remaining risk is that `@livekit/react-native` is not installed and may require a development build. Expo Go cannot load native modules that are not bundled into Expo Go, so this task must be timeboxed.

## Definition Of Done

Minimum demo-ready outcome:

- Presence starts an OpenAI or Gemini session and returns memory-grounded answers.
- Beyond Presence start creates a session and shows room details without crashing.
- The caption area shows useful text or a clear listening/connected state.
- The PTT control gives visible/haptic feedback and does not crash.
- A deterministic memory overlay trigger is available for demo if real LiveKit data events are not available.
- Session start, error, retry, provider switch, and end session all work reliably.

Stretch outcome:

- `@livekit/react-native` is installed and a dev build can connect to LiveKit.
- Remote avatar video track renders in Presence.
- `RoomEvent.DataReceived` opens `MemoryModePane`.
- PTT enables/disables the local microphone track.

## Owned Files

Primary ownership:

- `app/(tabs)/presence.tsx`
- `hooks/useAISession.ts`
- `hooks/useMemoryOverlay.ts`
- `components/presence/MemoryModePane.tsx`
- `components/presence/MemoryRecallCard.tsx`
- New Presence-only components under `components/presence/`

Shared lock files. Announce before editing:

- `package.json`
- `app.json`
- `package-lock.json`

Do not edit without handoff:

- `supabase/`
- `lib/journal-sync.ts`
- `hooks/useTimeline.ts`
- `README.md`
- Any files owned by Member 2 or Member 3 during the same time block.

## Cursor Model Guide

- Use GPT-5.5 High for architecture choices, Expo SDK 54/LiveKit debugging, and go/no-go decisions.
- Use GPT-5.3 Codex for implementation patches in TypeScript/React Native.
- Use Composer 2 Fast for repetitive UI copy or style cleanup after the main Presence path works.

Before coding anything involving Expo or native modules, read the exact Expo SDK 54 docs at `https://docs.expo.dev/versions/v54.0.0/`.

## Timeline

### T+0:00 to T+0:30: Orient And Pick The Demo Target

Tasks:

- Read `docs/screens/presence.md`, `docs/implementation-status.md`, `docs/api-routes.md`, and the current `app/(tabs)/presence.tsx`.
- Confirm which platform will be used for judging: Expo Go, Android dev build, iOS dev build, or web.
- Ask Member 3 whether dependency changes are allowed during this block.
- Confirm with Member 2 that `start-ai-session` returns valid `livekit` credentials for `beyond_presence`.

Exit criteria:

- You know whether real LiveKit is feasible in the hackathon environment.
- You have chosen one of two paths:
  - Path A: LiveKit dev build attempt.
  - Path B: polished Beyond Presence placeholder plus deterministic overlay fallback.

### T+0:30 to T+2:00: LiveKit Feasibility Spike

Path A tasks:

- Check `@livekit/react-native` Expo SDK 54 setup and required config.
- Coordinate with Member 3 before touching dependencies.
- If approved, install the SDK and add any required config plugins.
- Try a dev build only if the team has a real device/emulator path and enough time.

Path B tasks:

- Do not install native dependencies.
- Improve the current BP viewport into a polished component that clearly shows connected room, provider, and fallback state.
- Add a controlled demo trigger for `memory.recalled` using the existing overlay store.

Decision checkpoint at `T+2:00`:

- If native setup is still unclear, stop the spike and choose Path B.
- If native setup is installed but the build is not running, allow only until `T+4:30` before falling back.

### T+2:00 to T+4:30: Build The Presence Core

Tasks:

- Extract the Beyond Presence active view into a small component if it reduces complexity.
- Keep the existing LLM chat path stable.
- If LiveKit works:
  - Connect `Room` with `livekitCreds.wsUrl` and `livekitCreds.token`.
  - Subscribe to video tracks and render the remote avatar.
  - Register `RoomEvent.DataReceived` and call `handleLiveKitData(payload)`.
  - Wire PTT to microphone enable/disable.
- If LiveKit does not work:
  - Make the BP placeholder feel intentional, not broken.
  - Show room name, connection status, and a short explanation that this is the avatar room handoff.
  - Add a demo-safe memory overlay trigger visible only in active BP mode or behind a clear dev/demo affordance.

Exit criteria:

- Presence active BP mode can be shown to judges without looking unfinished.
- Memory overlay can be opened during demo.

### T+4:30 to T+6:00: Session Store And Transcript Wiring

Tasks:

- Wire `useSessionStore` from `useAISession`:
  - `setConnecting(provider)` before starting.
  - `setConnected(sessionId, livekit?)` on success.
  - `setError(message)` on failure.
  - `setDisconnected()` on end.
  - `appendTranscript()` for user and assistant LLM messages.
- Keep state updates simple and easy to reason about.
- Avoid introducing duplicate sources of truth for the visible chat list.

Exit criteria:

- Settings connection checklist can reflect active/error/disconnected AI session state.
- LLM transcript is available in the global session store.

### T+6:00 to T+7:00: Integration With Member 2

Tasks:

- Use Member 2's seeded memories.
- Start OpenAI and Gemini sessions.
- Ask targeted questions that should retrieve a memory.
- Start Beyond Presence and verify LiveKit credentials or fallback room display.
- Record exact working prompt for the final demo.

Exit criteria:

- At least one provider reliably answers from seeded memories.
- Demo question and expected response are known.

### T+7:00 to T+10:00: Hardening

Tasks:

- Fix provider switching while active or connecting.
- Make end session reliable.
- Make retry reliable after edge-function errors.
- Improve visible error messages without leaking secrets.
- Ensure keyboard and text input do not hide key controls.
- Confirm PTT haptics do not throw on target platform.
- If low risk and coordinated with Member 2, add end-session cleanup for `echo_sessions.ended_at`.

Exit criteria:

- Member 3 can run the Presence route twice in a row without a crash.

### T+10:00 to T+12:00: Rehearsal Support

Tasks:

- Join full demo rehearsals.
- Fix only blocker bugs in Presence.
- Do not add new dependencies.
- Do not refactor the screen.
- Capture backup screenshots/video if LiveKit works.

Exit criteria:

- Final demo path is stable.

### T+12:00 to T+15:00: Freeze

Tasks:

- No new Presence features.
- Only fix judge-demo blockers.
- Keep a fallback route ready:
  - OpenAI/Gemini memory chat.
  - BP session room display.
  - Manual/simulated memory overlay.

Exit criteria:

- Presence is demo-ready and no longer changing.

## Handoffs

With Member 2:

- Needs `start-ai-session` health status by `T+2:00`.
- Needs seeded memory prompts by `T+5:30`.
- Needs known-good provider and demo question by `T+7:00`.

With Member 3:

- Needs permission before dependency/config edits.
- Needs merge/checkpoint at least every 90 minutes.
- Needs immediate notice if LiveKit becomes Path B fallback.

## Commands To Run

Use these when relevant:

```bash
npm run lint
npx tsc --noEmit
npm start
npm run android
```

If attempting LiveKit native work:

```bash
npx expo install @livekit/react-native
```

Only run build/prebuild commands after Member 3 confirms the team is taking the dev-build path.

## Evidence To Capture

- Screenshot of LLM memory-grounded answer.
- Screenshot of Beyond Presence active room state.
- Screenshot/video of avatar video if LiveKit works.
- Screenshot of memory overlay open during Presence.
- Notes for any fallback chosen and why.

## Fallback Policy

Hard stop on LiveKit native debugging at `T+4:30`. After that point, finish the polished fallback. Judges should see a stable product story, not a broken native integration attempt.

## Final Checklist

- [ ] OpenAI or Gemini session starts.
- [ ] User can send a message.
- [ ] Assistant response appears.
- [ ] Response references seeded memory.
- [ ] Beyond Presence session starts or shows a clear recoverable error.
- [ ] BP active screen displays room/session info.
- [ ] Memory overlay can be shown.
- [ ] End session returns to idle.
- [ ] Provider switching works after ending.
- [ ] No crashes during two consecutive demo runs.
