import { type Colour, cellAt, type LooseEnd, type Puzzle } from "@web-games/lantern-loops-core";
import { GLYPH_BY_COLOUR } from "../theme/palette";
import type { GameTokens } from "../theme/tokens";
import { ConflictLayer } from "./ConflictLayer";
import { GateGlyph } from "./GateGlyph";
import { Glyph, LanternBody } from "./LanternGlyph";
import { UNIT } from "./layout";
import { MirrorPane, MirrorUnderlay } from "./MirrorGlyph";
import { StoneGlyph } from "./StoneGlyph";
import { TileShape } from "./TileShape";

export interface BoardCellProps {
  puzzle: Puzzle;
  index: number;
  mask: number;
  litColour: Colour | undefined;
  dim: boolean;
  conflict: boolean;
  ends: readonly LooseEnd[];
  hinted: boolean;
  focused: boolean;
  highlighted: boolean;
  game: Readonly<GameTokens>;
  label: string;
}

export function BoardCell({
  puzzle,
  index,
  mask,
  litColour,
  dim,
  conflict,
  ends,
  hinted,
  focused,
  highlighted,
  game,
  label,
}: BoardCellProps) {
  const { size } = puzzle;
  const cell = cellAt(puzzle, index);
  const x = (index % size) * UNIT;
  const y = Math.floor(index / size) * UNIT;
  const clue = cell.kind === "open" ? cell.clue : undefined;
  const fill = litColour === undefined ? game.ribbon : game.lantern[litColour];
  return (
    // biome-ignore lint/a11y/useSemanticElements: SVG groups cannot be table cells
    <g
      id={`ll-cell-${index}`}
      role="gridcell"
      aria-label={label}
      data-cell={index}
      transform={`translate(${x} ${y})`}
    >
      <rect
        class="ll-plate"
        width={UNIT}
        height={UNIT}
        fill={game.boardPlate}
        stroke={game.boardLine}
        stroke-width="1.5"
      />
      {cell.kind === "stone" ? (
        <StoneGlyph
          count={cell.stone ?? 0}
          fill={game.stoneFill}
          text={game.stoneText}
          conflict={conflict}
          conflictColour={game.conflict}
        />
      ) : (
        <>
          {clue?.kind === "mirror" ? <MirrorUnderlay /> : null}
          {mask !== 0 ? (
            <TileShape
              mask={mask}
              fill={fill}
              outline={game.ribbonOutline}
              outlineExtra={game.outline}
              dim={dim}
              pinned={cell.fixed !== undefined}
            />
          ) : null}
          {game.glyphsOnTiles &&
          litColour !== undefined &&
          clue?.kind !== "lantern" &&
          mask !== 0 ? (
            <Glyph kind={GLYPH_BY_COLOUR[litColour]} cx={50} cy={50} r={8} fill={game.ink} />
          ) : null}
          {clue?.kind === "mirror" ? (
            <MirrorPane shape={clue.shape} outline={game.outline} />
          ) : null}
          {clue?.kind === "gate" ? (
            <GateGlyph colour={clue.colour} hex={game.lantern[clue.colour]} ink={game.ink} />
          ) : null}
          {clue?.kind === "lantern" ? (
            <LanternBody
              colour={clue.colour}
              lit={litColour !== undefined && mask !== 0}
              hex={game.lantern[clue.colour]}
              unlit={game.unlit}
              ink={game.ink}
            />
          ) : null}
          <ConflictLayer conflict={conflict} ends={ends} game={game} />
          {hinted ? (
            <circle
              class="ll-hinted"
              cx="86"
              cy="14"
              r="7"
              fill={game.lantern.amber}
              stroke={game.ink}
              stroke-width="2.5"
            />
          ) : null}
        </>
      )}
      {highlighted ? (
        <rect
          class="ll-target"
          x="3"
          y="3"
          width="94"
          height="94"
          rx="12"
          fill="none"
          stroke={game.lantern.amber}
          stroke-width="5"
          stroke-dasharray="10 7"
        />
      ) : null}
      {focused ? (
        <rect
          class="ll-focus"
          x="2"
          y="2"
          width="96"
          height="96"
          rx="10"
          fill="none"
          stroke-width="5"
        />
      ) : null}
    </g>
  );
}
