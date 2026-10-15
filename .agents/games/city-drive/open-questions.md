# City Drive — open questions and launch blockers

| # | Question / blocker | Owner | Blocks |
|---|---|---|---|
| 1 | **Public name.** "City Drive" is a working title. Task 18 proposes candidates that pass a strict uniqueness check; the human picks at task 19. | user | branding (task 20), listing, everything downstream of the name |
| 2 | **Icon direction.** Task 18 produces an icon dry run; the human picks the direction at task 19. | user | final icon and splash (task 20) |
| 3 | **Web hosting: Vercel project.** The browser build needs a Vercel project and its GitHub Actions deploy secrets; agents never deploy. Provisioned at human task 22. | user | web release |
| 4 | **Real-device performance on low-end Android.** No device exists on the build server, so frame rate against the 100 draw call / 150k triangle budget is only proven headlessly. Measured on a real device at human task 22 (with the playtest at task 16 for browsers). | user | Android release |
| 5 | **Play developer account owner, signing key, iOS provisioning.** Which account submits; keystore and certificates stay outside the repo. | user | store release (task 22) |
| 6 | **Support contact, privacy-policy URL host.** Needed for the store listing and the policy page (task 21). | user | listing |
| 7 | ~~**Mirrored screen (task 07 finding).**~~ **RESOLVED in task 08a (2026-10-15).** Every scene is now right-handed (`scene.useRightHandedSystem = true` via `render/scene.ts`), matching the simulation. The steer negation is gone, the road yaw offsets and glTF winding were re-derived, and headless tests project points through the chase camera. The mirrored look is no longer a task 08 sign-off item (the human still judges the look by eye). Evidence: `.agents/resources/2026-10-15/city-drive-qa/08a/README.md`. | user | none (resolved) |
| 8 | **Gamepad is untested on hardware.** The mapping is unit-tested with a fake pad only. | user | task 16 |

