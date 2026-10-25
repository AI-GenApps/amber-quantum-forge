# Lost Parcel Desk

Bite-sized detective stories at a small-town post office: examine what is inside each lost parcel and
work out who it belongs to.

- Status: v1 complete, pending owner QA. Tasks 00 to 08 of epic 24 are built: knowledge base, core rules engine, full content and validators, progression / economy / Daily Parcel / versioned save, all 18 screens with fonts and accessibility, CC0 audio with haptics and onboarding, the reviewed designer art (63 of 67 slots; `key-art`, `evidence-04-3`, `evidence-08-1` and `townsfolk-9` keep code-drawn placeholders, see `open-questions.md` Q19), Capacitor Android and iOS projects, and the release budgets, audits and owner QA checklist (task 08). Nothing was seen in a browser or on a device: the owner runs `.agents/resources/2026-10-23/web-games/lost-parcel-desk/qa-checklist.md`. No store submission.
- Epic: [`tasks/epics/24-web-lost-parcel-desk`](../../../tasks/epics/24-web-lost-parcel-desk/STATUS.md)
- Code: `apps-games/lost-parcel-desk` (`@web-games/lost-parcel-desk`) and
  `apps-games/lost-parcel-desk-core` (`@web-games/lost-parcel-desk-core`).
- Shared kit: [`.agents/games/web-games-kit/`](../web-games-kit/README.md)

## Quick facts

| Fact | Value |
|---|---|
| Slug / epic | `lost-parcel-desk` / 24 |
| Working title (public name in v1) | Lost Parcel Desk |
| App id | `app.w3dev.lostparceldesk` |
| Dev port | 4016 |
| Platforms | Android and iOS (Capacitor 8), plus browser; portrait only |
| Stack | TypeScript, Preact, Vite, Vitest, DOM/SVG/Canvas 2D, Capacitor 8 |
| Genre | Detective deduction: inspect evidence, pin clues, link them to a townsperson, accuse |
| Campaign | 3 chapters x 4 cases = 12 cases, 36 stamps, 5 to 8 minutes per case |
| Evidence | 49 objects (11 cases x 4, case 12 x 5); 70 clues (33 lead, 37 flavour); 24 deductions (12 direct, 9 key-and-lock pairs, 3 rule-outs) |
| Cast | 12 townsfolk, one parcel each; 4 logic facets (street, pastime, look, pet) x 6 values; trade is identity only |
| Case logic | 3 candidates, exactly one satisfies every deduction, every deduction necessary, flavour never separates the candidates (validator) |
| Stamps | 3 minus wrong accusations (3, 2 or 1 per case); accusing needs 2 linked "fits" clues |
| Chapter unlocks | Chapter 2 at 7 stamps, chapter 3 at 18 stamps |
| Meta-story | Mr. Hobb's flood-night ledger, 12 fragments, one per closed case; 12-place town map fills in |
| Daily | Daily Parcel generated per local date (3 to 5 objects), weekday ladder, streak, validated over 365 dates |
| Currency | postage (450 from the campaign), spent on hints (20 / 15) and streak freezes (30) |
| Themes / achievements | 5 desk themes (0 to 33 stamps), 12 achievements (no reward) |
| Fonts | Courier Prime (display), IBM Plex Sans (body), OFL |
| Audio | CC0 only: 27 sounds and 2 music loops shipped, 29 Ogg files (`assets-index.md`) |
| Art | 67 designer slots: B1 4, B2 to B5 48 evidence objects, B6 15 (12 portraits, 2 parcels, feature graphic); 63 accepted (61 runtime WebP files), 4 rejected with code-drawn placeholders |
| Budgets | JS bundle <= 300 KB gzip excluding art; art <= 8 MB; fonts <= 300 KB; audio <= 2 MB (enforced by `test/budgets.test.ts`; measured 75 KB gzip JS, 1.76 MB art, 78 KB fonts, 892 KB audio) |
| Monetization | none in v1 |
| Data collected | none |

## Files in this knowledge base

| File | Contents |
|---|---|
| `product.md` | Precise loop, rules, screens, controls, onboarding, accessibility, palette |
| `economy.md` | Currencies, sources, sinks, numbers |
| `content-plan.md` | All 12 cases with evidence objects, clues and logic, 12 townsfolk, almanac, ledger, achievements, themes, daily template bank |
| `store-listing.md` | Draft store answers, data safety |
| `assets-index.md` | Art slots, fonts, audio plan, where things live |
| `decisions-log.md` | Dated decisions and rationale |
| `open-questions.md` | Open items |
