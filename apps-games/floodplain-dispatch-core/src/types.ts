export type CellKind = "land" | "house" | "field" | "scenery" | "inlet" | "sea";

export type PieceKind = "canal" | "barrier" | "pump" | "gate" | "reservoir";

export type Direction = "N" | "E" | "S" | "W";

export type EventType = "surge" | "drought" | "storm-tide";

export interface Placement {
  x: number;
  y: number;
  kind: PieceKind;
  dir?: Direction;
  opensWeek?: number;
  closesWeek?: number;
}

export interface SeasonEvent {
  type: EventType;
  week: number;
  weeks: number;
  delta: number;
}

export interface TideSpec {
  period: number;
  amp: number;
}

export interface MapDef {
  layout: readonly string[];
  inlets: readonly number[];
  houseKinds: readonly string[];
  events: readonly SeasonEvent[];
  tide: TideSpec | null;
  weeks: number;
  pieces: readonly PieceKind[];
  par: number;
  budget: number;
  reference?: readonly Placement[];
}

export interface Board {
  width: number;
  height: number;
  kinds: readonly CellKind[];
  heights: Uint8Array;
  houseCells: readonly number[];
  fieldCells: readonly number[];
  inletCells: readonly number[];
  seaCells: readonly number[];
}

export interface HouseMetric {
  index: number;
  x: number;
  y: number;
  floodedSteps: number;
  suppliedSteps: number;
}

export interface FieldMetric {
  index: number;
  x: number;
  y: number;
  wetSteps: number;
}

export interface SeasonMetrics {
  houses: HouseMetric[];
  fields: FieldMetric[];
}

export interface SeasonResult {
  width: number;
  height: number;
  weeks: number;
  weekFrames: Uint8Array[];
  stepFrames?: Uint8Array[];
  metrics: SeasonMetrics;
}

export interface Evaluation {
  housesTotal: number;
  housesSupplied: number;
  housesFlooded: number;
  fieldsTotal: number;
  fieldsIrrigated: number;
  spend: number;
  par: number;
  budgetLeft: number;
  starSupply: boolean;
  starDry: boolean;
  starThrift: boolean;
  stars: 0 | 1 | 2 | 3;
  cleared: boolean;
  score: number;
}
