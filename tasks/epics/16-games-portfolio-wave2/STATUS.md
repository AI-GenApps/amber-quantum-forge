# Epic 16 — Games portfolio wave 2 (Merge Relay solo launch + portfolio fonts)

Status: pending

## Purpose

Implement the 2026-09-25 portfolio audit's recommendations
(`.agents/resources/2026-09-25/games-portfolio-audit/README.md`), using the
competitor references in
`.agents/resources/2026-09-25/games-competitor-references/README.md`:

1. **Merge Relay → renamed, single-player v1**: Rescue (60 boards in 6
   chapters), Daily, Endless, and local save only. Friend relays, Play Games
   Services and every network path are gated off, but the code is kept for
   v1.1. It gets a full Threes!-grade visual, motion, audio, and brand
   overhaul. **No monetization in v1** (no ads, no IAP).
2. **Custom fonts in every game**: Merge Relay, Pocket Biome,
   Sixty-Second Heist, Meme Court, and Peeklings each bundle OFL display and
   body fonts. No screen may render the platform default font.
3. **Pocket Biome**: an art-direction dry run (preview images plus
   full-screen mockups) for the user to price and pick before any full art
   budget is spent.
4. **Sixty-Second Heist**: strict name-uniqueness research for a rename
   (the current name conflicts with a casino slot). No gameplay work.
5. **Meme Court and Peeklings**: parked. Fonts only; "Peeklings" stays the
   public name.

Ludo (`apps-native/games/ludo`, `packages/ludo_rules`, epic 15) is owned by
another session and is **frozen** for this epic.

## Decisions (user, 2026-09-25)

| Decision | Choice |
|---|---|
| Merge Relay visual target | **Threes!** (character tiles, warm hand-made palette, real soundtrack); original art only |
| Merge Relay v1 monetization | **None** |
| Merge Relay name | The workflow proposes candidates that pass the strict check; **the user picks** at task 17 |
| Rescue content | **60 boards, 6 chapters**, every board solver-validated |
| Branch | Everything on `main`, one commit per task, never push |
| Fonts | Every game uses bundled custom fonts (table below) |

| App | Display font | Body font | Rationale |
|---|---|---|---|
| merge_relay | Fredoka | Nunito Sans | Rounded, friendly numerals for tiles (Threes!-like warmth) |
| pocket_biome | Fraunces (SOFT axis) | Quicksand | Soft botanical serif; cozy |
| sixty_second_heist | Bungee | Chakra Petch | Signage/vault energy; techy body |
| meme_court | Bangers | Lexend | Comic headline; highly legible body |
| snapquest (Peeklings) | Baloo 2 | Andika | Playful rounded; Andika is designed for early readers |

Source: `github.com/google/fonts/tree/main/ofl/<family>` (all verified to
exist on 2026-09-25). Commit each family's `OFL.txt` beside its font files.

## Environment (this server)

There is no physical device and no emulator. The toolchain lives under
`/data/tools`, and every agent command runs with:

```bash
export PATH=/data/tools/bun/bin:/data/tools/flutter/bin:/data/tools/jdk17/bin:$PATH \
  PUB_CACHE=/data/tools/pub-cache JAVA_HOME=/data/tools/jdk17 \
  ANDROID_HOME=/data/tools/android-sdk ANDROID_SDK_ROOT=/data/tools/android-sdk \
  BUN_INSTALL_CACHE_DIR=/data/tools/bun-cache GRADLE_USER_HOME=/data/tools/gradle-home
```

Root `node_modules` must be installed with `bun install --frozen-lockfile --linker hoisted`:
Bun's default isolated linker hangs on this lockfile on this server (it was
reproduced on 2026-09-25). The hoisted linker installs 1466 packages in about 10 s and
leaves `bun.lock` unchanged.

Python with Pillow is `/data/tools/pyenv/bin/python` (for mockups and
contact sheets). Any new tool also installs under `/data/tools/`.

**Screen evidence without a device:** from task 07 onward, each Merge
Relay visual task adds or updates **screen goldens** (1080×2400 logical
phone, real fonts loaded via `test/flutter_test_config.dart`), stored under
`apps-native/games/merge_relay/test/goldens/screens/`. Verifiers VIEW those
PNGs and compare them to the Threes! references from task 01. Device
steps are always reported **NOT RUN**, never faked. Task 25 is the human
device pass.

**Image generation:** tasks 15, 19, 20, 22, and 23 need the image-generation
tool the user adds to the session. Each task's first step is a one-image
smoke test. If no image tool works, the task returns **blocked**; it must
never substitute code-drawn or downloaded art and label it as generated.

## Execution order

Filename order is execution order. The workflow
(`.claude/workflows/games-wave2-sequential.js`) implements, independently
verifies (≤2 fixes), and commits each task in sequence. **It stops at every
`owner: human` task (17, 21, 25).** The human completes that task, marks it
`[x]` here, and resumes the workflow from the next task.

## Tasks

| ID | Task | Owner | Status |
|---|---|---|---|
| 00 | Game knowledge bases + decision records | agent | [ ] |
| 01 | Competitor store-listing references + Merge Relay visual reference | agent | [ ] |
| 02 | Server toolchain verification (build, icons, doctor) | agent | [ ] |
| 03 | Custom fonts: Pocket Biome + Sixty-Second Heist | agent | [ ] |
| 04 | Custom fonts: Meme Court + Peeklings | agent | [ ] |
| 05 | Merge Relay: solo v1 scope gate | agent | [ ] |
| 06 | Merge Relay: solver + 60-board rescue campaign | agent | [ ] |
| 07 | Merge Relay: design system, fonts, screen-golden harness | agent | [ ] |
| 08 | Merge Relay: character tiles + board skin | agent | [ ] |
| 09 | Merge Relay: motion, juice, haptics | agent | [ ] |
| 10 | Merge Relay: CC0 audio + music | agent | [ ] |
| 11 | Merge Relay: home, chapter map, results, settings, pause restyle | agent | [ ] |
| 12 | Merge Relay: onboarding + how-to-play | agent | [ ] |
| 13 | Merge Relay: local quality, seeded runs, budgets | agent | [ ] |
| 14 | Merge Relay: name candidates (strict uniqueness) | agent | [ ] |
| 15 | Pocket Biome: art-direction dry run | agent | [ ] |
| 16 | Sixty-Second Heist: name candidates (strict uniqueness) | agent | [ ] |
| 17 | HUMAN: pick Merge Relay name + Pocket Biome direction | human | [ ] |
| 18 | Merge Relay: apply the chosen name | agent | [ ] |
| 19 | Merge Relay: logo + icon dry run | agent | [ ] |
| 20 | Merge Relay: art-set dry run (tile characters, home scene) | agent | [ ] |
| 21 | HUMAN: pick logo + art direction | human | [ ] |
| 22 | Merge Relay: final logo/icon + integration | agent | [ ] |
| 23 | Merge Relay: final art set + integration | agent | [ ] |
| 24 | Merge Relay: release readiness (privacy, data safety, listing, signing docs) | agent | [ ] |
| 25 | HUMAN: device checkpoint + provisioning | human | [ ] |

## Evidence

Every screenshot, mockup, contact sheet, and research note goes under
`.agents/resources/2026-09-25/games-wave2-qa/<task-id>/` (art masters under
`.agents/resources/2026-09-25/<game>-art/<set>/`) with a `README.md`, and is
committed with its task.
