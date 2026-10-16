// @vitest-environment happy-dom
import { render } from "preact";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TouchInput } from "../../src/input";
import { GAME_TITLE } from "../../src/ui/brand";
import { mountUi } from "../../src/ui/mount";
import { makeApp, settle } from "./fakes";

let host: HTMLElement;

beforeEach(() => {
  host = document.createElement("div");
  document.body.appendChild(host);
  document.title = "";
});

afterEach(() => {
  render(null, host);
  host.remove();
});

describe("name on screen", () => {
  it("sets the document title to the name constant and renders it as the home wordmark", async () => {
    const app = await makeApp();
    const keys = { addEventListener: () => undefined, removeEventListener: () => undefined };
    const mounted = mountUi(
      host,
      {
        controller: app.controller,
        content: app.content,
        touch: new TouchInput(),
        minimap: () => undefined,
      },
      { onBack: () => () => undefined },
      keys,
    );
    await settle();
    expect(document.title).toBe(GAME_TITLE);
    const heading = host.querySelector("[data-testid=game-title]");
    expect(heading?.tagName).toBe("H1");
    expect(heading?.textContent).toBe(GAME_TITLE);
    expect(heading?.querySelector(".cd-wordmark-accent")?.textContent).toBe("Royale");
    expect(heading?.querySelector("img")?.getAttribute("alt")).toBe("");
    mounted.dispose();
  });
});
