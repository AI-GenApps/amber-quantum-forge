# Web games kit — decisions log

## 2026-10-23 — Owner decisions (final)

Full v1 for six web games after a shared kit; portrait, offline-first, local save only, no
monetization, DOM/SVG/Canvas 2D, Preact, no game engines, browser-only QA by the owner. See
`tasks/epics/18-web-games-kit/STATUS.md`.

## 2026-10-23 — Dependency pins (task 01)

Every dependency is exact-pinned and copied from `apps-games/city-drive/package.json`:

| Package | Version | Source |
|---|---|---|
| preact | 11.0.1 | City Drive |
| @capacitor/core | 8.5.3 | City Drive |
| @capacitor/app | 8.1.2 | City Drive |
| @capacitor/haptics | 8.0.2 | City Drive |
| @capacitor/preferences | 8.0.1 | City Drive |
| @capacitor/screen-orientation | 8.0.2 | City Drive |
| @capacitor/status-bar | 8.0.4 | City Drive |
| @capacitor/share | 8.0.3 | newest stable 8.x (`npm view`, `latest` tag 2026-10-23); `8.0.4-nightly-*` ignored |
| vitest | 5.0.5 | City Drive |
| happy-dom | 21.0.1 | City Drive |
| typescript | 5.9.3 | City Drive |
| @types/node | 20.19.43 | resolved version of City Drive's `^20.11.17` in `bun.lock` |

`vite` and `sharp` are not kit dependencies (the kit is source-only); skeleton apps pin them
(task 02). `test/architecture.test.ts` fails if a pin loosens or a dependency is added.

## 2026-10-23 — Design choices inside the kit

- `rng` uses sfc32 seeded from an FNV-1a string hash; `fork(label)` gives independent streams.
- Daily seeds hash `gameId|daily|dateKey`; the date key uses the device local time zone.
- `save` stores `{ v, data }` envelopes, serialises writes, and copies discarded data to
  `<key>.corrupt` instead of deleting it.
- Streaks use `streakStep`, which treats a clock that went backwards as its own state.
- `ui` ships a stylesheet (`injectKitStyles`) rather than inline styles so focus and active states
  work; it references only `--wg-*` custom properties.
- `springEasing` samples a damped spring into CSS `linear()`, so springs run on the compositor.
- Barrel `src/index.ts` uses `export *` per module; type names are unique across modules (the
  string table's parameter type is `StringParamsArg`, the router's is `ParamsArg`).
