---
epic: 24-web-lost-parcel-desk
task: 03-progression-and-save
status: pending
commit_scope: lost-parcel-desk
depends_on: [24-web-lost-parcel-desk/02-content]
estimate: XL
owner: agent
---

# Progression, economy, daily mode, versioned save

## Goal

Implement everything that persists or unlocks: stamps and chapter unlocks, postage, hints, streak freezes, records, achievements, the Daily Parcel (generator and a 365-date proof) and the versioned profile save on the kit save store, with migration tests. Rules are pure functions in the core; the app wires them to the kit save store, settings store and clock.

## Context / Decisions

- Owner decisions 2026-10-23 (see `STATUS.md`) are final. QA is browser-only and done by the owner
  at the end: this task is verified headlessly (Vitest with happy-dom, `tsc`, `vite build`, Biome)
  and never opens a browser, device or emulator.
- The game design lives in `.agents/games/lost-parcel-desk/` (`product.md`, `economy.md`,
  `content-plan.md`, `assets-index.md`, `decisions-log.md`). It is updated in the same commit as any
  decision or number change, and numbers must stay identical across those files.
- Repo rules: code files under 800 lines, no `any`, named imports, no comments unless needed.
  The kit (`apps-games/web-kit`) is read-only; a kit limitation is worked around inside the game and
  recorded in `open-questions.md`. No dependency is added or changed (the skeleton `package.json`
  already holds the full v1 set; the core package has no runtime dependencies).
- **Spec of record:** `economy.md` (every number), `product.md` "Chapters and unlocks", "Daily Parcel" and "Hints", and `content-plan.md` (achievements, themes, the daily template bank and weekday ladder). The tests assert the economy tables row by row.
- **Core stays dependency-free:** the core cannot import the kit. Date handling is done in the app with the kit (`localDateKey`, `streakStep`, `dailySeed`, `dayNumber`) and passed in as plain values: a `dateKey` string, a `StreakStep` string, a numeric `seed` and a weekday number 0 to 6 (0 = Monday). The core exports pure reducers that take these values.
- **Profile v1** (`PROFILE_VERSION = 1`, key `lost-parcel-desk.profile`): `postage`, `cases: Record<caseId, { stamps: 0 | 1 | 2 | 3, bestTimeMs, hintsOnBest, closedCount }>`, `chapterBonusClaimed: Record<chapterId, true>`, `themeSelected`, `streakFreezes` (0 to 2), `ledgerSeen: Record<caseId, true>`, `achievements: Record<achievementId, true>`, `session` (the one in-progress `CaseState` with its case id or daily date key, or `null`), `daily: { lastKey, streak, bestStreak, results: Record<dateKey, { stamps }> }` (last 60 days), `history` (last 50 results: kind, id or dateKey, stamps, hints), `flags` (tutorial and mechanic cards seen), `stats` (accusations, wrong accusations, hints used, clues found, cases closed, dailies cleared).
- **Migrations:** v1 is the first shipped schema, so `migrations` is empty; the contract is protected by tests (below) and by `sanitizeProfile`, which clamps and drops unknown fields and validates the stored `session` against the case definition (a stale or tampered session is discarded, never crashes).
- **Daily generator:** `generateDaily(seed, weekday)` builds a `CaseDef` (3 candidates from the 12 townsfolk, 2 deductions, objects from the template bank in `content-plan.md`, flavour from the neutral pool) using the core PRNG: pick the owner, pick two logic facets and the two decoys so that each deduction is the only one that rules out one decoy, apply the weekday ladder (Mon and Tue 3 objects direct + direct; Wed 4 objects direct + direct; Thu and Fri 4 objects direct + rule-out; Sat 5 objects direct + rule-out; Sun 5 objects rule-out + rule-out; flavour 1, 1, 2, 2, 2, 3, 3), then run `analyseCase` and the content validator's flavour hygiene; on failure retry with `fork(attempt)` up to 12 times, then fall back to a committed template (14 templates, 2 per weekday, `seed mod 2`). The generated case carries a `glyph` per object for the task 04 pictograms and no art slot.

## Implementation Checklist

