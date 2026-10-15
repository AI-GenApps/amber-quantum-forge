---
epic: 17-city-drive
task: 22-human-device-checkpoint
status: pending
commit_scope: city-drive
depends_on: [17-city-drive/21-release-readiness]
estimate: M
owner: human
---

# HUMAN: device checkpoint, Vercel project, store provisioning

## Checklist

- [ ] **Android device:** install the debug APK from task 17 (rebuild with
      `bun run city-drive:android:debug`) on a **low-end** and a mid-range phone.
      For each, record:
  - [ ] FPS in each district (`?fps`-equivalent overlay; in debug builds,
        enable it from settings if the URL flag isn't available)
  - [ ] the quality tier the governor settles on
  - [ ] thermal throttling after 15 minutes
  - [ ] load time
  - [ ] memory
- [ ] Verify: landscape lock, back button, pause/resume, save after force-kill,
      audio unlock, haptics, notch and safe areas.
- [ ] **iOS** (on a Mac with Xcode 26): `bun run city-drive:cap:sync`, open
      `apps-games/city-drive/ios`, run it on a device, and check the same list.
- [ ] Capture the store screenshots per the task 21 plan.
- [ ] **Web:**
  - [ ] Create a Vercel project for the game.
  - [ ] Add the `CITY_DRIVE_VERCEL_PROJECT_ID` secret.
  - [ ] Run the `deploy-city-drive-web.yml` workflow from GitHub Actions
        (never `vercel --prod`).
  - [ ] Smoke-test the URL on desktop and on a phone.
- [ ] **Stores:**
  - [ ] Create the Play Console app (`app.w3dev.citydrive`) and generate the
        upload keystore; store it outside the repo.
  - [ ] Create the App Store Connect record.
  - [ ] Fill in the listing, data safety, and rating from `store-listing.md`.
  - [ ] Internal testing track upload.
- [ ] Record the results, numbers, and a fix list in
      `.agents/games/city-drive/decisions-log.md`. Create fix tasks if needed.
- [ ] Mark this task `[x]` in STATUS.md. If there are no fix tasks, tick epic
      17 in `tasks/STATUS.md` and commit
      (`docs(tasks): mark epic 17 complete [tasks/status]`).

## Acceptance Criteria

- The device numbers are recorded per device and district.
- The web deploy succeeded via GitHub Actions.
- The store records exist, or their blockers are recorded.
