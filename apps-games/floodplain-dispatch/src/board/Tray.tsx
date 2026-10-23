import { PIECE_COSTS, type PieceKind } from "@web-games/floodplain-dispatch-core";
import { Sprite } from "../art/Sprite";
import type { SlotId } from "../art/slots";
import { pieceName } from "../labels";
import { isPieceTool, type Tool, toolCost } from "../session/tools";
import { t } from "../strings";
import { PALETTE } from "../theme/tokens";

export interface TrayProps {
  tools: readonly Tool[];
  tool: Tool;
  budgetLeft: number;
  highlight?: Tool | null;
  onSelect: (tool: Tool) => void;
}

const SLOT_BY_PIECE: Partial<Record<PieceKind, SlotId>> = {
  barrier: "sandbag-barrier",
  pump: "pump",
  gate: "sluice-gate",
  reservoir: "reservoir",
};

function CanalIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <rect
        x="9"
        y="1"
        width="6"
        height="22"
        rx="2"
        fill={PALETTE.rock}
        stroke={PALETTE.ink}
        stroke-width="1.5"
      />
      <rect x="11" y="1" width="2" height="22" fill={PALETTE.waterLight} />
    </svg>
  );
}

function EraseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M4 15 L13 4 L21 11 L14 20 H8 Z"
        fill={PALETTE.paper}
        stroke={PALETTE.ink}
        stroke-width="1.8"
        stroke-linejoin="round"
      />
      <path d="M8 20 H20" stroke={PALETTE.ink} stroke-width="1.8" stroke-linecap="round" />
    </svg>
  );
}

function SelectIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        d="M6 3 L6 19 L10 15 L13 21 L16 20 L13 14 L19 14 Z"
        fill={PALETTE.paper}
        stroke={PALETTE.ink}
        stroke-width="1.6"
        stroke-linejoin="round"
      />
    </svg>
  );
}

function toolName(tool: Tool): string {
  if (tool === "erase") return t("toolErase");
  if (tool === "select") return t("toolSelect");
  return pieceName(tool);
}

function toolAria(tool: Tool): string {
  if (tool === "erase") return t("toolEraseLabel");
  if (tool === "select") return t("toolSelectLabel");
  return t("toolLabel", { name: pieceName(tool), cost: PIECE_COSTS[tool] });
}

function ToolIcon({ tool }: { tool: Tool }) {
  if (tool === "erase") return <EraseIcon />;
  if (tool === "select") return <SelectIcon />;
  if (tool === "canal") return <CanalIcon />;
  const slot = SLOT_BY_PIECE[tool];
  return slot ? <Sprite slot={slot} size={28} label={pieceName(tool)} /> : <CanalIcon />;
}

export function Tray({ tools, tool, budgetLeft, highlight = null, onSelect }: TrayProps) {
  return (
    <div class="fd-tray" role="toolbar" aria-label={t("toolsLabel")}>
      {tools.map((entry, index) => {
        const cost = toolCost(entry);
        const afford = !isPieceTool(entry) || cost <= budgetLeft;
        return (
          <button
            key={entry}
            type="button"
            class="fd-tool fd-hit"
            data-tool={entry}
            data-afford={afford ? "yes" : "no"}
            data-highlight={highlight === entry ? "true" : undefined}
            aria-pressed={tool === entry}
            aria-label={toolAria(entry)}
            aria-keyshortcuts={String(index + 1)}
            style={{ minWidth: "var(--wg-hit-min)", minHeight: "var(--wg-hit-min)" }}
            onClick={() => onSelect(entry)}
          >
            <ToolIcon tool={entry} />
            <span class="fd-tool__name" aria-hidden="true">
              {toolName(entry)}
            </span>
            {isPieceTool(entry) ? (
              <span class="fd-tool__cost" aria-hidden="true">
                {cost}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
