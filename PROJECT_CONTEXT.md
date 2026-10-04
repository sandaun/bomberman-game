# Bomberman Project Handoff

Updated: 2026-10-04

## Purpose

This file records the current project context, approved fixes, improvement
ideas, and the next agreed focus. Read the current code before implementing
anything: this is a handoff snapshot, not a substitute for verification.

## Project and Constraints

- Repository: `/Users/oriolcarbo/code/ironhack/module-1/bomberman-game`.
- Original project: a bootcamp Bomberman game using HTML Canvas and vanilla
  JavaScript classes.
- Keep the existing framework, board size, and Bomberman identity.
- No engine migration, TypeScript migration, new dependencies, or unrelated
  refactors without an explicit agreement.
- Use English for code, comments, documentation, tests, and commits.
- Communicate with the user in Catalan.
- The user values the original visual identity and responsive movement.
- Earlier broad changes caused regressions. Prefer small, verified changes.
- `Readme.md` describes the original bootcamp project and is not a reliable
  description of every current mechanic.

## Current Structure

- `game.js`: GameController, lifecycle, update loop, and game transitions.
- `level-state.js`: LevelState, tiles, destructibles, hidden content, and exit.
- `player.js`: PlayerController, grid movement and interpolated rendering.
- `enemy.js`: EnemyController, grid movement and direction decisions.
- `bomb-system.js`: placement, fuse, explosion propagation, chains, and damage.
- `renderer.js`: canvas rendering and sprite frame selection.
- `assets.js`: shared constants, asset manifest, and sprite definitions.
- `board-textures.js`: cached Canvas tile art for green ground, stone, and wood.
- `input-manager.js`: keyboard direction intent, bombs, and pause actions.
- `hud-controller.js`: DOM HUD and overlays.
- `sound-system.js`: native Web Audio effects, gesture unlock, mute, and cleanup.
- `main.js`: application wiring; current tile size is 50 pixels.

## Fixes to Preserve

- Overlays must not remain visible while playing; respect the hidden state.
- Keep the board prominent, rather than a small canvas below oversized text.
- The approved board ground is quiet green (`#46984f`) with subtle pixel clusters;
  avoid detailed grass imagery that competes with gameplay.
- Player default speed is 280 pixels/second.
- Enemy speed is base 165 plus 12 pixels/second per level.
- Bomb placement is allowed during movement and must not interrupt movement.
- `getBombPlacementTile()` selects the previous tile before 50% travel and the
  target tile from 50% onward. Preserve its behavior unless explicitly revised.
- Bomb animation timing must remain independent of player movement.
- Restart rebuilds game state in memory, rather than reloading the page.

### Approved Explosion Sprites

The user explicitly approved the center animation and the corrected extended
flames. Do not change these while polishing movement.

- Sheet: `images/BombermanBombsExplosions.png`; frames are 16 by 16 pixels.
- Center frames, in order: `(48, 0)`, `(0, 16)`, `(16, 16)`, `(32, 16)`,
  `(48, 16)`. Coordinates are source pixels, not grid cells.
- Intermediate horizontal body: `(80, 48)` before phase 0.35, then `(96, 48)`.
- Vertical body uses the same continuous body sprites rotated 90 degrees.
- Tip sources remain `(0, 32)` before phase 0.35, then `(48, 32)`, with the
  existing direction-specific rotation or flip.
- The previous intermediate sprites were tips, which produced apparent gaps
  when collecting range upgrades. This has been corrected.
- Commit: `10d8bf0`, `fix(renderer): correct explosion sprite frames`.
- Node assertions passed for segment counts at ranges 1, 2, 3, and 5, body
  mapping, rotation, and unchanged center/tip mapping. These were not browser
  playtests. The user also confirmed the visual result looked correct.

## Implemented Movement Polish

- A fresh direction press is buffered for 220 ms of game time, including after
  key release. Successful movement consumes it; blocked input expires.
- Held directions are tried from newest to oldest, allowing forward movement
  to continue while an early turn is blocked.
- Unused frame time carries across tile boundaries at the existing 280 px/s.
- Keyboard repeat does not replace the newest direction intent.
- Held input and the buffer clear on pause/resume, death, win, and level start.
- Bomb placement and the existing 50% placement rule are preserved.
- Eleven movement assertions cover early/blocked turns, release, collisions,
  bomb placement, pause/resume, death, and speed at 20/30/60/144 FPS.

