---
epic: 16-games-portfolio-wave2
task: 18-mr-apply-name
status: pending
commit_scope: merge-relay
depends_on: [16-games-portfolio-wave2/17-human-name-and-direction-pick]
estimate: M
owner: agent
---

# Merge Relay: apply the chosen brand name

## Goal

Change every **user-visible** name to the chosen name
(`tasks/epics/16-games-portfolio-wave2/decisions.md` → `merge_relay_name`),
while keeping the internal id `merge_relay`, the bundle ids
`app.w3dev.mergerelay(.debug)`, the save and analytics namespaces, and the
folder names.

## Context / Decisions

- Precedent: Ludo's rename commit `e7385da` ("adopt Ludo Vortex brand").
  Read it with `git show --stat e7385da` and follow the same steps.
- Source of truth: `scripts/games/registry-games.ts` (`canonicalName`,
  `publicTitle`, `subtitle` for the merge_relay entry) →
  `bun run games:codegen` regenerates `game.config.json` and
  `platform_core`'s `game_app_registry.dart`. Then run `bun run games:native`
  if the Android label or iOS display name needs it (see
  `apps-native/games/AGENTS.md`: never hand-edit the generated
  `.xcodeproj`).
- In-app strings: title text on the welcome/home screens, and any
  hard-coded "Merge Relay"/"MERGE RELAY" in `lib/`. Leave v1.1 relay copy
  that sits behind the social gate untouched, but list it in the evidence
  README.
- Fix the pre-existing `games:icons:check` failure (task 02 baseline):
  `scripts/games/icons.ts` `updateAndroidLabel` must accept Merge Relay's
  `android:label="${mergeRelayAppLabel}"` placeholder when the Gradle
  config resolves the production label to `publicTitle`. Otherwise it
  should check the resolved value. Add a case to `scripts/games/icons.test.ts`.
- Subtitle: write a new store-style subtitle (≤ 30 chars) with no relay or
  friend promise, e.g. about merging tiles and rescuing boards.
- Update `.agents/games/merge-relay/README.md`, the handoff's dated section,
  and the store-listing skeleton to use the new name.

## Implementation Checklist

- [ ] Edit the registry, then run codegen (and native if needed).
- [ ] Update the in-app strings, and update tests that assert the old title.
- [ ] Update goldens that show the title, then VIEW them.
- [ ] Record `grep -rn "Merge Relay" apps-native/games/merge_relay/lib` before
      and after in `.agents/resources/2026-09-25/games-wave2-qa/18/README.md`,
      justifying every remaining hit (internal or gated).

## Files Touched

- `scripts/games/{icons.ts,icons.test.ts}` (label placeholder fix)
- `scripts/games/registry-games.ts` and the generated config/registry files
- `apps-native/games/merge_relay/{lib/**,test/**,android/app/src/main/**,ios/project.yml}` (label only)
- `.agents/games/merge-relay/*.md`, `docs-internal/gaming/handoffs/merge-relay.md`

## Acceptance Criteria

- `game.config.json` has `publicTitle` = the chosen name, and the Android
  launcher label and iOS display name match.
- Bundle ids and namespaces are unchanged (`git diff` shows no change to the
  ids).
- `games:validate:strict` passes, and all tests pass.

## Verification Commands

- `bun run games:codegen`
- `bun run games:validate:strict`
- `bun run games:icons:check`
- `bun test scripts/games/icons.test.ts`
- `bun run games:format:check`
- `bun run games:analyze -- --app merge_relay`
- `bun run games:test -- --app merge_relay`
- `bun run check`
- `bun run typecheck`
- `bun run games:build -- --app merge_relay --platform android --mode debug --environment debug`

## Out of Scope

- The logo (task 19 onward). Changing ids or namespaces.

## Commit message

`feat(merge-relay): adopt the chosen brand name [16-games-portfolio-wave2/18]`
