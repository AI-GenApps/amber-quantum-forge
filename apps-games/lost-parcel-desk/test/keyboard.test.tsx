import { afterEach, describe, expect, it } from "vitest";
import { buttonByText, buttonStarting, click, mountApp, press, q, type Rig, text } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

/** Focuses a control and activates it the way a browser does for the Enter key. */
async function enter(r: Rig, el: Element): Promise<void> {
  (el as HTMLElement).focus();
  expect(document.activeElement).toBe(el);
  await press(el, "Enter");
  await click(el);
  await r.flush();
}

const key = (r: Rig, name: string) => press(document.body, name).then(() => r.flush());

describe("keyboard-only play of case 01", () => {
  it("reaches a 3-stamp reveal with Tab targets, arrows, F, M, P, L and A", async () => {
    rig = await mountApp();
    const r = rig;
    const c = r.container;

    await enter(r, buttonByText(c, "Case files"));
    await enter(r, q(c, "[data-case='01']"));
    await enter(r, buttonByText(c, "Open parcel"));
    expect(r.app.router.current.name).toBe("table");

    const scarf = q(c, "[data-object='01-2']");
    scarf.focus();
    await press(scarf, "ArrowRight");
    expect(document.activeElement).toBe(q(c, "[data-object='01-3']"));
    await press(document.activeElement as Element, "ArrowLeft");
    expect(document.activeElement).toBe(scarf);
    await press(scarf, "ArrowRight");
    await enter(r, q(c, "[data-object='01-3']"));
    expect(r.app.router.current).toMatchObject({ name: "viewer", params: { objectId: "01-3" } });

    await key(r, "p");
    expect(r.app.game.getState().active?.state.pinnedClueIds).toEqual(["01-c2"]);
    await key(r, "ArrowLeft");
    expect(r.app.router.current).toMatchObject({ params: { objectId: "01-2" } });

    await key(r, "m");
    expect(q(c, ".lp-mat").getAttribute("data-magnifier")).toBe("on");
    await enter(r, q(c, "[data-hotspot='01-c1']"));
    await key(r, "p");
    expect(r.app.game.getState().active?.state.pinnedClueIds).toEqual(["01-c2", "01-c1"]);
    await key(r, "f");
    expect(q(c, ".lp-mat").getAttribute("data-face")).toBe("back");
    expect(text(q(c, "[data-testid='face-text']"))).toContain("woven label");
    await key(r, "f");
    expect(q(c, ".lp-mat").getAttribute("data-face")).toBe("front");

    r.app.router.handleBack();
    await r.flush();
    await enter(r, buttonByText(c, "Deduction board"));
    expect(r.app.router.current.name).toBe("board");

    await enter(r, q(c, "[data-card='p01']"));
    const first = q(c, ".lp-pinned [data-clue='01-c2']");
    first.focus();
    await press(first, "ArrowRight");
    expect(document.activeElement).toBe(q(c, ".lp-pinned [data-clue='01-c1']"));
    for (const clueId of ["01-c1", "01-c2"]) {
      await enter(r, q(c, `.lp-pinned [data-clue='${clueId}']`));
      await key(r, "l");
      await enter(r, buttonByText(c, "Fits"));
    }
    expect(text(q(c, "[data-testid='summary-p01']"))).toBe("2 fit, 0 rule out");

    await key(r, "a");
    expect(text(q(c, "[role='dialog']"))).toContain("Accuse Odalie Fenn?");
    await enter(r, buttonByText(c, "Accuse"));

    expect(r.app.router.current.name).toBe("reveal");
    expect(text(q(c, "[data-testid='stamps-text']"))).toBe("3 of 3 stamps");
    expect(r.app.game.getState().profile.cases["01"]?.stamps).toBe(3);
  });

  it("asks for a hint with H and closes the sheet with Escape", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }] });
    await rig.flush();
    await key(rig, "h");
    const dialog = q(rig.container, "[role='dialog']");
    expect(text(dialog)).toContain("Buy a hint?");
    await press(dialog, "Escape");
    await rig.flush();
    expect(rig.container.querySelector("[role='dialog']")).toBeNull();
    expect(buttonStarting(rig.container, "Hint")).toBeTruthy();
  });

  it("ignores shortcuts typed into a dialog", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }] });
    await rig.flush();
    await key(rig, "h");
    const dialog = q(rig.container, "[role='dialog']");
    await press(dialog, "a");
    expect(rig.container.querySelectorAll("[role='dialog']")).toHaveLength(1);
  });
});
