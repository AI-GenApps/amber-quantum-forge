# City Drive — open questions and launch blockers

| # | Question / blocker | Owner | Blocks |
|---|---|---|---|
| 1 | **Public name.** "City Drive" is a working title. Task 18 proposes candidates that pass a strict uniqueness check; the human picks at task 19. | user | branding (task 20), listing, everything downstream of the name |
| 2 | **Icon direction.** Task 18 produces an icon dry run; the human picks the direction at task 19. | user | final icon and splash (task 20) |
| 3 | **Web hosting: Vercel project.** The browser build needs a Vercel project and its GitHub Actions deploy secrets; agents never deploy. Provisioned at human task 22. | user | web release |
| 4 | **Real-device performance on low-end Android.** No device exists on the build server, so frame rate against the 100 draw call / 150k triangle budget is only proven headlessly. Measured on a real device at human task 22 (with the playtest at task 16 for browsers). | user | Android release |
| 5 | **Play developer account owner, signing key, iOS provisioning.** Which account submits; keystore and certificates stay outside the repo. | user | store release (task 22) |
| 6 | **Support contact, privacy-policy URL host.** Needed for the store listing and the policy page (task 21). | user | listing |
| 7 | **Mirrored screen (task 07 finding).** The sim is right-handed, Babylon left-handed, so the city appears mirrored against the map's compass description and right-hand traffic shows on the screen's left. Steering is already corrected. Decide at task 08 whether to accept this or mirror the whole scene (touches the task 06 renderer). | user | task 08 sign-off |
| 8 | **Gamepad is untested on hardware.** The mapping is unit-tested with a fake pad only. | user | task 16 |

