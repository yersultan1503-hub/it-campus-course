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

## Q1 guest characters (2026-11-08)
Use actual downloaded Naruto and Jerry for player/NPC selections. Tom is a stationary animated guest; Optimus has a transform showcase, not a walk cycle. Keep attribution. Preserve Naruto idle/run blend and horizontal root-motion removal. Do not relabel old civilian models as franchise characters.

## Observatory course expansion (2026-11-08)
Q1 uses the provided observatory-night reference: open telescope dome, warm windows,
cyan fibre boulevard, star field and richer planted perimeter. Day/night follows
same-origin localStorage `campus-theme` (`light`/`dark`). Preserve all real guest
characters, authored gait and credits. Q1 has 12 instructional missions, with
07/13/15 assessments excluded; server controls access and grades every attempt.
Q3 must render its distinct `/legacy-q3/game/` campus and use a separate generic
server checkpoint; iframe XP/messages/localStorage never unlock lessons.

## Серверлік рұқсат және Q2
Барлық каталог/станция/iframe/legacy zone entry үшін тек fresh /api/me + /api/course unlocked===true қолданылады. localStorage XP, role атауы не iframe message рұқсат бермейді. Legacy source hook және /game/legacy-access.js index module сақталсын. Q2 бес lesson ID q2-01…q2-05; бөлек CodingDistrict, generic сервер evidence; импорт HTML орындалмайды.

Q2/Q4 тізілімдері динамикалық: тек сервер quarter 2/4 kind=lesson қабылдаңыз; assessment қоспаңыз. Q4 DatabaseDistrict ешқашан Q1 fallback болмауы тиіс. automaticGrade тек progress.automaticGrade source=server, maxScore=10 және валид score/correct/total/attemptId арқылы көрсетіледі. Баға практика passed/unlock-пен тең емес; client grade есептемейді.
