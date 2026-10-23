# Epic 21 — Cloud Observatory (web, full v1)

Status: in progress (tasks 00 to 03 done, 04 in progress, 05 to 08 pending)

## Purpose

Build Cloud Observatory as a full v1 web game: an incremental discovery game where the player
builds an observatory network, gathers starlight, charts 12 constellations by tapping star
patterns, plays the Eclipse prestige layer and reads a 30-entry quiet cosmic story. It ships as a
Vite + Preact app wrapped by Capacitor 8 for Android and iOS (project files only), on the shared
`@web-games/kit`, with a pure headless rules package.

Knowledge base: [`.agents/games/cloud-observatory/`](../../../.agents/games/cloud-observatory/README.md)
(product, economy, content plan, store listing, assets index, decisions log, open questions).
Evidence: `.agents/resources/2026-10-23/web-games/cloud-observatory/`.

| Package | Path |
|---|---|
| App `@web-games/cloud-observatory` | `apps-games/cloud-observatory` |
| Rules `@web-games/cloud-observatory-core` | `apps-games/cloud-observatory-core` |
| Kit `@web-games/kit` (read-only) | `apps-games/web-kit` |

## Decisions (owner, 2026-10-23; final, do not reopen)

| # | Decision |
|---|---|
| 1 | Build all six web games as FULL v1 (complete loop, full v1 content, progression, local save, reviewed art, custom OFL fonts, CC0 audio, haptics, onboarding, Capacitor Android/iOS projects). No store submission |
| 2 | Wave 1 after the shared kit: lantern-loops, floodplain-dispatch, cloud-observatory |
| 3 | No monetization in v1: soft currency and unlocks only; no ads, IAP, accounts or network calls. The economy leaves room for IAP later |
| 4 | QA is browser-only and done by the owner at the end. Agents do NO visual QA: no browser, Playwright, app screenshots, device, emulator, APK build or JDK install |
| 5 | Stack: TypeScript + Vite + Preact + Vitest (happy-dom), Capacitor 8; rendering is DOM/SVG/Canvas 2D; no game engines |
| 6 | Each game is `apps-games/<slug>` + `apps-games/<slug>-core`; shared code lives in `apps-games/web-kit` |
| 7 | Portrait, offline-first, local save only (Preferences on device, localStorage on web), versioned with migrations; daily mode seeded from the local date, generated on device |
| 8 | All graphics come from the MobileGamesDesigner T3 thread and pass a strict art review; fonts OFL (Google Fonts repo); audio CC0 only |
| 9 | Working titles are the public names in v1 |
| 10 | Own branch (`feat/web-cloud-observatory`), worktree and PR; the orchestrator creates, reviews and merges the PR |

Game-specific design decisions are in the decisions log. The pacing targets are fixed by the
spec: first constellation under 3 minutes, first Eclipse 2.5 to 4 hours of active play, no dead
zone over 6 minutes between meaningful purchases.

## Scope fence

Allowed edits for every task in this epic:

- `apps-games/cloud-observatory/**`
- `apps-games/cloud-observatory-core/**`
- `.agents/games/cloud-observatory/**`
- `.agents/resources/2026-10-23/web-games/cloud-observatory/**`
- `tasks/epics/21-web-cloud-observatory/**`

Read-only: `apps-games/web-kit`, every other game (City Drive, Flutter games, Ludo, Merge Relay, the
other five web games), `bun.lock`, root `package.json`, `biome.json`, `knip.json`,
`tasks/STATUS.md`, `scripts/**`, `.github/**`, `docs-internal/**`. Do not add or change
dependencies: the skeleton `package.json` already holds the full v1 set. A kit bug is worked around
inside this game and recorded in `open-questions.md` as a kit follow-up. If a task truly needs a
change outside the fence, stop and report `blocked` naming the file and the exact change.

## Rules that apply to every task

- No visual QA by agents. Verify with Vitest (happy-dom), `tsc`, `vite build` and Biome.
- Core (`cloud-observatory-core/src`) must stay pure: the architecture test forbids the tokens
  `window`, `document`, `Date.now`, `performance.now`, `Math.random`, `localStorage`, even inside
  strings and comments. Randomness comes from the kit rng or a locally written seeded generator
  passed in; time is injected.
- Code files stay under 800 lines. No `any`, named imports, no comments unless needed.
- Fonts: OFL, bundled woff2 with `OFL.txt`; no text may fall back to a platform font. Audio: CC0
  only, source URL and licence recorded per file; never synthesize audio and call it CC0.
- Throwaway downloads go under `/Users/ashutosh/Dev/W3DevMobile/aqf-wt/scratch/cloud-observatory/`
  (delete when done), never `/tmp`.
- The knowledge base is updated in the same commit as any decision or number change.
- Commit format `type(cloud-observatory): summary [21-web-cloud-observatory/NN]`, no
  Co-Authored-By or "Generated with" lines, never `--no-verify`.

## Execution order

Filename order is execution order. Tasks 01 to 03 build the headless game (rules, content,
progression and save). Task 04 builds the UI. Task 05 adds audio, haptics and onboarding. Task 06
integrates reviewed art (it can only complete after the designer inbox delivers; rejected slots keep
placeholders). Task 07 adds the Capacitor projects. Task 08 is release readiness and the owner QA
checklist.

## Tasks

| ID | Task | Owner | Status |
|---|---|---|---|
| 00 | Knowledge base, design spec and epic task files (this planning step; no task file) | agent | [x] |
| 01 | [Core rules engine (headless, in cloud-observatory-core)](01-core-rules.md) | agent | [x] |
| 02 | [Full v1 content + validators](02-content.md) | agent | [x] |
| 03 | [Progression, economy, daily mode, versioned save](03-progression-and-save.md) | agent | [x] |
| 04 | [All screens, navigation, design tokens, fonts, accessibility](04-screens-and-ui.md) | agent | [x] |
| 05 | [CC0 audio, haptics, motion polish, onboarding and how-to-play](05-audio-haptics-onboarding.md) | agent | [ ] |
| 06 | [Integrate reviewed art from the designer inbox](06-art-integration.md) | agent | [ ] |
| 07 | [Capacitor Android/iOS projects, icons and splash](07-capacitor-packaging.md) | agent | [ ] |
| 08 | [Release readiness, budgets, knowledge base, owner QA checklist](08-release-readiness.md) | agent | [ ] |

## Verification gate (every code task)

```
bun run --filter '@web-games/cloud-observatory*' typecheck
bun run --filter '@web-games/cloud-observatory*' test
bun run --filter '@web-games/cloud-observatory' build
bunx biome check apps-games/cloud-observatory apps-games/cloud-observatory-core
```

## Content contract (checked by validators from task 02)

12 constellations (86 stars), 8 instruments, 24 upgrades, 10 boons (105 shards), 30 lore entries
in 6 chapters, 20 achievements, 1 daily mode, 33 art slots, 2 fonts. Single source of numbers:
`.agents/games/cloud-observatory/economy.md`.

## Handover to the owner

The owner runs browser QA from `.agents/resources/2026-10-23/web-games/cloud-observatory/qa-checklist.md`
(written in task 08). Native builds (Gradle, Xcode) are the owner's later step.