## Implemented Gameplay Feedback

The user authorized this focused visual feedback pass on 2026-09-30.

- Player death finishes its existing 550 ms timer before the game-over menu.
  Gameplay stops immediately; death, active flames, and feedback finish visually.
- Player death uses the nine original frames on the second row of
  `images/BombermanPlayers.png` (24 x 24 source rectangles at y=29).
- Balloon death uses two hit poses from the top row and five frames from shared
  sequence A in `images/BombermanEnemies.png` (16 x 18 rectangles at y=4/411).
  Walking still uses the three existing frames in `images/enemy2.png`.
- Death frame selection follows each entity's remaining death timer, plays once,
  and hides dead sprites. Player/enemy duration remains 550/450 ms.
- The original death sequences replace the temporary shrink/outline effect.
- Destroyed blocks emit four small wood chips for 400 ms.
- Enemy defeat displays +500 at its visible position for 650 ms.
- Pickups display +1 BOMB or +1 RANGE for 700 ms; scoring stays unchanged.
- Feedback ages in game time, freezes in pause, and clears on level start/restart.
- Reduced-motion preferences remove reward drift and keep chip positions static.
  Original death sprites remain the visual indication of defeat.
- Lethal hits stop subsequent pickup/win handling in the same update.
- Seven feedback assertions cover delayed game over, effect lifecycle, single
  rewards, pickup labels, lethal transitions, and hiding dead sprites.
- Three sprite assertions cover full death sequences, source rectangles, sheet
  selection, timing independent of facing/render timestamp, and no looping.
- Browser verification covered player death, game-over timing, and restart.
  Deterministic browser snapshots covered block/enemy/pickup/death rendering.
- Run all current checks with `node --test tests/*.test.cjs`.
- Movement and feedback changes are still uncommitted.

## Implemented Gameplay Follow-up

The user authorized sounds, enemies, level tuning, and tests on 2026-09-30.

- Short native Web Audio sounds cover accepted bomb placements, explosions,
  and pickups. A chain reaction plays one explosion sound per update.
- Audio starts after a user gesture. The HUD sound button mutes/unmutes effects;
  pause and level/restart transitions cancel active and scheduled sounds.
- Audio is optional and needs no dependency or downloaded audio assets.
- The initial blue-marked balloon pursuer has been replaced by the classic
  species implementation described below.
- Enemy count now increases every two levels: 2 at levels 1–2, 3 at 3–4,
  4 at 5–6, 5 at 7–8, and 6 from level 9 onward.
- Eight walkable starting tiles around the first pillar remain crate-free,
  providing two escape routes from the first bomb.
- Spawn tiles stay distant from the player, have at least one walkable neighbor,
  and are separated by at least three Manhattan steps.
- Crates are sampled from a shuffled candidate list, replacing the retry loop
  that could get stuck repeatedly choosing a protected tile.
- Ten gameplay regressions cover extended flames, chains, bounds/crates/walls,
  progression/restart, exit opening, 100 seeded layouts, degenerate randomness,
  pursuit rules, enemy counts, and audio event routing.
- Three sound regressions cover unavailable audio, failed initialization, and mute.
- Native browser checks confirmed non-silent audio output without clipping for
  all three sounds, a running AudioContext, and zero active voices after mute.
- Browser smoke checks covered the mute control, bomb placement, pause, and
  level 3 with three balloons, the visible pursuer marker, and no console errors.
- All 34 current tests pass with `node --test tests/*.test.cjs`.
- All changes in this chat remain uncommitted.

## Implemented Board Texture Pass

The user approved the sample board and its integration on 2026-10-04.

- Ground uses four subtle pixel variations on a softer green base.
- Solid walls use defined stone bricks, raised edges, and dark bases.
- Destructible crates use wooden planks, grain, frame highlights, and nails.
- Short contact shadows appear below obstacles over walkable ground.
- Tile canvases and the full ground layer are generated once per renderer.
- Canvas smoothing is disabled; CSS preserves pixel edges at display size.
- The runtime no longer loads the replaced grass, brick, and wood images.
  The original brick and wood files remain only for the visual comparison.
