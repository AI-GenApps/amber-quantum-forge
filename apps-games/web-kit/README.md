# @web-games/kit

Shared framework code for the six web games (Preact, Vite, Capacitor 8). It holds no game rules
and no game content. Source is consumed directly (`exports` points at `src/index.ts`).

```ts
import { createRng, dailySeed, localDateKey } from "@web-games/kit";
```

Rules that apply to every module:

- Anything that reads time, randomness or the platform takes it as an injected parameter (clock,
  storage adapter, `AudioContext` factory, plugin objects), so tests are deterministic.
  `rng`, `daily` and the `save` core never touch `Date.now`, `Math.random`, `window`, `document` or
  `localStorage`; `test/architecture.test.ts` enforces it.
- Every platform wrapper degrades to a safe no-op when the API or Capacitor plugin is missing.
- English only, portrait only, offline only: no network calls.

Scripts (run through the workspace, never `bunx vitest` from the repo root):

```bash
bun run --filter '@web-games/kit' typecheck
bun run --filter '@web-games/kit' test
bun run --filter '@web-games/kit' build   # tsc build check only
```

## rng

Seedable sfc32 generator with string hashing and helpers.

```ts
const rng = createRng(toSeed("lantern-loops:2026-10-23"));
rng.int(6); // 0..5
rng.pick(["a", "b", "c"]);
const order = rng.shuffle([1, 2, 3, 4]); // input untouched
const child = rng.fork("decor"); // independent stream
const saved = rng.state(); // restore with createRngFromState(saved)
```

## daily

Device-time-zone date keys and daily seeds. The clock is passed in.

```ts
const today = localDateKey(new Date()); // "2026-10-23"
const seed = dailySeed("lantern-loops", today); // same device date -> same seed
dayNumber(today); // days since DAILY_EPOCH
streakStep(lastPlayedKey, today); // "same-day" | "next-day" | "gap" | "clock-went-back"
```

## save

Versioned save slot with ordered migrations and corrupt-data recovery. Bad data is copied to a
backup key and replaced by defaults; `load()` never throws.

```ts
const adapter = createDefaultAdapter(); // Preferences on device, localStorage on web, else memory
const profile = createSaveStore(adapter, {
  key: "lantern-loops.profile",
  version: 2,
  defaults: () => ({ coins: 0, stars: {} as Record<string, number> }),
  migrations: { 1: (old) => ({ ...(old as object), stars: {} }) },
  parse: (data) => (isProfile(data) ? data : null),
});
const { data, status } = await profile.load(); // "fresh" | "loaded" | "migrated" | "recovered"
await profile.update((p) => ({ ...p, coins: p.coins + 10 }));
```

Tests use `createMemoryAdapter()`.

## settings

Sound, music, haptics, reduced motion and high-contrast toggles persisted through `save`.

```ts
const settings = createSettingsStore(adapter, "lantern-loops");
await settings.load();
settings.subscribe((next, changed) => audio.syncSettings(next));
await settings.toggle("music");
settings.effectiveReducedMotion(systemPrefersReducedMotion());
```

## audio

WebAudio manager: unlock on the first gesture, sfx by id, one cross-fading music loop, master, sfx
and music volumes, and mute that follows settings. With no `AudioContext` it is a no-op
(`available === false`).

```ts
const audio = createAudioManager();
const removeUnlock = audio.installUnlock(document);
await audio.load("tap", "/audio/tap.ogg");
audio.play("tap", { volume: 0.8 });
audio.playMusic("theme", { fadeMs: 600 });
audio.syncSettings(settings.get());
lifecycle.onPause(() => void audio.suspend());
```

Tests inject `createFakeAudioContext()`.

## haptics

`@capacitor/haptics` on device, silent on the web, honouring the haptics setting. Errors never
reach game code.

```ts
const haptics = createHaptics();
haptics.syncSettings(settings.get());
haptics.impact("light");
haptics.notify("success");
```

## share

`@capacitor/share`, then `navigator.share`, then the clipboard. Returns which path was used and
never throws.

```ts
const result = await shareContent({ text: "I cleared level 12!", url: "https://example.invalid" });
result.path; // "capacitor" | "navigator" | "clipboard" | "unavailable"
result.cancelled; // true when the player closed the sheet
```

## lifecycle

Pause and resume events, Android back-button routing, status bar setup and the portrait lock. All
no-ops on the web.

```ts
const lifecycle = createLifecycle();
await lifecycle.setupDisplay({ statusBarColor: "#16181d", statusBarStyle: "light-text" });
lifecycle.onPause(() => saveNow());
lifecycle.onBack(() => router.handleBack(), { onExit: () => askToQuit() });
```

## router

Tiny typed screen stack with back interceptors for sheets and tutorials.

```ts
interface Routes extends Record<string, unknown> {
  home: undefined;
  level: { id: number };
}
const router = createRouter<Routes>("home");
router.push("level", { id: 3 });
router.handleBack(); // pops "level"
const stop = router.pushBackInterceptor(() => closeOpenSheet());
// Preact: const screen = useCurrentScreen(router); useBackInterceptor(router, open, close);
```

## ui

Preact primitives themed only by CSS custom properties: `Screen` (safe-area aware), `Button`,
`IconButton`, `Sheet`, `Modal`, `Toggle`, `Tabs`, `Toast` (and `useToast`), `StarRating`,
`ProgressBar`, `Card`. `ThemeTokens` names the tokens; `applyTheme()` writes them as `--wg-*`
properties; `injectKitStyles()` adds the stylesheet once.

```tsx
injectKitStyles();
applyTheme({ ...neutralTheme, colorAccent: "#e8a33d", fontBody: '"Quicksand", sans-serif' });
render(
  <Screen name="home">
    <Button onClick={play}>Play</Button>
    <StarRating value={2} />
  </Screen>,
  root,
);
```

## fonts

`@font-face` registration for the bundled woff2 files plus a test helper that proves no text falls
back to a platform font.

```ts
await registerFonts([{ family: "Fraunces", src: "/fonts/Fraunces.woff2", weight: "300 900" }]);
// in a test, after rendering:
assertNoPlatformFontFallback(container, { families: ["Fraunces", "Quicksand"] });
```

## assets

Image preloader with progress, and an asset-budget check for tests.

```ts
const { failed } = await preloadImages(urls, { onProgress: (p) => bar.set(p.fraction) });
// in a test, with sizes read via node:fs:
assertAssetBudget(entries, { totalBytes: 8_000_000, perFileBytes: 600_000, byExtension: { woff2: 400_000 } });
```

## motion

Reduced-motion-aware tween and spring helpers over the Web Animations API. When motion is reduced
or `Element.animate` is missing, the final frame is applied at once.

```ts
const motion = createMotion(() => settings.effectiveReducedMotion(systemPrefersReducedMotion()));
await motion.tween(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
await motion.spring(el, [{ transform: "scale(0.8)" }, { transform: "scale(1)" }]);
```

## strings

Typed English string table; keys and `{placeholders}` are checked at compile time.

```ts
const strings = defineStrings({ best: "Best: {score} {unit}" });
strings.t("best", { score: 12, unit: plural(12, "move", "moves") });
```
