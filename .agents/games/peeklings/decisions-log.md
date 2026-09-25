# Peeklings (SnapQuest) — decisions log

| Date | Decision | Rationale / notes |
|---|---|---|
| 2026-09-25 | Status for wave 2 and beyond: **parked.** Only custom fonts are added (task 04); public name stays **Peeklings**, internal identifier stays `snapquest` | Portfolio audit: "blocked on an unproven tech bet (on-device color/object recognition)." Recognition doesn't work on device (`descriptorId=null`); desk mode alone is the only proven loop. Source: `.agents/resources/2026-09-25/games-portfolio-audit/README.md` |
| 2026-09-25 | Public name confirmed as **Peeklings** (no rename); "SnapQuest" must never be used publicly | "SnapQuest" is taken many times across App Store/Play/Steam; "Peeklings" had no exact match and is the best name in the portfolio. Source: same audit, and `docs-internal/gaming/handoffs/snapquest.md` |
| 2026-09-25 | Custom fonts: **Baloo 2** display / **Andika** body | "Playful rounded; Andika is designed for early readers" — matches the young target audience. Source: `tasks/epics/16-games-portfolio-wave2/STATUS.md` font table; `github.com/google/fonts/tree/main/ofl/baloo-2`, `.../andika` (verified to exist 2026-09-25) |
| 2026-09-25 | Epic-wide decision applies: work stays on `main`, one commit per task, never push | Source: `tasks/epics/16-games-portfolio-wave2/STATUS.md`, "Decisions (user, 2026-09-25)" |
