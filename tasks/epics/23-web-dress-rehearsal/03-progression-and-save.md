---
epic: 23-web-dress-rehearsal
task: 03-progression-and-save
status: todo
commit_scope: dress-rehearsal
depends_on: [23-web-dress-rehearsal/02-content]
estimate: XL
owner: agent
---

# Progression, economy, daily mode, versioned save

## Goal

Add stars, chapter and closet unlocks, coins, client affinity, the Daily Fitting generator with proven solvability, the gallery model and the versioned local save on the kit save store, with tests that assert every number in `economy.md` and the 365-date daily proof.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/dress-rehearsal/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `economy.md` (every number), `product.md` "Campaign structure", "Daily Fitting", "Hints" and "Gallery and export". The tests assert the economy tables row by row.
- **Core stays dependency-free:** the core cannot import the kit. Date handling is done in the app with the kit (`localDateKey`, `streakStep`, `dailySeed`, `dayNumber`) and passed in as plain values: a `dateKey` string, a `StreakStep` string, a numeric `seed` and a weekday number 0 to 6 (0 = Monday). The core exports pure reducers that take these values.
- **Profile v1** (`PROFILE_VERSION = 1`, key `dress-rehearsal.profile`): `coins`, `stars: Record<challengeId, 0 | 1 | 2 | 3>`, `best: Record<challengeId, { stars, harmony, spend }>`, `chapterBonusClaimed: Record<themeId, true>`, `affinityPaid: Record<clientId, 0 | 1 | 2 | 3>`, `streakFreezes` (0 to 2), `framesOwned` and `frameSelected`, `daily: { lastKey, streak, bestStreak, results: Record<dateKey, { stars, harmony }> }` (last 60 days), `gallery` (max 24 entries: id, kind `campaign | daily`, challenge id or date key, look, stars, harmony, savedKey), `history` (last 50 results), `flags` (tutorial, rule cards, how-to seen), `stats` (looks finished, stars earned, hints used, boards exported).
- **Migrations:** v1 is the first shipped schema, so `migrations` is empty; the contract is protected by tests (below) and by `sanitizeProfile`, which clamps and drops unknown fields.
- **Closet from the profile:** `unlockedThemes(profile)` from total stars (thresholds 0, 0, 12, 27, 45, 66) and `unlockedPieces(profile)` (16 at the start, 48 at 66 stars). Challenge unlock: first challenge of an unlocked chapter, otherwise the previous challenge cleared (1 star or more).
- **Daily generator** (`generateDaily({ seed, weekday, closet })`): exactly the algorithm in `product.md` (12 attempts with forked PRNGs, seed look with harmony >= 70, candidate rules, 20 percent non-triviality filter over 300 sampled looks, at most 10 percent sampled three-star share, tier rule counts and the Thursday and Sunday extras), returning a `ChallengeDef`-shaped object with its reference look. The reference is re-scored with `scoreLook` before returning; a failure there throws in tests and falls back in production. Prototype: `.agents/resources/2026-10-23/web-games/dress-rehearsal/00/prototype/daily.mjs` and `gen.mjs`.
- **Fallbacks:** 7 committed templates (Monday to Sunday) built from the 16-piece starting closet only, each a complete challenge with a reference look, validated like campaign challenges.
- **Hints:** use `pickHint` from task 01; campaign hints use the committed reference as the fallback and daily hints use the stored seed look.

## Implementation Checklist

