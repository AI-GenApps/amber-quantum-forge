import { afterEach, describe, expect, it } from "vitest";
import { cleanup, openScreen, type Rendered, renderApp } from "./harness";

afterEach(cleanup);

const button = (r: Rendered, label: string) =>
  Array.from(r.qa("button")).find((b) => b.textContent === label) ?? null;

describe("How to Play", () => {
  it("has four pages with a diagram each, in order, and navigates both ways", async () => {
    const r = await renderApp({});
    await openScreen(r, "howto");
    const titles = [
      "Gather and Build",
      "Chart the Sky",
      "The Eclipse",
      "The Comet and the Journal",
    ];
    for (const [index, title] of titles.entries()) {
      expect(r.q(".co-howto h2").textContent).toBe(title);
      expect(r.q(".co-howto [data-page]").textContent).toBe(`Page ${index + 1} of 4`);
      const diagram = r.q("svg[data-diagram]");
      expect(diagram.getAttribute("role")).toBe("img");
      expect(diagram.getAttribute("aria-label")?.length ?? 0).toBeGreaterThan(10);
      if (index < 3) await r.click(button(r, "Next"));
    }
    expect(button(r, "Next")).toBeNull();
    await r.click(button(r, "Previous"));
    expect(r.q(".co-howto h2").textContent).toBe("The Eclipse");
    await r.click(button(r, "Previous"));
    await r.click(button(r, "Previous"));
    expect(r.q(".co-howto h2").textContent).toBe("Gather and Build");
    expect((button(r, "Previous") as HTMLButtonElement).disabled).toBe(true);
  });

  it("uses short plain sentences", async () => {
    const r = await renderApp({});
    await openScreen(r, "howto");
    for (let page = 0; page < 4; page += 1) {
      const body = r.q(".co-howto__body").textContent ?? "";
      for (const sentence of body.split(/(?<=[.!?])\s+/)) {
        expect(sentence.split(/\s+/).length, sentence).toBeLessThanOrEqual(30);
      }
      if (page < 3) await r.click(button(r, "Next"));
    }
  });

  it("Done on the last page goes back, and it opens from the Title and from Settings", async () => {
    const r = await renderApp({ start: "title" });
    await r.click(button(r, "How to Play"));
    expect(r.router.current.name).toBe("howto");
    for (let page = 0; page < 3; page += 1) await r.click(button(r, "Next"));
    await r.click(button(r, "Done"));
    expect(r.router.current.name).toBe("title");
    await r.unmount();

    const s = await renderApp({});
    await openScreen(s, "settings");
    await s.click(button(s, "How to Play"));
    expect(s.router.current.name).toBe("howto");
  });
});
