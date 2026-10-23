import { gate, lantern, type Puzzle } from "@web-games/lantern-loops-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ColourLegend, legendColours } from "../../src/components/ColourLegend";

afterEach(() => {
  document.body.replaceChildren();
});

const open = { kind: "open" } as const;
const board = (...cells: (typeof open | ReturnType<typeof lantern>)[]): Puzzle => ({
  id: "legend",
  size: 2,
  cells: [...cells, ...Array.from({ length: 4 - cells.length }, () => open)],
});

describe("legendColours", () => {
  it("is empty for a single-colour board without gates", () => {
    expect(legendColours(board(lantern("amber"), lantern("amber")))).toEqual([]);
  });

  it("lists the colours of several lantern colours in palette order", () => {
    expect(legendColours(board(lantern("violet"), lantern("rose")))).toEqual(["rose", "violet"]);
  });

  it("lists the gate colour even with one lantern colour", () => {
    expect(legendColours(board(lantern("jade"), gate("jade")))).toEqual(["jade"]);
  });
});

describe("ColourLegend", () => {
  it("shows the delivered lantern file per colour and the fallback for the rest", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const files = new Map([["lantern-rose.webp", "/assets/lantern-rose-1.webp"]]);
    await act(() =>
      render(
        <ColourLegend
          puzzle={board(lantern("rose"), lantern("azure"), gate("rose"))}
          files={files}
        />,
        container,
      ),
    );
    const items = [...container.querySelectorAll("li[data-colour]")];
    expect(items.map((item) => item.getAttribute("data-colour"))).toEqual(["rose", "azure"]);
    expect(items[0]?.querySelector("img")?.getAttribute("src")).toBe("/assets/lantern-rose-1.webp");
    expect(items[0]?.textContent).toContain("rose");
    expect(items[1]?.querySelector("img")).toBeNull();
    expect(items[1]?.querySelector("[data-art='lantern-azure'] svg")).not.toBeNull();
  });

  it("renders nothing when no colour needs naming", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() => render(<ColourLegend puzzle={board(lantern("amber"))} />, container));
    expect(container.querySelector("[data-testid='colour-legend']")).toBeNull();
  });
});
