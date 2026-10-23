---
epic: 23-web-dress-rehearsal
task: 01-core-rules
status: todo
commit_scope: dress-rehearsal
depends_on: []
estimate: L
owner: agent
---

# Core rules engine (headless, in dress-rehearsal-core)

## Goal

Build the deterministic styling engine in `apps-games/dress-rehearsal-core`: piece and rule types, the slot sets with the one-piece rule, all 16 rule checks with player-readable details, the five-part harmony score, the star evaluation, exhaustive look enumeration and the bounded hint solver. Everything is pure TypeScript with exhaustive tests. No content (that is task 02) and no UI.

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
- **Spec of record:** `product.md` sections "Pieces, slots and the board", "Rules (client constraints)", "Harmony", "Stars" and "Hints". This task implements them exactly; if a rule proves unworkable, change `product.md`, `economy.md`, `content-plan.md` and `decisions-log.md` in the same commit and say why.
- **Prototype to port:** `.agents/resources/2026-10-23/web-games/dress-rehearsal/00/prototype/engine.mjs` is the proven JavaScript version (same formulas, same numbers). Port it to strict TypeScript; do not re-tune a number without updating the docs and the proof counts in task 02.
- **Purity:** the existing `test/architecture.test.ts` bans `window`, `document`, `Date.now`, `performance.now`, `Math.random` and `localStorage` in `src/`; it must keep passing. The core has no dependencies, so it cannot import the kit: it carries its own small seeded PRNG (`src/prng.ts`, sfc32 seeded from a 32-bit integer plus an FNV-1a string hash) used by tests and by tasks 02 and 03. The app converts kit seeds (`dailySeed`) to the integer the core expects.
- **Determinism contract:** `scoreLook` and `solveLook` are pure functions. Same inputs always give byte-identical results (`JSON.stringify` equal); inputs are never mutated; no object iteration order may influence results (iterate slots in the fixed `SLOT_ORDER`, pieces in input order).
- **Data shapes:** a `Look` is a plain record from slot to piece id (`Partial<Record<Slot, string>>`); pieces are passed in as a `Piece[]` (or a lookup map) so the engine is content-agnostic. Tests use inline fixtures (the 16 starting pieces in `test/fixtures/starter-pieces.ts`, copied from `content-plan.md`; fixtures live under `test/fixtures` and are not content).
- **Constants** live in `src/constants.ts` and nowhere else: the 12-step hue wheel order, neutral and warm and cool sets, era order, formality range 1 to 5, warmth range 0 to 3, harmony weights (40, 10, 20, 15, 15), the three-star bar 70, the hint node cap 400,000. Each is covered by a test that pins its number so docs and code cannot drift silently.

## Implementation Checklist