- [ ] `src/progress/profile.ts`: `Profile` type, `defaultProfile()` (40 coins), `sanitizeProfile(data)` (returns `Profile | null`; clamps coins >= 0, stars 0 to 3, freezes 0 to 2, trims history to 50, daily results to 60 and gallery to 24, drops unknown keys and unknown challenge ids, rejects wrong types, resets a frame the player does not own to Plain).
- [ ] `src/progress/unlocks.ts`: `totalStars`, `chapterUnlocked`, `challengeUnlocked`, `unlockedThemes`, `unlockedPieces`, `starsToNextUnlock`.
- [ ] `src/progress/economy.ts`: `applyCampaignResult(profile, challengeId, score)` implementing the coin rules (first clear 10, 5 per new best star, chapter bonus 40 once, never paying for repeats), `HINT_PRICE = { campaign: 20, daily: 30 }`, `buyHint`, `FREEZE_PRICE = 25`, `buyFreeze` (max 2), `FRAME_PRICE = { paper: 30, polaroid: 40, magazine: 60 }`, `buyFrame`, `selectFrame`; all return a new profile and a typed event list (`coins-gained`, `chapter-bonus`, `chapter-unlocked`, `pieces-unlocked`, `star-gained`, `affinity-level`).
- [ ] `src/progress/affinity.ts`: `affinityStars(profile, clientId)`, `affinityLevel` with thresholds 3, 9, 15, and the 10-coin level payments recorded in `affinityPaid`.
- [ ] `src/progress/daily.ts`: `applyDailyResult(profile, { dateKey, step, stars, harmony })` (rewards 8 / 12 / 16, upgrade pays the difference, streak bonus `2 x min(streak, 7)` once per day, streak update from the kit step `next-day`, `same-day`, `gap` with freeze consumption per missed day, `clock-went-back` changes nothing, best streak).
- [ ] `src/progress/gallery.ts`: `saveToGallery` (cap 24, rejects when full with a typed error, rejects 0 stars), `removeFromGallery`, `galleryEntryText`.
- [ ] `src/progress/records.ts`: history append with cap 50, best lookups, totals, and `shareText(kind, ...)` producing exactly the two templates in `product.md`.
- [ ] `src/daily/tiers.ts`, `src/daily/generate.ts`, `src/daily/fallbacks.ts` (7 templates) and `src/daily/brief.ts` (assembles the brief text from rule chips) as described.
- [ ] App `src/state/saveStores.ts`: `createProfileStore(adapter)` using kit `createSaveStore` (key, version 1, defaults, empty migrations, `parse: sanitizeProfile`) and `createSettingsStore(adapter, "dress-rehearsal")`; adapter chosen by `createDefaultAdapter()` in `main.tsx`, memory adapter in tests.
- [ ] App `src/state/game.ts`: a small subscribable game store holding the loaded profile, with actions `recordCampaignResult`, `recordDailyResult`, `buyHint`, `buyFreeze`, `buyFrame`, `selectFrame`, `saveBoard`, `deleteBoard`, `markFlag`, `resetProgress`; every action updates the profile through `store.update` and notifies subscribers; a `useGame` hook built on `preact/hooks`; the clock and `localDateKey` are injected.
- [ ] Flush on pause: wire `lifecycle.onPause` to await any pending save in `main.tsx` (no UI yet beyond the skeleton).
- [ ] Core tests: every row of the `economy.md` source and sink tables; star upgrade pays only the difference; chapter bonus once; unlock thresholds at 11 and 12, 26 and 27, 44 and 45, 65 and 66 stars; closet size 16, 24, 32, 40, 48 at the right totals; affinity at 2 and 3, 8 and 9, 14 and 15 stars with the 10-coin payments once; daily rewards and upgrade differences; streak bonus capped at 7 (cap reached on day 7 and 8); freeze consumed for one missed day, two missed days with one freeze reset the streak, freezes capped at 2; `clock-went-back` neutral; purchases rejected with insufficient coins; frame purchase and selection rules; gallery cap at 24 and removal; `sanitizeProfile` clamps and rejects; history and daily trimming; total stars never above 120; a perfect campaign replay in order pays exactly 1460 coins including the grant.
- [ ] Daily tests: same seed gives identical output (deep equal); different dates differ; the tier ladder (slot counts 6, 6, 7, 7, 8, 8, 8 and rule counts 2, 3, 3, 3, 3, 4, 4, Thursday era-or-formality rule, Sunday budget rule); every generated challenge passes the structural checks of `validateChallenge`; the 365-date test from `2026-01-01` for each of the five closet levels (16, 24, 32, 40, 48 pieces) asserts the stored reference scores three stars under `scoreLook`, the non-triviality sample, and at most 18 fallbacks (5 percent) per closet level; the 7 fallback templates validate on their own; the brief text never exceeds 120 characters.
- [ ] Save tests (app, memory adapter): fresh profile has 40 coins; round trip; persists across a new store on the same adapter; corrupt JSON gives `recovered` with the backup key written; a future-version envelope gives `recovered` without throwing; a committed fixture `test/fixtures/profile-v1.json` loads as `loaded`; unknown fields are stripped on load; a local test schema at version 2 with a stub migration 1 to 2 proves the chain runs through the same `parse`; `resetProgress` returns defaults and keeps settings; settings persist separately.
- [ ] Update `economy.md`, `product.md` and `decisions-log.md` if any number or rule changed; add `.agents/resources/2026-10-23/web-games/dress-rehearsal/03/README.md` with the 365-date summary (fallback count per closet level, attempts min, median, max).

## Files Touched

- `apps-games/dress-rehearsal-core/src/{progress,daily}/*.ts`, `src/index.ts`
- `apps-games/dress-rehearsal-core/test/{economy,unlocks,affinity,daily-rewards,daily-generator,daily-365,gallery,profile}.test.ts`
- `apps-games/dress-rehearsal/src/state/{saveStores,game}.ts`, `src/main.tsx`
- `apps-games/dress-rehearsal/test/{save,game-store}.test.ts`, `test/fixtures/profile-v1.json`
- `.agents/games/dress-rehearsal/{economy,product,decisions-log}.md` (only if changed)
- `.agents/resources/2026-10-23/web-games/dress-rehearsal/03/README.md`
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 03)

## Acceptance Criteria

- Every number in `economy.md` is asserted by a test; the campaign maximum income totals 1460 coins including the starting grant (a test replays a perfect campaign and checks it).
- The Daily Fitting is deterministic per date, has a verified three-star reference look for 365 consecutive dates at each of the five closet levels, and uses at most 18 fallbacks per level.
- The profile save loads, migrates (chain proven), recovers from corruption and future versions, and never throws.
- The core stays free of kit and DOM imports; the architecture test passes.

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- Any screen or visual (task 04).
- Audio and onboarding UI (task 05); this task only stores the flags.
- Purchases with real money, accounts or network code of any kind.

## Commit message

`feat(dress-rehearsal): add progression, coins, daily fitting and versioned save [23-web-dress-rehearsal/03]`
