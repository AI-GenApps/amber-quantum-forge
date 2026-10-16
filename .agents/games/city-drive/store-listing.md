# Street Royale — store listing answer bank

Draft answers for Google Play Console (first) and App Store Connect (later).
This is a **skeleton written at task 00**; task 21 (release readiness) fills
and verifies every answer against the shipped code, and task 20 applies the
final name. Nothing below is final until then.

v1 is offline-only: no accounts, no ads, no in-app purchases, no network
calls. Listing copy must stay truthful to that.

## Identity

| Field | Answer |
|---|---|
| App name (30 chars max) | **Street Royale** (13 chars; picked at task 19, applied at task 20; trademark clearance still to do) |
| Package / bundle id | `app.w3dev.citydrive` (planned; confirmed in task 17) |
| Developer name / account | **TBD (human, task 22)** |
| Default language | **TBD (human)**; English (United States) expected |
| App or game | Game |
| Category | Racing or Simulation: **TBD (task 21)** |
| Free or paid | Free (no ads, no IAP in v1) |
| Contact email / website | **TBD (human)** |
| Privacy policy URL | **TBD (human, hosting; content in task 21)** |

## Listing copy (draft, not final)

- **Short description (80 chars max):** TBD (task 21). Draft angle: "Free-roam a low-poly city, take missions, unlock cars. No ads."
- **Full description (4000 chars max):** TBD (task 21). Must cover: free roam,
  four mission types (delivery, taxi, time trial, parking), three districts
  that unlock by stars, coins that unlock cars, offline play, no ads, no IAP,
  progress saved on the device.

## Declarations to answer in task 21

| Topic | Expected answer (verify against code in task 21) |
|---|---|
| Ads | No (no ad SDK in v1) |
| In-app purchases | No |
| Accounts / sign-in | None |
| Data collected or shared | None expected; the save stays on the device. Confirm no network call exists. |
| Permissions | None beyond normal Capacitor defaults; confirm in the built manifest (task 17 and 21) |
| Content rating | Expected low: cartoon driving, no violence or gambling. Questionnaire answered in task 21 |
| Target audience | Broad / all ages, to confirm in task 21 |
| Orientation | Landscape |

## Graphics (to produce)

| Asset | Spec | Source |
|---|---|---|
| App icon | 512x512 PNG for Play; iOS sizes via the asset catalog | Task 18 dry run, task 20 final |
| Feature graphic | 1024x500, no alpha | Task 21 |
| Phone screenshots | Landscape set | Taken by the human at task 22 (no browser or device QA by agents) |
