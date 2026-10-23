import { afterEach, describe, expect, it } from "vitest";
import { GAME_TITLE } from "../src/brand";
import { createTestEnv, mountApp, removeAnimate } from "./helpers/env";

describe("lantern-loops app shell", () => {
  afterEach(() => {
    document.body.replaceChildren();
    removeAnimate();
  });

  it("renders the home screen with the game title and kit styles", async () => {
    const { env } = await createTestEnv({ fixture: "mid" });
    const app = await mountApp(env);
    expect(app.container.querySelector("[data-screen='home']")).not.toBeNull();
    expect(app.container.querySelector("h1")?.textContent).toBe(GAME_TITLE);
    expect(document.getElementById("wg-kit-styles")).not.toBeNull();
    expect(document.getElementById("ll-game-styles")).not.toBeNull();
    app.unmount();
  });
});