- `visual-preview/` compares the original board with the shared production
  renderer; the preview no longer has a separate copy of the approved tile art.
- Player, balloons, bombs, explosions, door rendering, collision, and movement
  rules retain their existing definitions.
- All 34 gameplay tests pass. Browser checks cover boot, movement, bomb placement,
  pause, restart, the integrated board, and no console errors.

## Original Power-up Icons

- The user requested sourced icons instead of B/F placeholders on 2026-10-04.
- `images/SuperBomberman2Items.png` is the unchanged Items sheet from
  Super Bomberman 2 (SNES), sourced through The Spriters Resource.
- The first two 16-pixel frames supply Bomb Up and Fire Up; both render at
  32 pixels centered inside the existing tiles, without smoothing.
- `images/ASSET_SOURCES.md` records the source URL, uploader, and frame positions.
- The runtime and comparison preview use icons rather than letter badges.
- Collection rules, capacity, blast radius, and pickup feedback are unchanged.
- All 36 current tests pass; visual review is left to the user as requested.

## Classic Enemy Species

Implemented on 2026-10-04 at the user's request.

- Eight species: Ballom, Onil, Dahl, Minvo, Kondoria, Ovapi, Pass, Pontan.
- `enemy.js` defines species behavior, points, speeds, and level lineups.
- Ballom and Dahl wander; Onil, Minvo, and Ovapi pursue nearby players.
- Kondoria uses route pursuit within eight tiles; Pass and Pontan pursue
  across the board using breadth-first search through legal tiles.
- Kondoria, Ovapi, and Pontan cross destructible crates. Every species
  respects solid walls, board boundaries, and bombs.
- Destruction of an occupied crate can kill a wall-passing enemy.
- Speeds are fixed per species: 165, 190, 190, 225, 90, 145, 240, 260 px/s
  in the species order above. Enemy movement carries time across tile
  boundaries so speed does not depend on frame rate.
- Defeat scores are 100, 200, 400, 800, 1000, 2000, 4000, 8000, respectively.
  Score feedback uses the defeated species' value instead of a flat +500.
- Introduction levels are 1, 2, 3, 4, 7, 10, 14, 18, respectively.
  Pontan appears earlier than NES stage 48 for this smaller endless game.
- Existing counts remain: 2 enemies at levels 1–2, 3 at 3–4, 4 at 5–6,
  5 at 7–8, and 6 from level 9. Lineups are adapted, not original NES waves.
- Existing balloon art is preserved. Seven new species use the unchanged
  `images/BombermanNESEnemies.png` sheet, with cached background removal
  and species-specific walking/death frame selection in `assets.js`.
- `images/ASSET_SOURCES.md` records the NES sheet and behavioral reference.
- The blue marker is removed; the HUD lists the species present.
- All 43 tests pass, including passage rules, pursuit detours, death and
  rewards, progression, and speeds at 20/30/60/144 FPS.
- The user will perform visual/browser review; no browser playtest was run
  for this change at their request.
- No engine, dependency, player movement, or explosion-art changes.

## Remaining Visual Direction

- Aim for a coherent, polished retro Bomberman, not a different visual identity.
- Keep the playfield large and central, with a compact DOM HUD.
- Move long instructions and large title treatment into menus.
- Align palette, pixel scale, outlines, shadows, and character proportions.
- Keep the ground quiet; clearly distinguish solid and destructible obstacles.
- Prioritize meaningful animations over decorative effects that obscure play.
- Use readable arcade-style menus rather than dashboard-like panels.
- Preserve approved assets; replacing inconsistent assets is an option, not
  a commitment to replace the entire original art set.
- The board texture sample is approved and integrated. Further HUD, menu,
  and sprite-proportion changes still need a focused scope.
- Visual improvements do not require an engine migration. Reconsider Phaser
  only if expanded scope makes the existing infrastructure a real limitation.

## Suggested Prompt for the Next Chat

Read PROJECT_CONTEXT.md and the current code. Eight classic enemy species are
implemented with adapted level lineups, movement speeds, pursuit, crate passage,
and original scores; 43 tests pass. The user is doing visual/gameplay review.
Preserve the Canvas framework, player movement, approved board textures,
explosions, balloon art, and power-up icons. Address specific feedback without
adding dependencies or refactoring unrelated systems.
