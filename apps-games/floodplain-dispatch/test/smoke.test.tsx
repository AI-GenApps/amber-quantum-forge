import { injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../src/App";
import { GAME_TITLE } from "../src/brand";

describe("floodplain-dispatch title screen", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("renders the title through the kit", async () => {
    injectKitStyles();
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() => render(<App />, container));
    expect(container.querySelector("[data-screen='title']")).not.toBeNull();
    expect(container.querySelector("h1")?.textContent).toBe(GAME_TITLE);
    expect(container.querySelector("button")?.textContent).toBe("Coming soon");
    expect(document.getElementById("wg-kit-styles")).not.toBeNull();
  });
});
