---
epic: 15-ludo-launch
task: 29-human-acceptance-provisioning
status: pending
commit_scope: ludo
owner: human
depends_on: [15-ludo-launch/28-docs-and-release-checklist]
estimate: M
---

# Human acceptance and Firebase/device provisioning

## Goal

Execute the release checklist from task 28 on a real Firebase project and a
physical Android device. **This task requires a human with Firebase console
access, a physical Android device, and repo-deploy credentials — no agent
session can complete it**, matching the repo's precedent for the equivalent
Merge Relay/five-game physical-device and provider-provisioning gates
(`docs-internal/gaming/handoffs/merge-relay.md`'s "unresolved" store/
publisher gates, and the five-game epic's Android QA acceptance on a named
physical device/serial).

## Context/Decisions

- Every prior task (00-19) is written to pass fully — build, lint, test,
  validate — without any of the following, and this task exists precisely
  to cover what those tasks explicitly deferred:
  - A real Firebase project with Firestore enabled.
  - A registered Android app (`app.w3dev.ludo` and `app.w3dev.ludo.debug`)
    with a downloaded `google-services.json` placed where task 03/24's
    guarded initialization expects it.
  - A service account with IAM permissions sufficient for
    `packages/api/src/firebase/admin.ts`'s `FIREBASE_PROJECT_ID`/
    `FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` to authenticate as Admin
    SDK credentials, and for the Firestore adapter (task 22) to write match
    views.
  - `GAME_TOKEN_SECRET_LUDO_DEBUG`/`_STAGING`/`_PRODUCTION`,
    `GAME_TOKEN_ISSUER`, `GAME_TOKEN_AUDIENCE`, and `CRON_SECRET` configured
    in the real deployment environment (Vercel dashboard), not just as local
    test values.
  - The Drizzle migration from task 16 (and any follow-ups from tasks 20/21)
    actually applied to a real database via `db:push`/`db:migrate` — no
    prior task in this epic runs this.
  - A physical Android device (not an emulator) to build, install, and play
    through every mode: onboarding, vs Computer at each difficulty, Pass N
    Play with 2 and 4 seats, private room create/join across two physical
    devices, and random matchmaking (including a deliberate bot-fill
    scenario by waiting out the configured window) across two physical
    devices, including a deliberate backgrounding + reconnect during an
    active online match.
  - `bun run games:run -- --app ludo --device-id <physical-id>` and `bun run
    games:build -- --app ludo --platform android --mode release
    --environment debug` against the actual connected device — per
    `apps-native/games/AGENTS.md`, emulator/simulator IDs are refused
    (`NOT RUN`, exit code 2); only a physical device satisfies this.
- Record the device model/serial/Android version and every captured result
  in this task file's Acceptance section and in
  `docs-internal/gaming/handoffs/ludo.md`'s requirement ledger (task 28),
  the same way the five-game epic recorded `SM-A525F` /
  `RZ8R32EAB7T` / Android 14 for its physical acceptance.
- This task does not grant store publication. Store listing, publisher
  account, signing keys, and submission remain separate, explicitly
  unresolved gates — do not mark them complete here even if device
  acceptance passes.

## Implementation Checklist (human-executed)

- [ ] Create/select the Firebase project; enable Firestore; register the
  Android app twice (release + `.debug` suffix) and place the resulting
  `google-services.json`.
