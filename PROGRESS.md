# Mileahchi Ralph Progress

## 2026-05-03 - v2 companion polish

### Review
- The current app is a mobile-first Next.js + Tailwind companion page for Mileahchi.
- Swedish UI text is in place across the header, mood labels, stats, action buttons, and speech messages.
- Sprite-based animations exist for idle, happy, playful, sleepy, and hungry states.
- Pet logic is separated from UI in `lib/tamagotchi/pet-state.ts`, animation metadata is separate in `lib/tamagotchi/animation-data.ts`, and frame playback is handled by `hooks/use-sprite-animation.ts`.

### Adjust
- Added a generated hungry sprite animation with four aligned frames under `public/character/animations/hungry/`.
- Wired hungry mood to its own default loop instead of falling back to idle.
- Added localStorage persistence with saved-at timestamps and offline decay on restore.
- Slowed stat decay slightly so the companion does not collapse into low stats too quickly during casual testing.
- Switched the sprite frame controller to interval-driven playback while keeping one-shot reactions returning to the mood animation.
- Ignored local Playwright artifacts and manual screenshots so verification output does not pollute the repo.

### Verify
- iPhone-size Playwright smoke test at 375 x 812 showed no horizontal or vertical overflow.
- Action buttons measured 60px high, satisfying the 44px touch target requirement.
- Forced persisted hungry state restored correctly with Swedish hungry copy and `/character/animations/hungry/frame-#.png`.
- Existing action flow remains responsive: actions update stats, speech, and reaction animation.

### Remaining
- Supabase persistence and OpenAI chat are intentionally skipped for now per the latest direction.
- No blocking v2 app issues observed in this pass.

## 2026-05-03 - v3 persistence and chat foundation

### Review
- The v2 companion UI, sprite animation system, Swedish copy, local decay, and localStorage restore path were intact.
- Missing v3 pieces were Supabase persistence, server-side OpenAI chat, database schema/RLS, safe guest sessions, chat UI, and child-safety handling.
- The project has no Supabase or OpenAI SDK dependencies, so the implementation keeps the dependency surface unchanged and uses server-side `fetch`.

### Plan
- Add one complete vertical slice: auth-ready Supabase schema, guest-session API routes, OpenAI-backed chat route, safety guardrails, and a compact mobile chat dock.
- Keep the current Tamagotchi screen as the primary experience instead of turning the page into a generic chat app.

### Adjust
- Added `supabase/migrations/20260503000000_create_mileahchi_v3.sql` with profiles, pet profiles, events, chat messages, pet memories, indexes, updated-at triggers, and RLS policies.
- Added server-only Supabase REST helpers using `SUPABASE_SERVICE_ROLE_KEY` only inside route-handler code paths.
- Added `/api/pet/load`, `/api/pet/action`, and `/api/chat` route handlers.
- Added safe guest IDs stored in localStorage and validated on every API request.
- Added an OpenAI Responses API service using `OPENAI_API_KEY` server-side only, plus a Mileahchi system prompt, response repair, and serious-theme safety fallback.
- Added deterministic chat-to-pet effects so chat can lightly nudge mood/animation without letting raw model output write arbitrary state.
- Added a compact chat dock with a thumb-friendly input, send state, recent-message drawer, soft fallback notices, and speech-bubble replies.

### Verify
- `npm run lint` passes.
- `npm run build` passes; API routes are dynamic and the page remains statically prerendered.
- Playwright mobile smoke test at 375 x 812 showed no horizontal or vertical overflow.
- Touch targets remained at least 44px: chat input/send measured 44px and action buttons measured 60px.
- Supabase `/api/pet/load` returned `storage: "supabase"` with persisted pet state and recent messages for the generated guest session.
- `/api/pet/action` persisted a feed event and returned updated server-owned pet state.
- `/api/chat` returned a warm Swedish Mileahchi response, stored chat messages, and triggered a playful/sleepy animation based on message/state.
- Serious-theme safety test returned the trusted-grown-up response without calling for deeper roleplay.

### Remaining
- The app is ready for v3 foundation testing with the current guest-first model.
- Guest rows are not exposed through public Supabase policies; guest access is routed through server API handlers using the service role key. A future auth migration should link `guest_id` pets to `user_id` rows when login is added.

## 2026-05-03 - v3 toy loop and reference alignment

### Review
- Opened `/public/example/example-app.png` and compared it against the current screen.
- The app needed less card framing, a stronger pastel toy-world feel, circular controls, a visible level loop, and less chat-history clutter.
- Game mechanics were still too easy to spam: actions could be repeated quickly, stats moved too sharply, and progression did not yet give a daily-return reward.

### Plan
- Make one coherent improvement across the toy loop: balanced decay, cooldowns, diminishing returns, XP/level progression, and a reference-aligned mobile shell.
- Keep Supabase/OpenAI working and avoid rebuilding the app or adding dependencies.

### Adjust
- Added balanced game state: `progress`, `actionMemory`, action cooldowns, diminishing returns, slower decay, XP gain, level thresholds, and stat tiers.
- Updated actions so repeated taps are blocked during cooldown and repeated use within the diminishing window gives smaller rewards.
- Added chat XP and lighter chat stat effects so conversation feels rewarding without letting AI directly control arbitrary state.
- Persisted progression/cooldown metadata through the existing `pet_memories` table as a `game_state` memory, keeping `pet_profiles` focused on core stats.
- Added toy UI components: `StatsPanel`, `SpeechBubble`, `LevelBar`, and `ActionDock`.
- Moved the layout closer to the reference: full-screen pastel environment, centered character, compact stats, large speech bubble, level strip, floating chat input, and big circular bottom actions.
- Removed the visible chat-history toggle from the main surface so chat remains secondary to the character.

### Verify
- `npm run lint` passes.
- `npm run build` passes.
- Playwright mobile smoke test at 375 x 812 showed no horizontal or vertical overflow.
- Character remains visible and dominant; current rendered sprite measured about 322px wide on mobile.
- Chat input/send target measured at least 44px high; circular action buttons measured about 78px.
- Supabase `/api/pet/load` returned `storage: "supabase"` and restored persisted XP/action memory.
- Double action API test accepted the first hug, rejected the immediate second hug, returned `xpGained: 0`, and included a friendly cooldown message.

### Remaining
- No blocking issues observed in this Ralph pass.
- Future polish can add unlockable phrases/outfits once v3 gameplay is validated with real users.