- [ ] `src/types.ts`: `Category`, `Slot`, `Colour` (6 neutrals + 12 chromatic), `Era`, `Feature`, `Piece`, `Rule` (discriminated union of the 16 kinds), `SlotSetId` (`A` to `G`), `Look`, `RuleResult`, `HarmonyPart`, `HarmonyResult`, `ScoreResult`, `ChallengeShape` (id, slot set, rules; richer fields arrive in task 02).
- [ ] `src/constants.ts` with every constant above, exported readonly.
- [ ] `src/prng.ts`: `createPrng(seed)`, `hashString`, `next()`, `int(n)`, `pick`, `shuffle`, `fork(label)`; tests for sequence stability against hard-coded values.
- [ ] `src/slots.ts`: `SLOT_ORDER` (board order: hat, accessory, outer, top, dress, bag, bottom, shoes), `SLOT_SETS` (A to G exactly as in `content-plan.md`), `openSlots(set)`, `place(set, look, piece)` (category check, one-piece rule both ways, returns a new look and the list of displaced piece ids), `clearSlot`, `isComplete`, `missingSlots` (base counts as filled by a dress or by top + bottom), `canPlace` with typed reasons (`WRONG_CATEGORY`, `SLOT_CLOSED`).
- [ ] `src/rules.ts`: `checkRule(rule, pieces)` for all 16 kinds; `ruleCode(rule)` / `parseRuleCode(code)` using the codes in `product.md` (round-trip tested for every kind, bad codes rejected with typed errors); `ruleChipText(rule, pieceName?)` (the exact strings in `product.md`); `ruleDetail(rule, pieces)` returning the value-bearing sentence ("Total warmth is 9, the limit is 7", "Colours used: red, blue, mint", "Missing: something waterproof"); `RULE_FAMILY` (palette, era, formality, weather, feature, budget, piece) used by the daily generator.
- [ ] `src/harmony.ts`: `harmony(pieces)` returning the five parts with name, points, max and one-line reason; scheme names (Neutral, Tonal, Analogous, Complementary, Triad pair, Awkward pair, Triadic, Analogous trio, Busy, Too many colours); hue distance wraps around the wheel (pink 11 and red 0 are 1 step apart).
- [ ] `src/score.ts`: `scoreLook(challenge, pieces, look)` returning completeness, missing slots, per-rule results, harmony and stars (0 incomplete or fewer than ceil(C / 2) rules met, 1, 2, 3 at harmony >= 70); the empty look always returns 0 stars; `livePreview(challenge, pieces, look)` returning rule results and harmony for partial looks without stars.
- [ ] `src/enumerate.ts`: `enumerateLooks(set, closet)` generator in a fixed order, `countLooks`, `solveLook(challenge, closet, locked, { maxVisited })` (bounded depth-first search for a three-star look that contains every locked piece; returns the look, `null` when none exists, or `UNKNOWN` when the cap is hit), and `pickHint(challenge, closet, look, reference)` implementing the "Hints" rules (solver first, reference fallback, first differing slot in `SLOT_ORDER`).
- [ ] `src/index.ts` re-exports the public API (keep the existing `version` export).
- [ ] Tests in `test/` (one file per module, hand-computed expectations, no snapshot files):
  - slots: all seven sets have the right open slots; one-piece rule in both directions and with the displaced list; wrong category and closed slot rejected; completeness for each set including dress-only and top-and-bottom-only sets; missing slots order.
  - rules: every kind met and unmet with boundary values (warmth sum at the limit and one over, spend at the limit, formality min and max at the edge, era order, hue count at 0, 1, 2, 3), neutrals never counted as colours, lime/green/magenta neither warm nor cool, `include-piece` / `avoid-piece` by id; chip text and detail strings for every kind; code round trip.
  - harmony: scheme for H = 0, 1, 2 (distances 0 to 6 including wrap-around), 3 (triadic, analogous trio, busy) and 4 or more; neutral anchor; dress code, era and season spreads 0 to 4; a hand-computed total for three full looks; permutation invariance (shuffled piece order gives the same result).
  - score: the star matrix for C = 2, 3, 4 and every M (0 to C) with harmony just below and at 70; incomplete looks; empty board is 0 stars; partial live preview.
  - enumerate and solver: look counts for the starting closet by set (A 72, B 16, C 144, D 144, E 80, F 160, G 160); `solveLook` finds a look containing the locked pieces, returns `null` when impossible, returns `UNKNOWN` at a tiny cap, and is deterministic; `pickHint` fallback behaviour.
  - parity with the prototype: with the starting-closet fixture, `riv-01` (slot set A, rules `warmth-max:2`, `needs-feature:shade`) has 24 three-star looks of 72, `riv-02` (`max-hues:1`, `max-spend:330`) has 9 and `rai-03` (set B, `needs-feature:waterproof`, `warmth-min:5`, `max-hues:1`) has 4 of 16.
  - property test over 200 PRNG-generated looks and rule sets: scoring is repeatable, never throws, harmony stays within 0 to 100, inputs are not mutated; `test/determinism.test.ts` runs the same scenarios twice and compares full JSON.
- [ ] Confirm `test/architecture.test.ts` still passes and no file in `src/` exceeds 800 lines.
- [ ] Update `product.md` and `decisions-log.md` only if a constant changed; otherwise leave them.

## Files Touched

- `apps-games/dress-rehearsal-core/src/{types,constants,prng,slots,rules,harmony,score,enumerate,index}.ts`
- `apps-games/dress-rehearsal-core/test/*.test.ts` and `test/fixtures/starter-pieces.ts` (new test files, existing two kept)
- `.agents/games/dress-rehearsal/product.md`, `decisions-log.md` (only if a rule changed)
- `tasks/epics/23-web-dress-rehearsal/STATUS.md` (tick task 01)

## Acceptance Criteria

- `scoreLook` is deterministic: two runs of 200 random scenarios produce identical JSON.
- Every rule in `product.md` "Rules", "Harmony" and "Stars" has at least one test that fails if the rule changes; all 16 rule kinds and all five harmony parts are covered at their boundaries.
- The prototype parity tests pass (24 of 72, 9 of 72 and 4 of 16 three-star looks, and the six look counts by slot set).
- No `any`, no DOM types in the core, `architecture.test.ts` passes, no source file over 800 lines.
- The four verification commands pass (the app package still builds because it only uses `version`).

## Verification Commands

- `bun run --filter '@web-games/dress-rehearsal*' typecheck`
- `bun run --filter '@web-games/dress-rehearsal*' test`
- `bun run --filter '@web-games/dress-rehearsal' build`
- `bunx biome check apps-games/dress-rehearsal apps-games/dress-rehearsal-core`

## Out of Scope

- The 48 pieces, 40 challenges, clients and validators (task 02).
- Progression, coins, the daily generator, gallery and saves (task 03).
- Any rendering, UI or audio.

## Commit message

`feat(dress-rehearsal): add headless styling rules, harmony and scoring engine [23-web-dress-rehearsal/01]`
