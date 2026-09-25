# image-gen dry run — 2026-09-25

This folder is the smoke test of the `image-gen` shell function (a
`codex exec` wrapper, default model `gpt-6-luna`) before epic 16's art
tasks.

| File | Prompt (summary) | Result |
|---|---|---|
| `tile-character-smoke.png` | A single cozy rounded tile character (cream and coral card, dot eyes, smile), warm hand-made style, flat pastel background, no text | 1254×1254 RGB, generated in 68 s, on-brief and original. No alpha channel was requested. |
| `tile-character-transparent-ref.png` | The same style, passing `tile-character-smoke.png` **by absolute path in the prompt** as a reference; a mint sleepy variant, "fully TRANSPARENT background (PNG with alpha)" | 1254×1254 **RGBA** with real alpha (~40% of pixels fully transparent), and the style carried over from the reference. Caveat: a thin bright-green fringe on the outer edge (background-removal artifact), which needs a Pillow edge cleanup (erode the alpha 1–2 px and de-fringe). |

Usage: `image-gen --prompt "<prompt>"` prints the PNG path under
`/root/.codex/generated_images/`. The alternate model is
`--model gpt-6-astra`. See `tasks/epics/16-games-portfolio-wave2/STATUS.md`
("Image generation").
