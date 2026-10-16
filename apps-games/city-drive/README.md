# City Drive (working title)

A 3D low-poly city-driving game built with Babylon.js and TypeScript. It runs in
desktop and mobile browsers, and is packaged for Android and iOS with Capacitor
(task 17). This is the portfolio's first non-Flutter game.

## Workspaces

| Path | Package | Role |
|---|---|---|
| `apps-games/city-drive-core` | `@city-drive/core` | Pure TypeScript simulation: vehicle physics, missions, economy, save logic. Fixed 1/60 s step, deterministic. **No DOM and no Babylon imports, ever.** |
| `apps-games/city-drive` | `@city-drive/app` | Vite + TypeScript app: Babylon rendering, DOM/Preact UI, input, audio. Consumes the core source directly. |

Architecture rule: core = simulation, app = render + UI. The app reads state
from core and draws it; core never knows how it is drawn.
`apps-games/city-drive-core/test/architecture.test.ts` enforces the purity rule
by scanning `src/**` for forbidden tokens.

## Commands

Run from the repository root:

```bash
bun run city-drive:dev        # Vite dev server on http://localhost:4010
bun run city-drive:build      # core tsc build check + app vite build into dist/
bun run city-drive:test       # Vitest in both workspaces
bun run city-drive:typecheck  # tsc --noEmit in both workspaces
```

Single test file while iterating (never run `bunx vitest` from the repo root;
`packages/api` uses Vitest 2.x):

```bash
cd apps-games/city-drive && bunx vitest run test/render/budget.test.ts
```

URL flags (all optional): `?inspector` opens the Babylon Inspector (dev builds only), `?debugcam` swaps
the chase camera for the orbit camera, `?fps` shows an fps / draw-call / triangle overlay, and `?touch`
shows the on-screen touch buttons on a desktop (they appear by default on touch devices). `?district=district-2`
skips the menus and drops straight into that district (dev shortcut; a locked district falls back to the
home screen), and `?notraffic` / `?nomissions` leave out the AI cars or the missions. The Vite dev
server listens on all interfaces (`host: true`) so a phone on the LAN can open it.

Controls: WASD or arrow keys drive, Space is the handbrake, R respawns. On touch, steer with the left
buttons, gas, brake and handbrake on the right (multi-touch). The game is landscape only; portrait
shows a rotate message.

## Conventions

- Babylon: deep ES6 imports only, for example
  `@babylonjs/core/Engines/engine.js`. Never import from the bare
  `@babylonjs/core` barrel. No CDN URLs for decoders or assets.
- Exact-pinned versions (no `^` or `~`) for `@babylonjs/*`,
  `@dimforge/rapier3d-compat`, `@capacitor/*`, `vite`, and `vitest`.
- Declare the Vitest environment per test file: `// @vitest-environment node`
  for render, physics, and core tests; `happy-dom` only for UI tests.
- Rendering is verified headlessly with Babylon `NullEngine`; visual judgement
  belongs to the owner checkpoints (tasks 08, 16, 22).

## UI (task 13)

Everything the player sees is a Preact DOM overlay in `src/ui/`: `tokens.css` (design tokens and the
bundled Russo One / Saira fonts, files and `OFL.txt` under `public/fonts/`), `nav/` (the screen stack and
the back handler), `model/` (pure, tested logic: district and garage cards, meters, objective arrow,
minimap, graphics profile), `screens/` (home, map, garage, settings, pause, briefing, results, HUD) and
`controller.ts` (the stack plus every action, talking to the game only through the `UiGame` interface).
`src/game/gameHost.ts` is the real `UiGame`; component tests use a fake. The game's name lives in one
constant, `src/ui/brand.ts`.
