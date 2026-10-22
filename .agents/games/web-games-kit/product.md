# Web games kit — product

The kit contains no game rules and no game content. A game imports it for everything below.

## Modules (`apps-games/web-kit/src/<module>/`)

| Module | Contract |
|---|---|
| `rng` | sfc32 PRNG, FNV-1a string hash (`hashString`, `toSeed`), `int/range/float/chance/pick/weighted/shuffle/fork/state` |
| `daily` | `localDateKey(date)` in the device time zone, `dailySeed(gameId, dateKey)`, `dayNumber` from epoch `2026-01-01`, `streakStep` |
| `save` | Versioned save slot, ordered migrations, corrupt-data recovery with backup key; adapters: Capacitor Preferences, localStorage, memory; default picks by platform |
| `settings` | sound, music, haptics, reducedMotion, highContrast (colour-blind-safe toggle); persisted via `save` under `<gameId>.settings` |
| `audio` | WebAudio manager: unlock on first gesture, sfx by id (voice cap 16), one cross-fading music loop, master/sfx/music volumes, settings mute, no-op without `AudioContext` |
| `haptics` | `@capacitor/haptics` wrapper, web no-op, honours settings, never throws |
| `share` | `@capacitor/share`, then `navigator.share`, then clipboard; returns the path used |
| `lifecycle` | pause/resume, Android back routing (`@capacitor/app`), status bar, portrait lock (`@capacitor/screen-orientation`); web no-ops |
| `router` | Typed screen stack (push/pop/popTo/replace/reset), back interceptors, Preact hooks |
| `ui` | `Screen`, `Button`, `IconButton`, `Sheet`, `Modal`, `Toggle`, `Tabs`, `Toast`, `StarRating`, `ProgressBar`, `Card`; `ThemeTokens` (`--wg-*` custom properties), `applyTheme`, `injectKitStyles` |
| `fonts` | `@font-face` registration for bundled woff2, `assertNoPlatformFontFallback` test helper |
| `assets` | `preloadImages` with progress, `checkAssetBudget` / `assertAssetBudget` |
| `motion` | Reduced-motion aware `tween` and `spring` (CSS `linear()` easing) over the Web Animations API |
| `strings` | Typed English string table with `{placeholder}` checking |

## Guarantees

- Rule-like code (`rng`, `daily`, `save` core) never reads `Date.now`, `Math.random`, `window`,
  `document` or `localStorage` (checked by `test/architecture.test.ts`).
- Every platform wrapper is a safe no-op when the API or plugin is missing.
- Primitives are themed only by CSS custom properties; the stylesheet contains no hard-coded
  colours. `neutralTheme` is a structural placeholder: games always pass their own tokens and their
  bundled OFL fonts (the neutral font stack is `sans-serif` and must not ship).
- Touch targets are at least 48px; safe-area insets are honoured; `prefers-reduced-motion` is
  respected.
- No network calls, no accounts, no analytics.