- [ ] Create a service account with the IAM roles `packages/api/src/
  firebase/admin.ts` needs; set `FIREBASE_PROJECT_ID`,
  `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in the deployment
  environment.
- [ ] Set `GAME_TOKEN_SECRET_LUDO_DEBUG`/`_STAGING`/`_PRODUCTION`,
  `GAME_TOKEN_ISSUER`, `GAME_TOKEN_AUDIENCE`, `CRON_SECRET` in the
  deployment environment.
- [ ] Apply the Ludo migration from task 16 (schema already includes
  `match_origin` and the rooms table, so no later task added a follow-up
  migration) to a real database with `cd packages/db && bun run db:push`
  (or `db:migrate`, per the project's chosen migration-apply convention)
  against that database only.
- [ ] Host the privacy policy drafted in task 27
  (`docs-internal/gaming/ludo-privacy-policy.md` or wherever task 27 placed
  it) at a real, publicly reachable URL, and complete the Play Console Data
  Safety form using task 27's data-safety draft as the source of truth.
- [ ] Prepare the Play Store listing assets (title, short/long description,
  screenshots, feature graphic, icon) from task 27's store listing text
  draft; this task uploads/configures them in Play Console but does not
  submit for review unless the human operator explicitly chooses to.
- [ ] Deploy the API/web app so the Vercel Cron sweeper (task 19) and
  Firestore fanout (task 22) run against real infrastructure.
- [ ] On a physical Android device, run `bun run games:build -- --app ludo
  --platform android --mode release --environment debug` and install/run
  it with `bun run games:run -- --app ludo --device-id <physical-id>`.
- [ ] Play through: onboarding (complete and skip paths), vs Computer at
  easy/medium/hard, Pass N Play with 2 and 4 local seats, a full local
  match to the results screen and a rematch.
- [ ] With a second physical device (or a second account on the same
  device, if two devices are unavailable — note which was used), verify:
  private room create + share-invite deep link + join, random matchmaking
  match-up, a deliberate bot-fill after the configured window, and
  backgrounding + reconnect mid-match.
- [ ] Record device model, serial, Android version, and a pass/fail per
  scenario above in this file and in the handoff's ledger.

### Economy provisioning (from task 26i)

- [ ] Create the real RevenueCat project, Play service account link, products, and
  offerings per `docs-internal/gaming/ludo-revenuecat-admob-runbook.md`.
- [ ] Create the real AdMob app, rewarded ad units, and SSV key per the same runbook.
- [ ] Host the updated privacy policy at a public URL and record it in
  `.agents/games/ludo-vortex/store-listing.md`.
- [ ] Complete the Play Data Safety form and content rating questionnaire using 26i's
  purchase / advertising-ID / simulated-gambling disclosures (answer bank:
  `.agents/games/ludo-vortex/store-listing.md`).
- [ ] Set the RevenueCat webhook secret and AdMob SSV key material in the real
  deployment environment.
- [ ] Verify one real sandbox/license-tester purchase (plus restore) and one real test
  rewarded-ad watch on the physical device (serial `RZ8R32EAB7T`) before marking economy
  provisioning complete; save captures under `.agents/resources/<date>/ludo-vortex-economy/device/`.

## Files Touched

- `tasks/epics/15-ludo-launch/29-human-acceptance-provisioning.md` (record
  results)
- `docs-internal/gaming/handoffs/ludo.md` (update ledger with verified
  rows and citations to this task's evidence)
- `tasks/epics/15-ludo-launch/STATUS.md` (mark task 29 and the epic
  complete once every scenario passes)

## Acceptance Criteria

- Every scenario in the checklist above has a recorded pass/fail with the
  device identity that produced it.
- No scenario is marked passed based on emulator/simulator output.
- Store publication is explicitly still marked unresolved regardless of
  device-acceptance outcome.
- The privacy policy is live at a real URL, the Play Console Data Safety
  form is completed, and store listing assets are uploaded/configured —
  each recorded with evidence (URL, screenshot, or console confirmation) in
  this file, without this constituting store submission.

## Verification Commands

- `bun run games:run -- --app ludo --device-id <physical-id>`
- `bun run games:build -- --app ludo --platform android --mode release --environment debug`
- `cd packages/db && bun run db:push` (against the real provisioned database only)

## Out of Scope

- Store submission, publisher account setup, and signing-key management.
- iOS provisioning (Android ships first per product decision; a future
  epic covers iOS).
- Any code change — this task is acceptance and provisioning only. If a
  real defect is found during play-through, file it as a new task rather
  than patching code inside this acceptance task.

## Commit message

`docs(ludo): record physical acceptance and firebase provisioning results [15-ludo-launch/29]`
