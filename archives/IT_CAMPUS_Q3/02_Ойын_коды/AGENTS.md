# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Camera preference
The user uses a laptop trackpad and requires free viewing from every side. Keep primary drag = orbit, Shift/right drag = pan, ordinary two-finger wheel = planar pan, pinch/Ctrl+wheel = zoom, and visible camera buttons/reset. Preserve single-click movement; drags must not move the player or select a lesson.

Movement must recognize physical KeyboardEvent.code (KeyW/A/S/D), Cyrillic ЦФЫВ and arrow keys, auto-start from the intro on movement, and make short taps visible. Keep direction relative to the current camera; never auto-walk merely because the lesson HUD selection changes. Show the player with a small «Сен» marker.

Walking must remain articulated even when reduced motion is enabled. Use distance-driven stance/swing, knee/ankle motion and opposing arms; idle/blocked characters must stop stepping. Reduced motion may disable background NPC travel and decorative bobbing, never the essential player gait.

## Course integration decisions (2026-10-26)
Keep the 3D campus visible when entering a lesson link. Select the destination with ?lesson=html|table|links|css|media|js|quiz|db, without automatically opening a modal. Preserve free camera control and reduced-motion settings. Require the lab plus two other games for mission completion. Apply learner HTML heading to the campus sign using text rendering, never HTML injection.

## Realism direction (2026-10-27)
User requests GTA-like third-person camera, realistic human locomotion and materials for the educational campus. Preserve lessons and fallback lightweight mode. Imported human is a temporary guide avatar; do not claim a custom student model or GTA fidelity. Keep overview/orbit available and Shift sprint.

## Visual preference (2026-10-27)
Avoid brown ground. Use light gray paving, green lawns and modest flower beds beside clear walkways. Distinguish NPCs by colors and proportions; player uses cyan armor, cyan marker and СЕН · ЗЕРТТЕУШІ label. The current variants still share one base mesh.

## Characters and sound (2026-10-27)
NPCs must include ordinary campus students, not clones of the armored player. Eight procedural civilian rigs now vary clothes, skin, hair, caps, glasses and bags. Keep the cyan imported avatar for the player. Audio must stay opt-in, offer a test button, mute on hidden tab and use distance-driven footsteps rather than continuous walking sounds at rest.

## Anime character revision
User rejects primitive civilian NPCs. Use three distinct authored VRoid student models (A/B/C), with normalized humanoid walking, relaxed arms and blinking. Keep distinct cyan player. Avoid replacing imported characters with block/cylinder figures except load failure fallback.

User requests robot, animal and military NPCs alongside the three anime students. Use authored RobotExpressive, Fox and Soldier animations. VRM normalized skeleton faces -Z: knee X must be negative; use studentGait.js distance-driven IK, not the old positive-knee sine cycle.
