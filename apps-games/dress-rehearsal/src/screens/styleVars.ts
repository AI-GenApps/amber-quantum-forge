import { ACCENT_VAR } from "../theme/tokens";

/** Inline style that scopes the chapter accent to a subtree. */
export function accentStyle(accent: string): Record<string, string> {
  return { [ACCENT_VAR]: accent };
}
