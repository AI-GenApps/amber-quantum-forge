# Web games kit — open questions

| Question | Owner | Blocks |
|---|---|---|
| Does `linear()` easing from `springEasing` run on the target Android WebView version? Falls back to the final frame only when `animate` is missing, not when `linear()` is unsupported. Owner browser QA decides. | owner | nothing |
| `neutralTheme` uses `sans-serif`; each game must replace font tokens with its bundled OFL fonts and prove it with `assertNoPlatformFontFallback`. | game epics 19-24 | game acceptance |
