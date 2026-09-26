# Merge Relay brand — device check (2026-09-26)

Samsung SM-A525F (RZ8R32EAB7T), debug build `app.w3dev.mergerelay.debug` from commit 607977b.

| File | Shows | Assessment |
|---|---|---|
| `01-home.png` | Home screen after launch | Stacked ringed logo renders in the hero card (crisp, alpha OK). Header wide logo renders but is **too small to read** (~100 px wide) — follow-up. Rest of the UI is the old flat light theme and clashes with the glossy logo — expected until Merge Relay's visual overhaul. |
| `02-launcher-home.png` | Home screen after pressing HOME | reference |
| `03-app-drawer-search.png` | App drawer search "merge" | New glossy icon on "Merge Relay" (debug build, plus a Samsung dual-app copy with badge). "Merge Relay QA" entries are older QA-flavour installs still showing the old placeholder icon. |

Follow-ups: enlarge/replace the header wide logo (or drop it in favour of the hero); restyle the app in the glossy direction (future overhaul epic); reinstall/remove stale QA-flavour builds.
