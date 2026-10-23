import type { Puzzle, Tiles } from "@web-games/lantern-loops-core";
import { act } from "preact/test-utils";
import { tapAt } from "./board";
import { click, flush } from "./env";

export function boardSvg(root: ParentNode): SVGSVGElement {
  const svg = root.querySelector<SVGSVGElement>("svg[data-board]");
  if (!svg) throw new Error("board not rendered");
  const size = Number(svg.getAttribute("data-size"));
  svg.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: size * 100,
      height: size * 100,
      right: size * 100,
      bottom: size * 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect;
  return svg;
}

export function tapsFor(mask: number): number {
  if (mask === 10) return 1;
  if (mask === 5) return 2;
  return [3, 6, 12, 9].indexOf(mask) + 1;
}

/** Plays the solution through brush buttons and pointer taps. `skip` cells are left empty. */
export async function solveByTaps(
  root: ParentNode,
  puzzle: Puzzle,
  solution: Tiles,
  skip: ReadonlySet<number> = new Set(),
): Promise<void> {
  const svg = boardSvg(root);
  let brush = "";
  for (let i = 0; i < solution.length; i++) {
    const mask = solution[i] ?? 0;
    if (mask === 0 || skip.has(i) || puzzle.cells[i]?.fixed !== undefined) continue;
    const wanted = mask === 10 || mask === 5 ? "straight" : "corner";
    if (wanted !== brush) {
      await click(root.querySelector(`[data-brush='${wanted}']`));
      brush = wanted;
    }
    for (let k = 0; k < tapsFor(mask); k++) await tapAt(svg, puzzle.size, i);
  }
  await flush(12);
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  await flush(8);
}
