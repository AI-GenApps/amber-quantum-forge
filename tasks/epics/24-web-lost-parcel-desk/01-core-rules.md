---
epic: 24-web-lost-parcel-desk
task: 01-core-rules
status: in-progress
commit_scope: lost-parcel-desk
depends_on: []
estimate: L
owner: agent
---

# Core rules engine (headless, in lost-parcel-desk-core)

## Goal

Build the deterministic deduction engine in `apps-games/lost-parcel-desk-core`: the logic model (cast, facets, clues, deductions), the structural case analyser that proves a case is valid, the case state machine (inspect, flip, zoom, pin, link, accuse, hint, stamps, elimination) and the feedback helpers. Everything is pure TypeScript with exhaustive tests. No shipped content (task 02) and no UI.

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
- **Spec of record:** `product.md` sections "Rules" (cast and logic model, evidence faces, pins and links, accusation, stamps and score, hints) and "Chapters and unlocks". This task implements them exactly; if a rule proves unworkable, change `product.md`, `economy.md` and `decisions-log.md` in the same commit and say why.
- **Purity:** the existing `test/architecture.test.ts` bans `window`, `document`, `Date.now`, `performance.now`, `Math.random` and `localStorage` in `src/`; it must keep passing. The core has no dependencies, so it cannot import the kit: it carries its own small seeded PRNG (`src/prng.ts`, sfc32 seeded from a 32-bit integer and an FNV-1a string hash) for tests and for tasks 02 and 03. Elapsed time is never read: the app passes milliseconds in through `addElapsed`.
- **Determinism and immutability:** every reducer returns a new state and never mutates its input (tests freeze inputs with `Object.freeze` deeply). The same call sequence always yields `JSON.stringify`-equal states. No object iteration order may influence results: iterate arrays in declaration order.
- **Fixtures:** the shipped cast and cases arrive in task 02. This task tests against hand-built fixtures in `test/fixtures/` (a 6-person mini cast (three values per facet, each held by exactly two people), and five small `CaseDef` objects: a direct+direct case, a pair case, a rule-out case, and two deliberately broken cases), so the engine is proven before content exists.
- **Naming:** logic facets are `street`, `pastime`, `look`, `pet`; polarity `is | isnot`; deduction kind `direct | pair | rule-out`; clue face `front | zoom | back`; link kind `fits | rules-out`.
- **Constants** live in `src/constants.ts` and nowhere else: `MAX_STAMPS = 3`, `MIN_FITS_TO_ACCUSE = 2`, `MAX_HINTS_PER_CASE = 2`, `CANDIDATE_COUNT = 3`, `FACETS` (the four ids in order), `VALUES_PER_FACET = 6`, `PEOPLE_PER_VALUE = 2`. Each is pinned by a test so doc and code cannot drift silently.

## Implementation Checklist

