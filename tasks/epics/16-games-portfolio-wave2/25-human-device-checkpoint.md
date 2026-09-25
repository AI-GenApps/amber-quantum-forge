---
epic: 16-games-portfolio-wave2
task: 25-human-device-checkpoint
status: pending
commit_scope: merge-relay
owner: human
depends_on: [16-games-portfolio-wave2/24-mr-release-readiness]
estimate: M
---

# HUMAN: device checkpoint and provisioning

**The workflow stops here.** This server has no phone attached. Every
earlier task was verified with tests and headless goldens only.

## Goal

Play the renamed Merge Relay on a real Android phone. Check that the fonts
in all five games look right on the device. Either sign off or file a fix
list. Then complete the credential-only release steps.

## Checklist

- [ ] Build the debug APKs (`bun run games:build -- --app <id> --platform android --mode debug --environment debug`)
      for merge_relay, pocket_biome, sixty_second_heist, meme_court, and
      snapquest. Copy them to a machine with the phone and `adb install -r`
      each one.
- [ ] Merge Relay: fresh install → welcome → tutorial → clear chapter 1 →
      Daily → Endless to game over. Kill mid-run and relaunch. Toggle every
      setting. Check the sound, music, haptics, and animation feel against
      Threes! on the same phone if possible. Capture screenshots
      (`adb exec-out screencap -p`) into
      `.agents/resources/<date>/merge-relay-device-qa/`.
- [ ] Other four apps: open each, confirm the custom fonts render with no
      clipping, and capture one screenshot each.
- [ ] Record cold start time and any jank.
- [ ] Decide the open questions: crash-reporting vendor, the privacy-policy
      host URL, the support email, and the Play developer account.
- [ ] Create the upload keystore (per the task 24 guide) outside git. Build
      a signed AAB, upload it to an internal testing track, and install it
      from Play.
- [ ] Sign off, or write the fix list as new tasks (e.g. `26-…`) in this epic.

## Acceptance Criteria

- Device screenshots are committed, the sign-off or fix list is recorded in
  `.agents/games/merge-relay/decisions-log.md`, and STATUS.md is updated.

## Commit message

`docs(merge-relay): record device checkpoint results [16-games-portfolio-wave2/25]`
