import { describe, expect, it } from "vitest";
import { renderMapAscii } from "../../src/index";
import { loadDistrict1, miniMap } from "./helpers";

describe("renderMapAscii", () => {
  it("renders the mini map with road-end caps, connectors and the spawn arrow", () => {
    const text = renderMapAscii(miniMap());
    expect(text.split("\n").slice(0, 4)).toEqual(["  0 1 2", "0 B ╷ B", "1 B ^ B", "2 B ╵ B"]);
  });

  it("renders district-1 with its junctions, spawn and a legend", () => {
    const lines = renderMapAscii(loadDistrict1()).split("\n");
    expect(lines[6]).toBe(" 5 B ├─<─────┼─────┼───┤ B");
    expect(lines[2]).toBe(" 1 B ┌───┴───┬─────┬───┐ B");
    expect(lines).toHaveLength(16);
    expect(lines.join("\n")).toContain("district-1 12x12 tile=20m");
  });
});
