import "../ui/tokens.css";
import "./unsupported.css";

export const UNSUPPORTED_ID = "cd-unsupported";

/**
 * Replaces the game with a plain message. Built with DOM calls only (no Preact, no Babylon), so it
 * works when nothing else could start. The `reason` is shown as a small detail line.
 */
export function showUnsupported(root: HTMLElement, title: string, reason: string): HTMLElement {
  const doc = root.ownerDocument;
  const screen = doc.createElement("section");
  screen.id = UNSUPPORTED_ID;
  screen.className = "cd-unsupported";
  screen.setAttribute("role", "alert");
  const body = doc.createElement("div");
  const heading = doc.createElement("h1");
  heading.textContent = `${title} cannot start here`;
  const advice = doc.createElement("p");
  advice.textContent =
    "The game needs WebGL2 for its 3D graphics. Try an up-to-date Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is turned on.";
  const detail = doc.createElement("p");
  detail.textContent = reason;
  body.append(heading, advice, detail);
  screen.append(body);
  root.replaceChildren(screen);
  return screen;
}
