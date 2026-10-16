# Street Royale icon, adaptive pair and splash (task 20)

Owner pick at task 19: direction 1, variant 1b (teal coupe at sunset), **no changes requested**.

## Files

| File | What |
|---|---|
| `source/1b-hero-car-sunset.png` | The task-18 draft the owner picked (1024x1024, generated 2026-10-16; prompt in `../../city-drive-qa/18/icon-prompts.json`, id `1b`). |
| `source/foreground-raw-magenta.png` | New hero car alone on flat `#FF00FF`, generated for the adaptive foreground (see the log below). |
| `source/foreground-prompt.txt` | The exact prompt text for that image. |
| `final-icon.png` | Master icon: 1b resized to 1024x1024, flattened, RGB, **no alpha** (iOS). Copy of `apps-games/city-drive/resources/icon.png`. |
| `final-icon-foreground.png` | Adaptive foreground: keyed car, 820 px wide, centred on a transparent 1024x1024 canvas. |
| `final-icon-background.png` | Adaptive background: solid `#1b2a55`, 1024x1024. |
| `splash.png`, `splash-dark.png` | 2732x2732, car and the name in Russo One centred on `#1b2a55` / `#0b1020`. |

All of them are rebuilt by `bun run --filter @city-drive/app brand:assets` (builder:
`apps-games/city-drive/scripts/build-brand-art.ts`; keying: `scripts/brand-art/key.ts`).

## Image generation log

| Field | Value |
|---|---|
| Date | 2026-10-16 |
| Skill / tool | generate-image skill: `codex exec --dangerously-bypass-approvals-and-sandbox -C /data/tools/tmp/20/gen "<instruction + prompt>. Save ... to EXACTLY this absolute path"` |
| Model (codex header) | `gpt-6.1-sol`, reasoning effort high, built-in image tool |
| Smoke test | The first and only image was the real asset (one image per run); it succeeded: 1024x1024 PNG, uniform `#FF00FF` background. No retry was needed. |
| Params | requested 1024x1024 square; the tool returned 1024x1024 |
| Prompt | see `source/foreground-prompt.txt` |

## Keying and checks

Magentaness = `min(r, b) - g`; alpha ramps from 1 to 0 as it goes from 24 to 224, and the key colour is
subtracted from the edge pixels (despill). Teal, red-orange, dark grey and the blue-grey windows all
score about 0, so nothing from the car is lost. `test/ui/icons.test.ts` checks the corners are fully
transparent, the car fits the safe zone (width at most 822 px, farthest corner inside the 1024 circle), and
the background is one solid colour.

## Known judgement call for the owner

The foreground car is a fresh generation, not a cut-out of the 1b scene (1b is a full scene with sky and
skyline; it cannot be split into layers). It is the same idea (teal low-poly coupe, rear three-quarter) but
the body shape differs slightly from the 1b hero car. If the owner wants the exact 1b car as the foreground,
that is a follow-up image task. The launcher icon on iOS and the store icon use 1b itself.
