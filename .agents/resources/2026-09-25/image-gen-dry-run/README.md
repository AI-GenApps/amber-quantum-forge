# image-gen dry run — 2026-09-25

This folder is the smoke test of the `image-gen` shell function (a
`codex exec` wrapper, default model `gpt-6-luna`) before epic 16's art
tasks.

| File | Prompt (summary) | Result |
|---|---|---|
| `tile-character-smoke.png` | A single cozy rounded tile character (cream and coral card, dot eyes, smile), warm hand-made style, flat pastel background, no text | 1254×1254 RGB, generated in 68 s, on-brief and original. No alpha channel was requested. |

Usage: `image-gen --prompt "<prompt>"` prints the PNG path under
`/root/.codex/generated_images/`. The alternate model is
`--model gpt-6-astra`. See `tasks/epics/16-games-portfolio-wave2/STATUS.md`
("Image generation").
