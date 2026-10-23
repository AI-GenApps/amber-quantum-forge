import { afterEach, describe, expect, it } from "vitest";
import { GAME_TITLE } from "../src/brand";
import { mountApp, type Rig } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

describe("lost-parcel-desk shell", () => {
  it("boots into the home screen through the kit", async () => {
    rig = await mountApp({ route: ["boot"] });
    await rig.settle();
    expect(rig.app.router.current.name).toBe("home");
    expect(rig.container.querySelector("[data-screen='home']")).not.toBeNull();
    expect(rig.container.querySelector("h1")?.textContent).toBe(GAME_TITLE);
    expect(document.getElementById("wg-kit-styles")).not.toBeNull();
  });
});
