# Epic 17 — owner decisions

## Task 19: name and icon (owner, 2026-10-16)

| Item | Choice |
|---|---|
| Public name | **Street Royale** |
| Icon | Direction 1 (hero car), variant **1b**: `.agents/resources/2026-10-15/city-drive-qa/18/icons/1b-hero-car-sunset.png` (teal coupe at sunset) |
| Icon changes requested | None |

### How the name was chosen

- The owner rejected the 8 task-18 shortlist names (Honkville, Tarmac Town, …) and asked for a
  **cool / premium** style instead of the cartoony one.
- The owner then said a matching `.com` / `.app` domain is **not required**, so domain availability
  is no longer a criterion.
- Round 2 (52 names) used the task-18 `namecheck.py` (Google Play plain and quoted, iTunes Search)
  plus a web search for an existing game with the same title. Evidence:
  `.agents/resources/2026-10-15/city-drive-qa/18/round-2/`.
- **Street Royale**: no exact or near title on Google Play or the App Store, and no game with that
  title on the web (closest: several unrelated "Street Kings" titles). Domains: `streetroyale.com`
  registered by someone else, `streetroyale.app` available (not needed).
- **Trademark: not checked** (USPTO/EUIPO not queryable headlessly). Run a formal clearance before
  store submission.

### Unchanged identifiers

- Registry id stays `city_drive`, knowledge-base slug stays `city-drive`, bundle id stays
  `app.w3dev.citydrive` unless task 20 decides otherwise and records why.

## Open owner feedback (2026-10-16, browser playtest)

- "The game looks good but the roads are not continuous, which needs to be fixed so it looks better
  and more real-world like." Headless checks found the road graph fully connected and every road model
  sharing one edge profile. The owner's screenshot showed most straight roads missing; root cause
  was thin-instance hosts sharing one geometry. Fixed in task 16a (`16a-road-thin-instance-fix.md`).
