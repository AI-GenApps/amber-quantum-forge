import {
  createBoard,
  getMap,
  type MapDef,
  type Placement,
} from "@web-games/floodplain-dispatch-core";
import { act } from "preact/test-utils";
import { vi } from "vitest";
import { cellCenter, FALLBACK_VIEWPORT, makeGeometry } from "../src/board/geometry";
import { PIECE_ORDER } from "../src/session/tools";
import { buttonByText, press, q, type Rig, text } from "./helpers";

export class Pilot {
  cursor: { x: number; y: number };
  readonly host: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  private readonly pieces: readonly string[];
  private readonly def: MapDef;

  constructor(
    readonly rig: Rig,
    map: string | MapDef,
  ) {
    this.def = typeof map === "string" ? getMap(map) : map;
    const board = createBoard(this.def);
    const inlet = board.inletCells[0] ?? 0;
    this.cursor = { x: inlet % board.width, y: Math.floor(inlet / board.width) };
    this.pieces = this.def.pieces;
    this.host = q(rig.container, "[data-testid='board-host']");
    this.canvas = q(rig.container, "[data-testid='board-canvas']");
  }

  async goto(x: number, y: number): Promise<void> {
    while (this.cursor.x !== x) {
      const right = x > this.cursor.x;
      await press(this.host, right ? "ArrowRight" : "ArrowLeft");
      this.cursor.x += right ? 1 : -1;
    }
    while (this.cursor.y !== y) {
      const down = y > this.cursor.y;
      await press(this.host, down ? "ArrowDown" : "ArrowUp");
      this.cursor.y += down ? 1 : -1;
    }
  }

  async tool(kind: string): Promise<void> {
    const ordered = PIECE_ORDER.filter((piece) => this.pieces.includes(piece));
    const index = ordered.indexOf(kind as (typeof ordered)[number]);
    await press(this.host, String(index + 1));
  }

  async place(piece: Placement): Promise<void> {
    await this.tool(piece.kind);
    await this.goto(piece.x, piece.y);
    await press(this.host, "Enter");
    if (piece.kind === "pump" && piece.dir) {
      const order = ["E", "S", "W", "N"];
      let guard = 0;
      let facing = "E";
      while (facing !== piece.dir && guard++ < 4) {
        await press(this.host, "r");
        facing = order[(order.indexOf(facing) + 1) % 4] as string;
      }
    }
  }

  async placeAll(pieces: readonly Placement[]): Promise<void> {
    for (const piece of pieces) await this.place(piece);
  }

  live(): string {
    return text(q(this.rig.container, "[data-testid='board-live']"));
  }

  budgetLeft(): string {
    return text(q(this.rig.container, "[data-testid='budget-left']"));
  }

  point(x: number, y: number): { clientX: number; clientY: number } {
    const board = createBoard(this.def);
    const geom = makeGeometry(board.width, board.height, FALLBACK_VIEWPORT);
    const { px, py } = cellCenter(geom, x, y);
    return { clientX: px, clientY: py };
  }

  async pointer(type: "down" | "move" | "up", x: number, y: number): Promise<void> {
    const { clientX, clientY } = this.point(x, y);
    await act(() => {
      this.canvas.dispatchEvent(
        new MouseEvent(`pointer${type}`, { bubbles: true, cancelable: true, clientX, clientY }),
      );
    });
  }

  async tap(x: number, y: number): Promise<void> {
    await this.pointer("down", x, y);
    await this.pointer("up", x, y);
  }

  async drag(cells: readonly { x: number; y: number }[]): Promise<void> {
    const [first, ...rest] = cells;
    if (!first) return;
    await this.pointer("down", first.x, first.y);
    for (const cell of rest) await this.pointer("move", cell.x, cell.y);
    await this.pointer("up", first.x, first.y);
  }
}

export async function tick(ms: number): Promise<void> {
  await act(() => {
    vi.advanceTimersByTime(ms);
  });
}

export async function playUntilResult(rig: Rig, stepMs = 160, limit = 400): Promise<void> {
  for (let i = 0; i < limit; i++) {
    if (rig.container.querySelector("[data-testid='result']")) return;
    await tick(stepMs);
  }
  throw new Error("The season never reached the result sheet");
}

export function clickByText(rig: Rig, label: string): Promise<void> {
  return act(() => {
    buttonByText(rig.container, label).click();
  });
}
