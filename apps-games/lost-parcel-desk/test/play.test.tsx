import { getCase, LEDGER } from "@web-games/lost-parcel-desk-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  buttonByText,
  buttonStarting,
  click,
  mountApp,
  q,
  qa,
  type Rig,
  tap,
  tapStarting,
  text,
} from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

async function back(r: Rig): Promise<void> {
  r.app.router.handleBack();
  await r.flush();
}

async function openCase01(): Promise<Rig> {
  const r = await mountApp();
  await tap(r, "Case files");
  await click(q(r.container, "[data-case='01']"));
  await r.flush();
  await tap(r, "Open parcel");
  return r;
}

/** Finds and pins both lead clues of case 01 by pointer: the glove cuff and the copper hair. */
async function pinLeadClues(r: Rig): Promise<void> {
  await click(q(r.container, "[data-object='01-3']"));
  await r.flush();
  await tapStarting(r, "Pin");
  await tap(r, "Previous object");
  await tap(r, "Magnifier on");
  await click(q(r.container, "[data-hotspot='01-c1']"));
  await r.flush();
  await tapStarting(r, "Pin");
}

async function linkFits(r: Rig, clueId: string, personId: string, kind = "Fits"): Promise<void> {
  await click(q(r.container, `.lp-pinned [data-clue='${clueId}']`));
  await click(q(r.container, `[data-card='${personId}']`));
  await r.flush();
  await tap(r, kind);
}

describe("case 01 by pointer", () => {
  it("goes Home, Files, Intro, Table, Viewer, Board and Reveal with 3 stamps", async () => {
    rig = await openCase01();
    const c = rig.container;
    expect(rig.app.router.current.name).toBe("table");
    await pinLeadClues(rig);
    expect(rig.app.router.current.name).toBe("viewer");
    expect(rig.app.game.getState().active?.state.pinnedClueIds.sort()).toEqual(["01-c1", "01-c2"]);

    await back(rig);
    expect(rig.app.router.current.name).toBe("table");
    await tap(rig, "Deduction board");
    expect(rig.app.router.current.name).toBe("board");
    expect(qa(c, ".lp-pcard")).toHaveLength(3);

    await linkFits(rig, "01-c1", "p01");
    await linkFits(rig, "01-c2", "p01");
    expect(text(q(c, "[data-testid='summary-p01']"))).toBe("2 fit, 0 rule out");
    expect(text(q(c, "[data-testid='board-live']"))).toContain("Odalie: 2 clues fit, 0 rule out.");

    await click(q(c, "[data-card='p01']"));
    await tapStarting(rig, "Accuse Odalie");
    expect(text(q(c, "[role='dialog']"))).toContain("Accuse Odalie Fenn?");
    await tap(rig, "Accuse");

    expect(rig.app.router.current).toMatchObject({ name: "reveal", params: { caseId: "01" } });
    expect(rig.app.router.stack.map((entry) => entry.name)).toEqual(["home", "files", "reveal"]);
    expect(text(q(c, "[data-testid='headline']"))).toBe("Delivered with a flourish");
    expect(text(q(c, "[data-testid='delivered-to']"))).toBe(
      "Delivered to Odalie Fenn, ferry pilot.",
    );
    expect(text(q(c, "[data-testid='stamps-text']"))).toBe("3 of 3 stamps");
    expect(text(q(c, "[data-testid='typewriter-full']"))).toBe(getCase("01")?.reveal);
    expect(text(q(c, "[data-testid='fragment-text']"))).toBe(LEDGER[0]?.text);
    expect(text(q(c, "[data-testid='map-note']"))).toBe(
      "Ferry Landing is filled in on the town map.",
    );
    expect(text(q(c, "[data-testid='gains']"))).toContain("Postage earned: 25");
    const profile = rig.app.game.getState().profile;
    expect(profile.cases["01"]?.stamps).toBe(3);
    expect(profile.postage).toBe(55);
    expect(profile.session).toBeNull();
    await rig.flush();
    expect(
      profile.ledgerSeen["01"] === true ||
        rig.app.game.getState().profile.ledgerSeen["01"] === true,
    ).toBe(true);
  });

  it("shows the achievement toast and shares the result", async () => {
    rig = await openCase01();
    await pinLeadClues(rig);
    await back(rig);
    await tap(rig, "Deduction board");
    await linkFits(rig, "01-c1", "p01");
    await linkFits(rig, "01-c2", "p01");
    await click(q(rig.container, "[data-card='p01']"));
    await tapStarting(rig, "Accuse Odalie");
    await tap(rig, "Accuse");
    expect(q(rig.container, "[role='status'].wg-toast").textContent).toContain(
      "Achievement: First Delivery",
    );
    await tap(rig, "Share");
    expect(rig.shared[0]?.text).toBe(
      'Lost Parcel Desk - Case 01 "The Seaside Postcard": 3/3 stamps, no hints.',
    );
    expect(text(q(rig.container, "[data-testid='share-status']"))).toBe("Shared.");
  });

  it("goes on to the next case and replays this one from the reveal", async () => {
    rig = await mountApp({ route: ["table", { caseId: "01" }] });
    await rig.flush();
    await click(q(rig.container, "[data-object='01-3']"));
    await rig.flush();
    await tapStarting(rig, "Pin");
    await tap(rig, "Next object");
    await back(rig);
    // cheat the rest through the store, then look at the reveal screen
    const game = rig.app.game;
    await game.inspect("01-2");
    await game.zoom("01-c1");
    await game.pin("01-c1");
    for (const clue of ["01-c1", "01-c2"]) await game.link(clue, "p01", "fits");
    const outcome = await game.accuse("p01");
    expect(outcome.ok && outcome.closed).toBe(true);
    rig.app.router.push("reveal", { caseId: "01" });
    await rig.flush();
    expect(buttonByText(rig.container, "Next case")).toBeTruthy();
    await tap(rig, "Replay for more stamps");
    expect(rig.app.router.current).toMatchObject({ name: "table", params: { caseId: "01" } });
    expect(rig.app.game.getState().active?.state.foundClueIds).toEqual([]);
    rig.app.router.push("reveal", { caseId: "01" });
    await rig.flush();
    await tap(rig, "Next case");
    expect(rig.app.router.current).toMatchObject({ name: "intro", params: { caseId: "02" } });
  });
});

