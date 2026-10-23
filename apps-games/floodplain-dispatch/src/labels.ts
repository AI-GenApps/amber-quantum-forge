import type {
  CellKind,
  Direction,
  PieceKind,
  PlacementError,
} from "@web-games/floodplain-dispatch-core";
import { t } from "./strings";

export function pieceName(kind: PieceKind): string {
  switch (kind) {
    case "canal":
      return t("toolCanal");
    case "barrier":
      return t("toolBarrier");
    case "pump":
      return t("toolPump");
    case "gate":
      return t("toolGate");
    case "reservoir":
      return t("toolReservoir");
  }
}

export function dirName(dir: Direction): string {
  switch (dir) {
    case "N":
      return t("dirN");
    case "E":
      return t("dirE");
    case "S":
      return t("dirS");
    case "W":
      return t("dirW");
  }
}

export function kindName(kind: CellKind): string {
  switch (kind) {
    case "land":
      return t("kindLand");
    case "house":
      return t("kindHouse");
    case "field":
      return t("kindField");
    case "scenery":
      return t("kindScenery");
    case "inlet":
      return t("kindInlet");
    case "sea":
      return t("kindSea");
  }
}

export function placementErrorText(error: PlacementError): string {
  switch (error) {
    case "OUT_OF_BOUNDS":
      return t("errOutOfBounds");
    case "NOT_BUILDABLE":
      return t("errNotBuildable");
    case "PIECE_UNAVAILABLE":
      return t("errUnavailable");
    case "OCCUPIED":
      return t("errOccupied");
    case "OVER_BUDGET":
      return t("errOverBudget");
    case "BAD_DIRECTION":
      return t("errDirection");
    case "BAD_GATE_WEEKS":
      return t("errGateWeeks");
  }
}
