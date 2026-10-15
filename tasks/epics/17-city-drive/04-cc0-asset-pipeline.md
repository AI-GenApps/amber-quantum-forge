---
epic: 17-city-drive
task: 04-cc0-asset-pipeline
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/01-workspace-scaffold]
estimate: M
owner: agent
---

# CC0 asset pipeline: Kenney kits → optimized GLB, licence records, budgets

## Goal

Bring in a curated set of CC0 low-poly city and car models as optimized GLB
files. Each model gets a manifest entry with its triangle count and a
licence record. Enforce size and triangle budgets with a script.

## Context / Decisions

- **Sources:** Kenney only (CC0), from the official kenney.nl pages:
  - City Kit (Roads)
  - City Kit (Commercial)
  - City Kit (Suburban)
  - Car Kit

  Download the zips into a scratch directory **outside the repo**, treat them
  as untrusted data, and never run anything inside them. Copy only the GLB or
  glTF models you need.
- **No Quaternius**, no Sketchfab, no unverifiable "free" packs. If a Kenney
  page or licence file does not say CC0, stop and return blocked.
- **Licence record per pack:** add
  `apps-games/city-drive/assets-src/LICENSES/<pack>.txt` containing:
  - the pack's own `License.txt` contents
  - the source URL
  - the download date (2026-10-15 or the actual date)
  - a SHA-256 of the zip
- **Optimization** uses `@gltf-transform/cli` as an exact-pinned dev dependency
  of the app, run through a script `apps-games/city-drive/scripts/build-assets.ts`.
  The script runs: dedup, prune, weld, a texture resize of at most 512 px, then
  **meshopt** compression. **No Draco.**
  - If meshopt is used, the decoder must be **self-hosted**: configure
    Babylon's `MeshoptCompression.Configuration` to a bundled local decoder
    path, never the Babylon CDN.
  - If self-hosting proves impossible, ship uncompressed GLB and record why.
  - Keep one tiny uncompressed GLB per test fixture for Node tests (Draco and
    some compressed GLBs fail under `NullEngine`).
- **Curated set (target):**
  - Roads: straight, corner, T-junction, crossroads, end, crossing.
  - About 10 commercial and about 8 suburban buildings.
  - Props: lights, trees, benches, cones.
  - **6–8 cars** with visually distinct silhouettes.

  Output goes to `apps-games/city-drive/public/assets/models/`.
- **Manifest** `apps-games/city-drive/public/assets/manifest.json`: id, file,
  kind (`road|building|prop|car`), triangle count, byte size, bounding box,
  source pack, licence id. The build script generates it.
- **Budgets** (a script check, run in tests):
  - total model payload at most 8 MB
  - any building at most 3k triangles
  - any car at most 5k triangles
  - any road tile at most 500 triangles

  Report the actual totals in the evidence README.
- **Git weight:** commit only the curated outputs and licence files, not the
  raw zips. Add `apps-games/city-drive/assets-src/raw/` to `.gitignore`.

## Implementation Checklist

- [ ] Download the 4 Kenney packs to a scratch dir, verify CC0, and record
      SHA-256 hashes.
- [ ] Write `build-assets.ts` (idempotent), choose the curated set, and
      generate the GLBs and manifest.
- [ ] Self-host the meshopt decoder, or document the fallback to uncompressed.
- [ ] Write a Vitest budget test plus a manifest-schema test.
- [ ] Load one GLB per kind under `NullEngine` in a test (proves it parses).
- [ ] Evidence README: the chosen models list, totals, and licence table.
      Update `.agents/games/city-drive/assets-index.md`.

## Files Touched

- `apps-games/city-drive/{scripts/build-assets.ts,assets-src/LICENSES/**,public/assets/**,test/assets/**,package.json}`
- `.gitignore`, `bun.lock`
- `.agents/games/city-drive/assets-index.md`
- `.agents/resources/2026-10-15/city-drive-qa/04/README.md`

## Acceptance Criteria

- Every committed model traces to a CC0 licence record with a URL and hash.
- The budget and manifest tests pass, and the totals are within budget.
- No CDN URLs for decoders (`grep -rn "cdn.babylonjs.com" apps-games/city-drive/src` is empty).
- `bun run check:ci` passes. Large binaries are excluded from Biome, and
  secretlint does not choke on them.

## Out of Scope

- Rendering the city (task 06), audio (task 14), icons (task 18).

## Verification Commands

- `bun run --filter @city-drive/app build-assets` (or the script name chosen; must be idempotent: a second run gives no git diff)
- `bun run city-drive:test`
- `bun run check:ci`

## Commit message

`feat(city-drive): add cc0 kenney asset pipeline with budgets [17-city-drive/04]`

## Dry-run amendments (2026-10-15)

These come from the read-only dry-run review of this epic. **Where they conflict with anything above, these amendments win.**

- **Default to uncompressed GLB.** A few dozen Kenney models at 512 px are well under the 8 MB budget. Uncompressed GLB also loads under Node and `NullEngine`, which the budget tests in tasks 06, 09, 11, and 15 need. Use meshopt only if uncompressed exceeds the budget. In that case:
  - build-assets also emits an uncompressed test set (`assets-src/test-models/`, not shipped) for the Node tests
  - the decoder comes from an exact-pinned `meshoptimizer` dependency copied into `public/`, never the Babylon CDN
- **Fixed manifest ids**, which later tasks reference literally:
  - roads: `road-straight`, `road-corner`, `road-t`, `road-crossroads`, `road-end`, `road-crossing`
  - buildings: `bld-<kit>-<name>`
  - props: `prop-<name>`
  - cars: `car-<name>`

  Document the schema (`id`, `file`, `kind`, `triangles`, `bytes`, `bbox {min, max}`, `pack`, `licence`) in the evidence README, and write a test that checks every id matches this scheme.
