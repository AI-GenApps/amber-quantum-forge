import { type MapDef, PIECE_COSTS, type Placement } from "@web-games/floodplain-dispatch-core";
import { Button, IconButton } from "@web-games/kit";
import { dirName, pieceName } from "../labels";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface InspectorProps {
  open: boolean;
  piece: Placement | null;
  def: MapDef;
  onRotate: () => void;
  onGate: (opensWeek: number, closesWeek: number) => void;
  onRemove: () => void;
  onClose: () => void;
}

interface StepperProps {
  name: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function Stepper({ name, label, value, min, max, onChange }: StepperProps) {
  return (
    <fieldset class="fd-stepper" aria-label={label}>
      <span class="fd-stepper__label">{label}</span>
      <IconButton
        label={`${label}: ${t("inspectorWeekLess")}`}
        variant="secondary"
        class="fd-stepper__btn"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        <span aria-hidden="true">-</span>
      </IconButton>
      <output class="fd-stepper__value" data-testid={`stepper-${name}`}>
        {value}
      </output>
      <IconButton
        label={`${label}: ${t("inspectorWeekMore")}`}
        variant="secondary"
        class="fd-stepper__btn"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        <span aria-hidden="true">+</span>
      </IconButton>
    </fieldset>
  );
}

export function Inspector({
  open,
  piece,
  def,
  onRotate,
  onGate,
  onRemove,
  onClose,
}: InspectorProps) {
  const title = piece
    ? t("inspectorTitle", { piece: pieceName(piece.kind) })
    : t("inspectorTitle", { piece: "" });
  const opens = piece?.opensWeek ?? 0;
  const closes = piece?.closesWeek ?? def.weeks;
  return (
    <AppSheet open={open && piece !== null} onClose={onClose} title={title}>
      {piece?.kind === "pump" ? (
        <div class="fd-sheet__stack">
          <p class="fd-sheet__body" data-testid="pump-facing">
            {t("inspectorFacing", { dir: dirName(piece.dir ?? "E") })}
          </p>
          <Button variant="secondary" fullWidth onClick={onRotate}>
            {t("inspectorRotate")}
          </Button>
        </div>
      ) : null}
      {piece?.kind === "gate" ? (
        <div class="fd-sheet__stack">
          <p class="fd-sheet__body">{t("inspectorGateHint")}</p>
          <Stepper
            name="opens"
            label={t("inspectorOpens")}
            value={opens}
            min={0}
            max={closes - 1}
            onChange={(value) => onGate(value, closes)}
          />
          <Stepper
            name="closes"
            label={t("inspectorCloses")}
            value={closes}
            min={opens + 1}
            max={def.weeks}
            onChange={(value) => onGate(opens, value)}
          />
        </div>
      ) : null}
      <div class="fd-sheet__actions">
        <Button variant="secondary" onClick={onClose}>
          {t("done")}
        </Button>
        {piece ? (
          <Button variant="danger" onClick={onRemove}>
            {`${t("inspectorRemove")} (${t("inspectorRefund", { cost: PIECE_COSTS[piece.kind] })})`}
          </Button>
        ) : null}
      </div>
    </AppSheet>
  );
}
