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

## 2026-05-03 - character-first chat integration

### Review
- Opened `/public/example/example-app-chatview.png` and compared it against the current chat presentation.
- The prior chat input was light, but there was no integrated message stream; older messages either disappeared or risked becoming a drawer/panel.
- The target chat should feel like soft bubbles in Mileahchi's world, with the latest AI response also living in the speech bubble.

### Adjust
- Added `ChatList`, `ChatBubble`, and `ChatInput` components so chat rendering is separated from the main Tamagotchi component.
- Rendered only the latest user/assistant turn as floating bubbles below the character, avoiding WhatsApp-style history.
- Added short bubble truncation and soft fade/slide animation so history stays readable without crowding the character.
- Kept the full latest assistant reply in the large character speech bubble and prevented chat speech from immediately reverting to mood text.
- Added a small minimum reply delay so AI responses feel alive rather than instant UI updates.

### Verify
- `npm run lint` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Playwright mobile smoke test at 375 x 812 showed no horizontal or vertical overflow.
- Chat bubbles remain below the character, input/actions stay thumb-friendly, and the character remains centered and visible.

### Remaining
- No blocking chat UX issues observed in this pass.
- Future polish can add small character-specific typing particles if more delight is needed.

## 2026-05-03 - v4 pet-life scenes and routines

### Review
- Re-opened `/public/example/example-app.png` and inspected the live `tama-mocha.vercel.app` mobile viewport at 375 x 812.
- The existing shell already had the right soft toy direction, but the pet still lived in one generic stage: eating, sleeping, school, and dressing were not represented as real routines.
- Game state also needed first-class scene, outfit, and timed activity data so chat and persistence could understand what Mileahchi is doing.

### Plan
- Add one coherent v4 foundation: generated scene art, timed routines, outfit changes, Supabase-backed scene state, and scene-aware chat prompt updates.
- Preserve the existing mobile layout, stats, level bar, chat dock, and circular action dock.

### Adjust
- Generated GPT-Image-2 scene assets and saved them under `public/character/scene/`: `bedroom.png`, `dining.png`, `school.png`, `wardrobe.png`, plus activity composites `sleeping.png` and `eating.png`.
- Generated GPT-Image-2 outfit sprites and saved alpha PNGs under `public/character/outfits/`: `pajamas.png`, `day.png`, and `school.png`.
- Added `lib/pet/pet-scenes.ts` and `lib/pet/pet-actions.ts` for scene/outfit metadata and activity progress formatting.
- Extended `PetState` with `scene`, `outfit`, `activity`, and `lastDecayAt`.
- Rebalanced actions into v4 routines: `Ät`, `Sov`, `Skola`, and `Kläder`.
- Added timed activity logic: eating restores fullness gradually, sleep restores energy gradually, school consumes some needs while giving XP, and outfit changes complete after a short dressing animation.
- Disabled actions while Mileahchi is busy and added friendly progress bars plus cooldown labels.
- Added completion feedback for timed routines so school, sleep, eating, and changing end with a clear speech-bubble response.
- Added `SceneRenderer`, `SceneControls`, and `Wardrobe` components to keep UI responsibilities separated.
- Updated the OpenAI system prompt so Mileahchi knows the current scene, outfit, and activity, including sleepy/school/eating behavior.
- Added Supabase v4 migration for `current_scene`, `current_outfit`, `activity`, and `last_decay_at`, plus event support for `school` and `wardrobe`.
- Made Supabase storage backward-compatible: if the migration has not been applied yet, v4 scene/outfit/activity state still persists through the existing `pet_memories` game_state row.

### GPT-Image-2 Prompts Used
- Four-panel pastel scene sheet: cozy bedroom, dining nook, outdoor school, and wardrobe nook, no characters/UI/text.
- Three-panel chroma-key outfit sheet matching Mileahchi: pajamas, day clothes, and school clothes.
- Two-panel activity scene sheet: Mileahchi tucked into bed sleeping and Mileahchi seated at a table eating apple slices.

### Verify
- `npm run lint` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Playwright mobile smoke tests at 375 x 812 showed no horizontal or vertical overflow.
- Touch targets remained thumb-friendly: bottom routine buttons measured about 79 x 79px; chat send measured 46 x 46px.
- Eating scene shows Mileahchi seated at a table, gradually changing fullness, with actions locked and a progress bar.
- Sleep scene shows Mileahchi tucked in bed with actions locked and a progress bar.
- School scene shows a school environment, XP reward, long friendly cooldown (`8h`), and locked actions while away.
- Wardrobe scene opens outfit choices, locks school clothes until level 2, changes outfit through a timed activity, and restores the selected outfit after reload.
- Supabase-backed reload restored outfit XP/cooldown state during smoke testing; legacy DB compatibility avoided local fallback before the v4 migration is applied.

### Remaining
- No blocking v4 foundation issues observed in this pass.
- Future polish can add frame-based animation variants for day/school outfits and a dedicated school-return micro-animation.

## 2026-05-03 - immersive full-screen scene rendering

### Review
- Rechecked the current mobile layout against the new goal: the generated scene art still lived inside a rounded rectangle, so Mileahchi felt placed in a UI card instead of inside the room.
- Home, sleep, eating, wardrobe, and school states had good art assets, but the scene boundary was visually obvious.

### Adjust
- Moved scene imagery out of `SceneRenderer` and onto the root viewport background.
- Added `SceneBackdrop` as a reusable full-screen background layer with soft crossfades between environments.
- Added `getPetScenePresentation` so each scene/activity owns its full-screen background, background position, composite-art behavior, and character placement defaults.
- Removed the rounded scene card, border, inset scene image, and card shadow from the character stage.
- Kept UI as floating overlays: header, stats, speech, progress, XP, chat input, and action dock remain readable above the environment.
- Added full-screen top/bottom readability gradients and subtle radial tinting instead of inner card framing.
- Let composite activity scenes (`eating`, `sleeping`) fill the viewport directly, hiding the duplicate standing sprite so Mileahchi appears naturally seated or tucked in.

### Verify
- `npm run lint` passes.
- `npm run build` passes.
- `git diff --check` passes.
- Playwright mobile review at 375 x 812 showed no horizontal or vertical overflow.
- Home view now fills the whole viewport with room art and no visible scene card.
- Eating and sleeping views fill the screen with composite activity art while UI remains readable and touch targets remain about 79 x 79px.
- School and wardrobe states no longer render inside a boxed scene.

### Remaining
- No blocking immersion issues observed in this pass.
- The local Next.js dev-tools button appears in development screenshots only and is not part of the app UI.
