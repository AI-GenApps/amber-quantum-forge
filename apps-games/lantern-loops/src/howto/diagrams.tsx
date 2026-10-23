import { StarRating } from "@web-games/kit";
import { evaluate } from "@web-games/lantern-loops-core";
import type { HowToPage } from "../app/routes";
import { BoardCell } from "../board/BoardCell";
import { UNIT } from "../board/layout";
import { computeMarks } from "../board/marks";
import { t } from "../strings";
import { gameTokensFor } from "../theme/tokens";
import { DIAGRAMS } from "./fixtures";

const WEEK = [1, 2, 3, 4, 5, 6, 7] as const;
const DOT = 22;

function WeekDots() {
  return (
    <svg
      class="ll-diagram-week"
      viewBox={`0 0 ${WEEK.length * DOT * 2} ${DOT * 3}`}
      aria-hidden="true"
      data-testid="week-dots"
    >
      {WEEK.map((day, index) => (
        <g key={day} transform={`translate(${index * DOT * 2 + DOT} ${DOT})`}>
          <circle
            r={DOT * 0.55}
            class={index < 5 ? "ll-week-on" : "ll-week-off"}
            data-on={index < 5 ? "true" : "false"}
          />
          <text y={DOT * 1.9} text-anchor="middle" class="ll-chart-label">
            {t(`weekdayShort.${day}`)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Static board fragment for a how-to page: the real cell components on a 3 x 3 fixture. */
export function Diagram({ page, label }: { page: HowToPage; label: string }) {
  const fixture = DIAGRAMS[page];
  const { puzzle, tiles } = fixture;
  const game = gameTokensFor(false);
  const marks = computeMarks(puzzle, tiles, evaluate(puzzle, tiles), false);
  const side = puzzle.size * UNIT;
  const hinted = new Set(fixture.hinted);
  return (
    <figure class="ll-diagram" data-diagram={page}>
      <svg class="ll-diagram-board" viewBox={`0 0 ${side} ${side}`} role="img" aria-label={label}>
        <rect width={side} height={side} rx="10" fill={game.boardPlate} />
        <g>
          {puzzle.cells.map((cell, index) => (
            <BoardCell
              key={index}
              puzzle={puzzle}
              index={index}
              mask={cell.kind === "stone" ? 0 : (tiles[index] ?? 0)}
              litColour={marks.lit.get(index)}
              dim={false}
              conflict={false}
              ends={[]}
              hinted={hinted.has(index)}
              focused={false}
              highlighted={false}
              game={game}
              label=""
            />
          ))}
        </g>
      </svg>
      {page === "daily" ? <WeekDots /> : null}
      {page === "hints" ? <StarRating value={3} label={t("howto.hintsStars")} /> : null}
    </figure>
  );
}
