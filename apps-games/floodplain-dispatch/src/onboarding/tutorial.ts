import {
  createBoard,
  type MapDef,
  type Placement,
  TUTORIAL_STEPS,
} from "@web-games/floodplain-dispatch-core";

export const TUTORIAL_MAP = "v01" as const;
export const TUTORIAL_FLAG = "tutorial" as const;
export const TUTORIAL_LAST = TUTORIAL_STEPS.length;

export type TutorialStatus = "active" | "done" | "skipped";

export interface TutorialState {
  status: TutorialStatus;
  /** 1 to 5, the step being shown. */
  step: number;
}

export type TutorialAction =
  | { type: "inlet-ack" }
  | { type: "tool"; tool: string }
  | { type: "plan"; connected: boolean }
  | { type: "run" }
  | { type: "result-seen" }
  | { type: "skip" };

export function startTutorial(): TutorialState {
  return { status: "active", step: 1 };
}

export const finishedTutorial = (state: TutorialState): boolean => state.status !== "active";

function matches(step: number, action: TutorialAction): boolean {
  switch (action.type) {
    case "inlet-ack":
      return step === 1;
    case "tool":
      return step === 2 && action.tool === "canal";
    case "plan":
      return step === 3 && action.connected;
    case "run":
      return step === 4;
    case "result-seen":
      return step === TUTORIAL_LAST;
    case "skip":
      return true;
  }
}

/** Only the matching real action advances a step; anything else returns the same state. */
export function stepTutorial(state: TutorialState, action: TutorialAction): TutorialState {
  if (state.status !== "active") return state;
  if (action.type === "skip") return { ...state, status: "skipped" };
  if (!matches(state.step, action)) return state;
  if (state.step >= TUTORIAL_LAST) return { ...state, status: "done" };
  return { ...state, step: state.step + 1 };
}

export interface TutorialHighlight {
  inlet: boolean;
  houses: boolean;
  canalTool: boolean;
  runButton: boolean;
  resultStars: boolean;
}

const NONE: TutorialHighlight = {
  inlet: false,
  houses: false,
  canalTool: false,
  runButton: false,
  resultStars: false,
};

export function highlightFor(state: TutorialState): TutorialHighlight {
  if (state.status !== "active") return NONE;
  switch (state.step) {
    case 1:
      return { ...NONE, inlet: true };
    case 2:
      return { ...NONE, canalTool: true };
    case 3:
      return { ...NONE, inlet: true, houses: true };
    case 4:
      return { ...NONE, runButton: true };
    default:
      return { ...NONE, resultStars: true };
  }
}

/** True when the canals form one chain from the river inlet to a cell beside a house. */
export function canalConnected(def: MapDef, placements: readonly Placement[]): boolean {
  const board = createBoard(def);
  const width = board.width;
  const canals = new Set(
    placements.filter((p) => p.kind === "canal").map((p) => p.y * width + p.x),
  );
  const beside = (cell: number, targets: readonly number[]): boolean => {
    const x = cell % width;
    const y = Math.floor(cell / width);
    return targets.some((target) => {
      const tx = target % width;
      const ty = Math.floor(target / width);
      return Math.abs(tx - x) + Math.abs(ty - y) === 1;
    });
  };
  const queue = [...canals].filter((cell) => beside(cell, board.inletCells));
  const seen = new Set(queue);
  while (queue.length > 0) {
    const cell = queue.pop() as number;
    if (beside(cell, board.houseCells)) return true;
    const x = cell % width;
    const y = Math.floor(cell / width);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= board.height) continue;
      const next = ny * width + nx;
      if (canals.has(next) && !seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  return false;
}
