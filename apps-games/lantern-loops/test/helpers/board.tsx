import {
  decodePuzzle,
  decodeTiles,
  emptyTiles,
  getPuzzle,
  type Puzzle,
  type Tiles,
} from "@web-games/lantern-loops-core";
import { render } from "preact";
import { act } from "preact/test-utils";
import { PlayBoard, type PlayBoardProps } from "../../src/board/PlayBoard";
import { createSession, type Session } from "../../src/state/session";

export const SHOWCASE_CODE = "LaLrS3M/M\\|Gr=aLjLbLv.=3|.....|...S4.|..S0..";

export function puzzleFrom(code: string, id = "fixture"): Puzzle {
  const result = decodePuzzle(code, id);
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export function campaignFixture(id: string): { puzzle: Puzzle; solution: Tiles } {
  const record = getPuzzle(id);
  if (!record) throw new Error(`missing ${id}`);
  const solution = decodeTiles(record.solution, record.size);
  if (!solution.ok) throw new Error("bad solution");
  return { puzzle: puzzleFrom(record.code, record.id), solution: solution.value };
}

export function blankSession(
  puzzle: Puzzle,
  brush: "straight" | "corner" | "erase" = "straight",
): Session {
  return createSession({ puzzle, solution: emptyTiles(puzzle), brush });
}

export interface BoardHandle {
  container: HTMLElement;
  svg: SVGSVGElement;
  unmount(): void;
}

export async function mountBoard(
  session: Session,
  props: Partial<Omit<PlayBoardProps, "session">> = {},
): Promise<BoardHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const size = session.puzzle.size;
  const element = (
    <PlayBoard session={session} showConflicts highContrast={false} cellPx={100 / 1} {...props} />
  );
  await act(() => render(element, container));
  const svg = container.querySelector<SVGSVGElement>("svg[data-board]");
  if (!svg) throw new Error("board missing");
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
  return {
    container,
    svg,
    unmount: () => {
      render(null, container);
      container.remove();
    },
  };
}

export function centre(size: number, cell: number): { x: number; y: number } {
  return { x: (cell % size) * 100 + 50, y: Math.floor(cell / size) * 100 + 50 };
}

export async function pointer(
  svg: Element,
  type: "pointerdown" | "pointermove" | "pointerup" | "pointercancel",
  x: number,
  y: number,
  pointerId = 1,
): Promise<void> {
  await act(() => {
    svg.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y,
        pointerId,
      }),
    );
  });
}

export async function tapAt(svg: Element, size: number, cell: number): Promise<void> {
  const { x, y } = centre(size, cell);
  await pointer(svg, "pointerdown", x, y);
  await pointer(svg, "pointerup", x, y);
}

export async function dragThrough(
  svg: Element,
  size: number,
  cells: readonly number[],
): Promise<void> {
  const first = centre(size, cells[0] as number);
  await pointer(svg, "pointerdown", first.x, first.y);
  for (const cell of cells.slice(1)) {
    const { x, y } = centre(size, cell);
    await pointer(svg, "pointermove", x, y);
  }
  const last = centre(size, cells[cells.length - 1] as number);
  await pointer(svg, "pointerup", last.x, last.y);
}

export async function key(svg: Element, name: string): Promise<void> {
  await act(() => {
    svg.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  });
}