describe("wrong accusations", () => {
  async function toBoard(): Promise<Rig> {
    const r = await openCase01();
    await pinLeadClues(r);
    await back(r);
    await tap(r, "Deduction board");
    return r;
  }

  it("shows the Return to sender note, costs a stamp and returns the card", async () => {
    rig = await toBoard();
    const c = rig.container;
    await linkFits(rig, "01-c1", "p12");
    await linkFits(rig, "01-c2", "p12");
    await click(q(c, "[data-card='p12']"));
    await tapStarting(rig, "Accuse Ambrose");
    await tap(rig, "Accuse");
    const dialog = q(c, "[role='dialog']");
    expect(text(dialog)).toContain("Ambrose Quill is not the owner");
    expect(text(dialog)).toContain("Return to sender");
    expect(text(q(dialog, "[data-testid='wrong-note']"))).toContain("does not fit Ambrose");
    expect(text(dialog)).toContain("Stamps left on this case: 2");
    await tap(rig, "Keep investigating");
    expect(rig.app.router.current.name).toBe("board");
    expect(q(c, "[data-person='p12']").className).toContain("lp-pcard--returned");
    expect(q<HTMLButtonElement>(c, "[data-card='p12']").disabled).toBe(true);
    expect(rig.app.game.getState().active?.state.wrongAccusations).toBe(1);
  });

  it("delivers by elimination with 1 stamp after two wrong accusations", async () => {
    rig = await toBoard();
    const c = rig.container;
    for (const decoy of ["p12", "p10"]) {
      await linkFits(rig, "01-c1", decoy);
      await linkFits(rig, "01-c2", decoy);
      await click(q(c, `[data-card='${decoy}']`));
      await tapStarting(rig, "Accuse ");
      await tap(rig, "Accuse");
      if (decoy === "p12") await tap(rig, "Keep investigating");
    }
    expect(rig.app.router.current.name).toBe("reveal");
    expect(text(q(c, "[data-testid='stamps-text']"))).toBe("1 of 3 stamps");
    expect(text(q(c, "[data-testid='headline']"))).toBe("Delivered, eventually");
    expect(text(q(c, "[data-testid='elimination']"))).toContain("last person left");
    expect(text(q(c, "[data-testid='returned']"))).toContain("Ambrose Quill");
    expect(rig.app.game.getState().profile.cases["01"]?.stamps).toBe(1);
  });

  it("explains the two-witness rule at 0 and 1 fits", async () => {
    rig = await toBoard();
    const c = rig.container;
    await click(q(c, "[data-card='p01']"));
    await tapStarting(rig, "Accuse Odalie");
    expect(text(q(c, "[data-testid='board-notice']"))).toBe(
      "Two clues must fit Odalie Fenn before you can accuse. 2 more needed (now 0).",
    );
    await linkFits(rig, "01-c1", "p01");
    await tapStarting(rig, "Accuse Odalie");
    expect(text(q(c, "[data-testid='board-notice']"))).toContain("1 more needed (now 1)");
    expect(c.querySelector("[role='dialog']")).toBeNull();
    expect(rig.app.game.getState().active?.state.wrongAccusations).toBe(0);
  });

  it("asks for a card before accusing", async () => {
    rig = await toBoard();
    await tap(rig, "Accuse");
    expect(text(q(rig.container, "[data-testid='board-notice']"))).toBe(
      "Select a person to accuse first.",
    );
  });
});

describe("daily parcel play", () => {
  it("opens, plays to a reveal without a ledger fragment and shares the daily text", async () => {
    rig = await mountApp({ route: ["daily"] });
    await tap(rig, "Open today's parcel");
    await tap(rig, "Open parcel");
    const game = rig.app.game;
    const active = game.getState().active;
    expect(active?.kind).toBe("daily");
    if (!active) throw new Error("no daily case");
    for (const object of active.def.objects) {
      await game.inspect(object.id);
      await game.flip(object.id);
    }
    const lead = active.def.deductions.flatMap((d) => d.clueIds);
    for (const id of lead) await game.pin(id);
    const { canonicalLink, PEOPLE } = await import("@web-games/lost-parcel-desk-core");
    for (const id of lead) {
      for (const person of active.def.candidateIds) {
        const kind = canonicalLink(active.def, PEOPLE, id, person);
        if (kind) await game.link(id, person, kind);
      }
    }
    rig.app.router.push("board", { daily: true });
    await rig.flush();
    await click(q(rig.container, `[data-card='${active.def.ownerId}']`));
    await tapStarting(rig, "Accuse ");
    await tap(rig, "Accuse");
    expect(rig.app.router.current).toMatchObject({ name: "reveal", params: { daily: true } });
    expect(rig.container.querySelector("[data-testid='fragment-text']")).toBeNull();
    expect(text(q(rig.container, "[data-testid='typewriter-full']"))).toContain("That leaves");
    await tap(rig, "Share");
    expect(rig.shared[0]?.text).toBe("Lost Parcel Desk Daily 2026-10-21: 3/3 stamps. Streak 1.");
    expect(buttonStarting(rig.container, "Back to the desk")).toBeTruthy();
    expect(rig.app.game.getState().profile.daily.streak).toBe(1);
  });
});