- [ ] `src/progress/profile.ts`: `Profile` type, `defaultProfile()` (30 postage), `sanitizeProfile(data)` returning `Profile | null` (clamps postage >= 0, stamps 0 to 3, freezes 0 to 2, trims history to 50 and daily results to 60, drops unknown keys, rejects wrong types).
- [ ] `src/progress/unlocks.ts`: `totalStamps`, `chapterUnlocked` (chapter 2 at 7 stamps and case 04 closed, chapter 3 at 18 and case 08 closed), `caseUnlocked` (first case of an unlocked chapter, else the previous case closed), `themesUnlocked` (0, 6, 14, 24, 33), `stampsToNextUnlock`.
- [ ] `src/progress/economy.ts`: `applyCaseResult(profile, caseId, result)` implementing the postage rules (first close 10, 5 per new best stamp, chapter bonus 40 once, repeats pay nothing, records raised only), `HINT_PRICE = { campaign: 20, daily: 15 }`, `buyHint` (rejects when short, at the per-case limit, or with nothing to hint), `FREEZE_PRICE = 30`, `buyFreeze` (max 2); all return a new profile plus a typed event list (`postage-gained`, `chapter-bonus`, `theme-unlocked`, `chapter-unlocked`, `stamp-gained`, `ledger-unlocked`).
- [ ] `src/progress/daily.ts`: `applyDailyResult(profile, { dateKey, step, stamps })` for rewards (5 / 7 / 10, upgrade pays the difference, streak bonus `2 x min(streak, 7)` once per day), streak update from the kit step value (`next-day`, `same-day`, `gap` with freeze consumption per missed day, `clock-went-back` changes nothing), best streak.
- [ ] `src/progress/achievements.ts`: `evaluateAchievements(profile, context)` returning newly earned ids for the 12 achievements in `content-plan.md` (clean-sheet, unaided and sharp-eyes need the finished `CaseState` passed in; second-look needs the previous best).
- [ ] `src/progress/records.ts`: history append with cap 50, best-stamp and fastest-time lookups, totals, and `shareText(kind, ...)` producing exactly the two templates in `product.md` (including the "1 hint" and "no hints" variants).
- [ ] `src/daily/{tiers,templates,generate,fallbacks}.ts` as described, with the 24-row template bank and the 12-line neutral pool transcribed from `content-plan.md` and a test that parses the markdown to prove they are identical.
- [ ] App `src/state/saveStores.ts`: `createProfileStore(adapter)` using kit `createSaveStore` (key, version 1, defaults, empty migrations, `parse: sanitizeProfile`) and `createSettingsStore(adapter, "lost-parcel-desk")`; adapter chosen by `createDefaultAdapter()` in `main.tsx`, memory adapter in tests.
- [ ] App `src/state/game.ts`: a small subscribable game store holding the loaded profile and the active `CaseState`, with actions `startCase`, `inspect`, `flip`, `zoom`, `pin`, `unpin`, `link`, `unlink`, `accuse`, `buyHint`, `buyFreeze`, `selectTheme`, `markFlag`, `markLedgerSeen`, `resetProgress`; every state-changing action updates the profile `session` through `store.update` and notifies subscribers; a `useGame` hook built on `preact/hooks`; the clock and `localDateKey` are injected, and elapsed time is accumulated from an injected tick while the app is visible.
- [ ] Flush on pause: wire `lifecycle.onPause` to await any pending save in `main.tsx` (no UI beyond the skeleton).
- [ ] Tests in the core: every row of the `economy.md` source and sink tables; a stamp upgrade pays only the difference; chapter bonus once; unlock thresholds at 6 and 7 and 17 and 18 stamps with and without the previous case closed; theme thresholds at each boundary; daily rewards and upgrade differences; streak bonus capped at 7 (cap reached on day 7 and 8); freeze consumed for one missed day, two missed days with one freeze reset the streak, freezes capped at 2; `clock-went-back` neutral; hint and freeze purchases with insufficient postage rejected; a hint charged exactly once and never charged when rejected; `sanitizeProfile` clamps, rejects and discards a stale session; history and daily trimming; total stamps never above 36; a replay of a perfect campaign in order pays exactly 450 postage including the grant; each of the 12 achievements fires on its condition and not before.
- [ ] Daily tests: the same seed gives a deep-equal `CaseDef`; different dates differ; every weekday tier matches the ladder (object count, deduction kinds, flavour count); each generated case passes `analyseCase` and the hygiene rules; the 365-date test from `2026-01-01` generates every date, validates it, replays a scripted perfect solution to 3 stamps and asserts at most 18 dates (5 percent) use a fallback; the 14 fallback templates validate on their own; no generated clue text repeats within a case.
- [ ] Save tests (app, memory adapter): a fresh profile has 30 postage; round trip; persists across a new store on the same adapter; corrupt JSON gives `recovered` with the backup key written; a future-version envelope gives `recovered` without throwing; a committed fixture `test/fixtures/profile-v1.json` loads as `loaded`; unknown fields are stripped on load; an in-progress case survives a reload and resumes with the same clues found, pins and links; a local test schema at version 2 with a stub migration 1 to 2 proves the chain runs through the same `parse`; `resetProgress` returns defaults and keeps settings; settings persist separately.
- [ ] Update `economy.md`, `product.md` and `decisions-log.md` if any number or rule changed; add `.agents/resources/2026-10-23/web-games/lost-parcel-desk/03/README.md` with the 365-date summary (fallback count, attempts per date min, median, max, distinct owner and facet combinations).

## Files Touched

- `apps-games/lost-parcel-desk-core/src/{progress,daily}/*.ts`, `src/index.ts`
- `apps-games/lost-parcel-desk-core/test/{economy,unlocks,daily-rewards,achievements,daily-generator,daily-365,profile}.test.ts`
- `apps-games/lost-parcel-desk/src/state/{saveStores,game}.ts`, `src/main.tsx`
- `apps-games/lost-parcel-desk/test/{save,game-store}.test.ts`, `test/fixtures/profile-v1.json`
- `.agents/games/lost-parcel-desk/{economy,product,decisions-log}.md` (only if changed)
- `.agents/resources/2026-10-23/web-games/lost-parcel-desk/03/README.md`
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (tick task 03)

## Acceptance Criteria

- Every number in `economy.md` is asserted by a test; a perfect campaign replay totals 450 postage including the 30 grant.
- The Daily Parcel is deterministic per date, validates for 365 consecutive dates, reaches 3 stamps by a scripted solution on every date and uses at most 18 fallbacks.
- The profile save loads, migrates (chain proven), recovers from corruption and future versions, resumes an in-progress case and never throws.
- The core stays free of kit and DOM imports; the architecture test passes.

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- Any screen or visual (task 04).
- Audio and the tutorial UI (task 05); this task only stores the flags.
- Purchases, accounts or network code of any kind.

## Commit message

`feat(lost-parcel-desk): add stamps, postage, daily parcel and versioned save [24-web-lost-parcel-desk/03]`