- [x] `src/types.ts`: `FacetId`, `Person` (`id`, `name`, `trade`, `facets: Record<FacetId, string>`), `Polarity`, `DeductionKind`, `ClueFace`, `Clue` (`id`, `objectId`, `face`, `tag`, `text`, optional `flavour`), `EvidenceObject` (`id`, `name`, `caption`), `Deduction` (`id`, `facet`, `polarity`, `value`, `kind`, `clueIds`), `CaseDef` (`id`, `ownerId`, `candidateIds` of length 3, `objects`, `clues`, `deductions`), `LinkKind`, `Link`, `CaseState`, `AccuseResult`, `HintResult`, `CaseIssue` with a string-literal `code` union.
- [x] `src/constants.ts` with the constants above and a pinning test; `src/prng.ts` (`createPrng(seed)`, `hashString`, `next()`, `int(n)`, `pick`, `shuffle`, `fork(label)`) with tests against hard-coded sequence values.
- [x] `src/logic.ts`: `satisfies(person, deduction)`, `consistentCandidates(def, people, deductionIds?)`, `eliminatedBy(def, people, deduction)` (the candidates a single deduction rules out), `canonicalLink(def, people, clueId, personId)` (`fits` when the candidate satisfies the clue's deduction, `rules-out` otherwise, `null` for flavour clues), `leadClueIds(def)`.
- [x] `src/analyse.ts`: `analyseCase(def, people)` returning `CaseIssue[]` with codes `BAD_CANDIDATE_COUNT`, `DUPLICATE_CANDIDATE`, `OWNER_NOT_CANDIDATE`, `NO_UNIQUE_OWNER`, `WRONG_OWNER`, `DEDUCTION_NOT_NECESSARY`, `PAIR_NEEDS_TWO_CLUES`, `SINGLE_NEEDS_ONE_CLUE`, `POLARITY_KIND_MISMATCH`, `UNKNOWN_CLUE`, `UNKNOWN_OBJECT`, `CLUE_IN_TWO_DEDUCTIONS`, `LEAD_CLUE_FLAGGED_FLAVOUR`, `FLAVOUR_CLUE_IN_DEDUCTION`, `DUPLICATE_FACE` (two clues on the same object face), `OBJECT_WITHOUT_CLUE`, `TOO_FEW_DEDUCTIONS` and `TOO_MANY_DEDUCTIONS` (the model requires exactly 2). Each issue carries the case id and the offending id.
- [x] `src/state.ts`: `createCaseState(def)`; `inspectObject(def, state, objectId)` (marks every `front` clue of the object found and the object seen), `flipObject` (`back` clues), `tapHotspot(def, state, clueId)` (`zoom` clue, rejected unless its object is open), `pinClue` / `unpinClue` (only found clues), `linkClue(state, clueId, personId, kind)` / `unlinkClue` (only pinned clues; one link of one kind per clue and candidate; replacing the kind is allowed), `addElapsed(state, ms)`. Rejected actions return the same state object plus a typed reason through a result wrapper (`{ state, ok, reason }`), never throw.
- [x] `src/accuse.ts`: `fitsCount(state, personId)`, `canAccuse(state, personId)` (at least `MIN_FITS_TO_ACCUSE` fits, candidate not returned, case open), `accuse(def, state, personId)` returning `{ state, correct, stamps, closed, byElimination }`: a wrong accusation returns that candidate (`returnedIds`), stamps become `3 - wrong`, and with two candidates returned the last is delivered by elimination with `stamps = 1`; a right accusation closes the case with `stamps = 3 - wrong`. A closed case rejects every further action.
- [x] `src/hints.ts`: `nextUnresolvedDeduction(def, people, state)` (the cast is needed for canonical links; first of D1, D2 whose clues are not all found, pinned and canonically linked), `requestHint(def, people, state)` returning `{ state, deductionId, clueIds, links, explanation }` or a rejection (`NOTHING_TO_HINT`, `HINT_LIMIT`, `CASE_CLOSED`): it finds and pins the deduction's clues, sets the canonical links to all three candidates and counts `hintsUsed` (at most `MAX_HINTS_PER_CASE`). Price handling is task 03.
- [x] `src/feedback.ts`: `explainWrong(def, people, state, personId)` returning a structured object (`kind: "clue" | "unseen"`, `deductionId`, `clueId`, `facet`, `expected`, `actual`) naming a found lead clue of a deduction that rules the candidate out, else the unseen case; `summarizeBoard(def, state)` returning per-candidate `{ fits, rulesOut, returned }` counts for the ARIA summary.
- [x] `src/index.ts` re-exports the public API (keep the existing `version` export).
- [x] Tests (one file per module, hand-computed expectations, no snapshot files): `satisfies` for `is` and `isnot` on all four facets; `consistentCandidates` and `eliminatedBy` on every fixture; `canonicalLink` for fits, rules-out and flavour; `analyseCase` returns no issue for the three good fixtures and exactly the expected code for each broken fixture and for ten generated mutations (swap the owner, drop a deduction, duplicate a candidate, make a deduction redundant, put a lead clue in two deductions, flag a lead clue as flavour, duplicate a face, leave an object clueless, make a pair single, flip a polarity); every state reducer (found-ness per face, zoom needs the object open, pin needs found, link needs pinned, replace link kind, unpin removes its links); `accuse` for 0, 1 and 2 wrong accusations (stamps 3, 2, 1), elimination, closing, rejected re-accusation of a returned candidate, rejected accusation with 0 and 1 fits and accepted with 2; hints: first and second deduction, pair deduction pins both clues, limit 2, nothing to hint when both resolved, a hint after the player already linked correctly; `explainWrong` for found and unseen clues; `summarizeBoard`; PRNG-driven property test over 200 generated mini cases: the reducers never throw for a random legal or illegal action sequence, never mutate their input, stamps always end in 1 to 3 and the owner is always delivered.
- [x] `test/determinism.test.ts`: run the same random action sequence twice and compare full JSON; `test/purity.test.ts` asserts frozen inputs survive every reducer.
- [x] Confirm `test/architecture.test.ts` still passes and no file in `src/` exceeds 800 lines.

## Files Touched

- `apps-games/lost-parcel-desk-core/src/{types,constants,prng,logic,analyse,state,accuse,hints,feedback,index}.ts`
- `apps-games/lost-parcel-desk-core/test/*.test.ts` and `test/fixtures/*.ts` (new files; the existing two tests stay)
- `.agents/games/lost-parcel-desk/product.md`, `decisions-log.md` (only if a rule changed)
- `tasks/epics/24-web-lost-parcel-desk/STATUS.md` (tick task 01)

## Acceptance Criteria

- The reducers are deterministic and immutable: two runs of 200 random action sequences produce identical JSON and no frozen input is mutated.
- Every rule in `product.md` "Rules" has at least one test that fails if the rule changes; the six constants are pinned.
- `analyseCase` accepts the good fixtures and reports exactly the expected code for every broken fixture and mutation.
- A full scripted case (inspect, flip, zoom, pin, link, accuse) reaches `stamps 3` with no wrong accusation, and a scripted worst case reaches `stamps 1` by elimination.
- No `any`, no DOM types in the core, `architecture.test.ts` passes, no source file over 800 lines.
- The four verification commands pass (the app package still builds because it only uses `version`).

## Verification Commands

- `bun run --filter '@web-games/lost-parcel-desk*' typecheck`
- `bun run --filter '@web-games/lost-parcel-desk*' test`
- `bun run --filter '@web-games/lost-parcel-desk' build`
- `bunx biome check apps-games/lost-parcel-desk apps-games/lost-parcel-desk-core`

## Out of Scope

- The 12 cases, the 12 townsfolk and the content validator (task 02).
- Progression, postage, hint prices, the daily generator and the save (task 03).
- Any rendering, UI or audio.

## Commit message

`feat(lost-parcel-desk): add headless deduction engine with case analyser and accusation rules [24-web-lost-parcel-desk/01]`
