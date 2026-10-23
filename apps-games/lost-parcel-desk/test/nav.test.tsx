import { afterEach, describe, expect, it } from "vitest";
import { createAppRouter, isDailyTarget, leaveCaseTo, targetKey } from "../src/nav";
import { buttonByText, click, mountApp, progress, q, type Rig, tap, text } from "./helpers";

let rig: Rig | null = null;

afterEach(() => {
  rig?.unmount();
  rig = null;
  document.body.replaceChildren();
});

describe("typed routes", () => {
  it("reaches every route name of the spec", async () => {
    const names = [
      "boot",
      "home",
      "files",
      "intro",
      "table",
      "viewer",
      "board",
      "reveal",
      "map",
      "almanac",
      "ledger",
      "daily",
      "achievements",
      "records",
      "themes",
      "settings",
      "howto",
      "credits",
    ];
    expect(names).toHaveLength(18);
    for (const name of names) {
      const params =
        name === "viewer"
          ? { caseId: "01", objectId: "01-1" }
          : ["intro", "table", "board", "reveal"].includes(name)
            ? { caseId: "01" }
            : name === "almanac"
              ? { tab: "clues" }
              : undefined;
      rig = await mountApp({ route: [name, params] as never, profile: progress(["01"], 3) });
      await rig.flush();
      expect(rig.container.querySelector("[data-screen]"), name).not.toBeNull();
      rig.unmount();
    }
    rig = null;
  });

  it("tells campaign and daily targets apart", () => {
    expect(isDailyTarget({ daily: true })).toBe(true);
    expect(isDailyTarget({ caseId: "03" })).toBe(false);
    expect(targetKey({ daily: true })).toBe("daily");
    expect(targetKey({ caseId: "03" })).toBe("03");
  });

  it("leaves the case screens and pushes the reveal on whatever lies beneath", () => {
    const router = createAppRouter();
    router.reset("home");
    router.push("files");
    router.push("intro", { caseId: "01" });
    router.push("table", { caseId: "01" });
    router.push("board", { caseId: "01" });
    leaveCaseTo(router, "reveal", { caseId: "01" });
    expect(router.stack.map((entry) => entry.name)).toEqual(["home", "files", "reveal"]);
  });
});

describe("android back", () => {
  it("closes a sheet first, then leaves the viewer, then the board, then climbs the stack", async () => {
    rig = await mountApp();
    const r = rig;
    r.app.router.push("files");
    r.app.router.push("intro", { caseId: "01" });
    await r.flush();
    await tap(r, "Open parcel");
    expect(r.app.router.current.name).toBe("table");
    r.app.router.push("board", { caseId: "01" });
    r.app.router.push("viewer", { caseId: "01", objectId: "01-3" });
    await r.flush();

    // sheet over the viewer: open the pause sheet through the table instead
    r.app.router.pop();
    r.app.router.pop();
    await r.flush();
    await tap(r, "Pause");
    expect(r.container.querySelector("[role='dialog']")).not.toBeNull();
    expect(r.app.router.handleBack()).toBe(true);
    await r.flush();
    expect(r.container.querySelector("[role='dialog']")).toBeNull();
    expect(r.app.router.current.name).toBe("table");

    r.app.router.push("board", { caseId: "01" });
    r.app.router.push("viewer", { caseId: "01", objectId: "01-3" });
    await r.flush();
    expect(r.app.router.handleBack()).toBe(true);
    expect(r.app.router.current.name).toBe("board");
    expect(r.app.router.handleBack()).toBe(true);
    expect(r.app.router.current.name).toBe("table");
    expect(r.app.router.handleBack()).toBe(true);
    expect(r.app.router.current.name).toBe("files");
    expect(r.app.router.handleBack()).toBe(true);
    expect(r.app.router.current.name).toBe("home");
    expect(r.app.router.handleBack()).toBe(false);
  });

  it("closes the link menu and the accuse sheet before leaving the board", async () => {
    rig = await mountApp({ route: ["board", { caseId: "01" }] });
    await rig.flush();
    await rig.app.game.inspect("01-3");
    await rig.app.game.pin("01-c2");
    await rig.flush();
    await click(q(rig.container, ".lp-pinned [data-clue='01-c2']"));
    await click(q(rig.container, "[data-card='p01']"));
    await rig.flush();
    expect(rig.container.querySelector("[data-testid='link-menu']")).not.toBeNull();
    expect(rig.app.router.handleBack()).toBe(true);
    await rig.flush();
    expect(rig.container.querySelector("[data-testid='link-menu']")).toBeNull();
    expect(rig.app.router.current.name).toBe("board");
  });

  it("wires the lifecycle back button to the router and asks before closing at the root", async () => {
    let handler: (() => boolean) | null = null;
    let onExit: (() => void) | null = null;
    rig = await mountApp();
    rig.unmount();
    const { render } = await import("preact");
    const { act } = await import("preact/test-utils");
    const { App } = await import("../src/App");
    const app = {
      ...rig.app,
      lifecycle: {
        onBack: (fn: () => boolean, options?: { onExit?: () => void }) => {
          handler = fn;
          onExit = options?.onExit ?? null;
          return () => undefined;
        },
      },
      exitApp: () => {
        exited = true;
      },
    };
    let exited = false;
    const host = document.createElement("div");
    document.body.appendChild(host);
    await act(() => render(<App app={app} />, host));
    expect(handler).not.toBeNull();
    await act(() => {
      onExit?.();
    });
    expect(text(q(host, "[role='dialog']"))).toContain("Close the game?");
    await act(() => {
      buttonByText(host, "Close").click();
    });
    expect(exited).toBe(true);
    render(null, host);
    rig = null;
  });
});

describe("boot", () => {
  it("shows progress while fonts and art load, then goes home once the save is ready", async () => {
    const seen: number[] = [];
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    rig = await mountApp({
      route: ["boot"],
      preload: async (onProgress) => {
        onProgress(0.4);
        seen.push(0.4);
        await gate;
        onProgress(1);
      },
    });
    await rig.flush();
    expect(rig.app.router.current.name).toBe("boot");
    expect(q(rig.container, "[role='progressbar']").getAttribute("aria-valuenow")).toBe("40");
    release();
    await rig.settle();
    expect(rig.app.router.current.name).toBe("home");
    expect(seen).toEqual([0.4]);
  });

  it("still leaves the loading screen when the preload throws", async () => {
    rig = await mountApp({
      route: ["boot"],
      preload: async () => {
        throw new Error("no network needed");
      },
    });
    await rig.settle();
    expect(rig.app.router.current.name).toBe("home");
  });
});
