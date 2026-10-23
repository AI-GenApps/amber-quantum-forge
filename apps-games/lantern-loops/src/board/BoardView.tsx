import { cellAt, type Puzzle } from "@web-games/lantern-loops-core";
import type { Ref } from "preact";
import { cellLabel } from "../a11y/labels";
import type { SessionState } from "../state/session";
import { t } from "../strings";
import { gameTokensFor } from "../theme/tokens";
import { BoardCell } from "./BoardCell";
import { UNIT } from "./layout";
import type { BoardMarks } from "./marks";
import type { BoardPointerHandlers } from "./useBoardInput";

export interface BoardViewProps {
  puzzle: Puzzle;
  state: SessionState;
  marks: BoardMarks;
  highContrast: boolean;
  /** Cell size in css pixels. */
  cellPx: number;
  focus: number | null;
  highlight?: readonly number[];
  svgRef: Ref<SVGSVGElement>;
  handlers: BoardPointerHandlers;
  onKeyDown(event: KeyboardEvent): void;
  onFocus(): void;
  onBlur(): void;
}

/** The SVG puzzle board: plate, tiles, clues and live feedback. Input handlers come from the parent. */
export function BoardView({
  puzzle,
  state,
  marks,
  highContrast,
  cellPx,
  focus,
  highlight = [],
  svgRef,
  handlers,
  onKeyDown,
  onFocus,
  onBlur,
}: BoardViewProps) {
  const { size } = puzzle;
  const game = gameTokensFor(highContrast);
  const side = size * UNIT;
  const hinted = new Set(state.hintCells);
  const marked = new Set(highlight);
  const rows = Array.from({ length: size }, (_, row) => row);
  return (
    // biome-ignore lint/a11y/useSemanticElements: an SVG cannot be a table; the ARIA grid pattern gives each cell its spoken label
    <svg
      ref={svgRef}
      class="ll-board"
      data-board="true"
      data-size={size}
      // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: the board is an interactive grid that takes keyboard focus
      role="grid"
      aria-label={t("puzzle.board", { size })}
      aria-rowcount={size}
      aria-colcount={size}
      aria-activedescendant={focus === null ? undefined : `ll-cell-${focus}`}
      tabIndex={0}
      viewBox={`0 0 ${side} ${side}`}
      width={cellPx * size}
      height={cellPx * size}
      style={{ touchAction: "none" }}
      onPointerDown={handlers.onPointerDown}
      onPointerMove={handlers.onPointerMove}
      onPointerUp={handlers.onPointerUp}
      onPointerCancel={handlers.onPointerCancel}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <rect width={side} height={side} rx="10" fill={game.boardPlate} />
      {rows.map((row) => (
        // biome-ignore lint/a11y/useSemanticElements: SVG groups cannot be table rows
        <g key={row} role="row">
          {Array.from({ length: size }, (_, col) => {
            const index = row * size + col;
            const cell = cellAt(puzzle, index);
            const lit = marks.lit.get(index);
            const conflict = marks.conflicts.has(index);
            const mask = cell.kind === "stone" ? 0 : (state.tiles[index] ?? 0);
            return (
              <BoardCell
                key={index}
                puzzle={puzzle}
                index={index}
                mask={mask}
                litColour={lit}
                dim={marks.dark.has(index)}
                conflict={conflict}
                ends={marks.looseEnds.get(index) ?? []}
                hinted={hinted.has(index)}
                focused={focus === index}
                highlighted={marked.has(index)}
                game={game}
                label={cellLabel(
                  puzzle,
                  state.tiles,
                  index,
                  { lit: lit !== undefined, conflict },
                  hinted.has(index),
                )}
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
