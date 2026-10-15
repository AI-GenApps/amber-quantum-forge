---
epic: 17-city-drive
task: 13-ui-screens-and-hud
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/12-economy-garage-save]
estimate: L
owner: agent
---

# UI screens + HUD with custom fonts

## Goal

Replace every debug panel with a cohesive, original UI: home, district map,
garage, mission briefing, in-drive HUD, results, pause, and settings. Use
bundled custom fonts; nothing renders in the platform default font.

## Context / Decisions

- **Stack:** Preact components in a DOM overlay (`src/ui/`) with CSS modules
  or a single tokens stylesheet.
  - Design tokens (colours, spacing, radii, type scale) live in
    `src/ui/tokens.css` as CSS variables.
  - Style: bold, high-contrast, arcade-friendly; rounded panels; one accent
    colour.
  - Not Material-like: no stock-looking inputs, no default system font.
- **Fonts:** **Russo One** (display) and **Saira** (body; variable or
  400/600/700).
  - Source: `github.com/google/fonts/tree/main/ofl/<family>`.
  - Bundle the woff2 files under `public/fonts/` with each `OFL.txt` beside them.
  - `@font-face` with `font-display: block` for the UI (short), and preload
    in `index.html`.
  - A test asserts that the computed `font-family` of the root and of headings
    starts with the custom family (happy-dom), and that the font files and
    OFL files exist.
- **Screens and flow:**
  - **Home:** play (continue free roam in the last district), map, garage,
    settings. Show the coin balance and total stars.
  - **Map:** 3 district cards with lock state, a star progress bar, and a
    mission list per district (stars earned, best time). Entering a district
    loads it.
  - **Garage:**
    - car carousel; renders the car in a small Babylon preview using the same
      engine (one shared engine, a second scene rendered to the same canvas
      when the garage is open, or a render-target texture — pick the cheaper)
    - stats bars (speed, acceleration, grip) derived from `CarSpec`
    - buy/select buttons with clear locked/affordable states
  - **Briefing:** title, brief, type icon, star thresholds, reward; Start or Cancel.
  - **HUD:**
    - speed
    - mission timer and objective text
    - damage or comfort meter (type-specific)
    - an off-screen objective arrow
    - a minimap: a top-down canvas of the road graph with the player and
      objective. Draw it in 2D canvas from core data, throttled to 10 Hz.
    - pause button
    - touch controls from task 07, restyled
  - **Results:** stars animate in, then coins credited, time, best; Retry, Next, Free roam.
  - **Pause:** resume, restart mission, abandon, settings.
  - **Settings:**
    - audio and haptics toggles (wired in task 14)
    - control layout: buttons, or a tilt option only if cheap; otherwise
      buttons only
    - graphics quality Low/Medium/High (maps to hardware scaling and fog
      distance; task 15 finalizes it)
    - reset progress, with confirmation
- **Navigation:**
  - A tiny screen-stack state machine, tested.
  - Android hardware back (via `@capacitor/app` `backButton` in task 17) and
    Escape on the web map to "back/pause". Define the handler now, behind an
    interface.
- **Accessibility:** buttons are real `<button>`s with labels; contrast is
  AA for text; text scales with the root font size; the HUD stays legible at
  360×640 CSS px landscape (640×360).
- **Responsive:** design for landscape 640×360 up to 1920×1080. Use
  `clamp()`-based sizing. Keep safe-area insets.
- **No browser screenshots.** Visual judgement happens at task 16. Agents
  verify structure with component tests (render each screen in happy-dom and
  assert the key elements, states, and navigation).

## Implementation Checklist

- [ ] Tokens, fonts, OFL files, preload, and the font test.
- [ ] The screen-stack navigator plus tests.
- [ ] Each screen as components plus tests (locked/unlocked districts,
      affordable/unaffordable cars, and results star states).
- [ ] HUD with minimap, objective arrow maths (pure, tested), and the
      type-specific meters.
- [ ] Garage 3D preview, with an extended budget test: the garage scene is at
      most 20 draw calls.
- [ ] Remove the debug panels from tasks 07 and 10 (keep `?debug` overlays).
- [ ] Update `.agents/games/city-drive/product.md` (screens, fonts).

## Files Touched

- `apps-games/city-drive/{src/ui/**,public/fonts/**,index.html,src/main.ts,src/render/garage*.ts,test/ui/**}`
- `.agents/games/city-drive/product.md`

## Acceptance Criteria

- All the UI and component tests pass, the font test passes, and every screen
  is reachable through the navigator tests.
- No text element uses a system font stack first.
- The budget tests still pass.

## Out of Scope

- Audio, onboarding, brand name, and icon. Use the working title "City Drive"
  in exactly one constant, so task 20 can rename it.

## Verification Commands

- `bun run city-drive:test`
- `bun run city-drive:typecheck`
- `bun run city-drive:build`
- `bun run check:ci`

## Commit message

`feat(city-drive): add game screens, hud and custom fonts [17-city-drive/13]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Font format:** the Google Fonts repo ships **TTF**. Ship TTF with `@font-face … format("truetype")`; do not add a woff2 converter.
- **Font licences:** add `assets-src/LICENSES/fonts-<family>.txt` (URL, date, SHA-256) beside the bundled `OFL.txt`.
- **Font test:** set `css: true` in the app's Vitest config, or load the CSS with `?raw`, so the test sees real CSS.
- **Contrast:** add a contrast-ratio unit test over the text/background colour pairs in `tokens.css` (AA ≥ 4.5:1 for body text, ≥ 3:1 for large text).
- **Legibility:** the 640×360 legibility check is a task 16 human item. The agent covers layout only through component tests.
- **Files Touched:** add `.agents/resources/2026-10-15/city-drive-qa/13/README.md`.
