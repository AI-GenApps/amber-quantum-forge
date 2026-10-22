# Web games kit — knowledge base

Single source of truth for `@web-games/kit` (`apps-games/web-kit`), the framework code shared by
the six web games (epics 19 to 24). Keep it current: every decision or number change is updated
here in the same commit. Evidence lives under `.agents/resources/2026-10-23/web-games/web-games-kit/`.

| File | Use it to answer |
|---|---|
| [`product.md`](product.md) | What the kit is, its 14 modules, and the contracts games rely on |
| [`economy.md`](economy.md) | Monetization status (none in v1) |
| [`store-listing.md`](store-listing.md) | Not applicable (the kit is not a listed app); data and privacy facts it guarantees |
| [`assets-index.md`](assets-index.md) | Where code, tests, evidence and licences are |
| [`decisions-log.md`](decisions-log.md) | Dated decisions, including the dependency pins |
| [`open-questions.md`](open-questions.md) | Unresolved items |

## Quick facts

| | |
|---|---|
| Package | `@web-games/kit`, `apps-games/web-kit`, private, source consumed directly |
| Stack | TypeScript 5.9.3, Preact 11.0.1, Vitest 5.0.5 (happy-dom 21.0.1), Capacitor 8 plugins |
| Modules | rng, daily, save, settings, audio, haptics, share, lifecycle, router, ui, fonts, assets, motion, strings |
| Tests (task 01) | 21 test files, 243 tests, all headless (no browser, no screenshots) |
| Epic | `tasks/epics/18-web-games-kit/` |
| Status (2026-10-23) | Task 01 implemented: package, tests, README. Skeletons (02) and CI/docs (03) pending |
