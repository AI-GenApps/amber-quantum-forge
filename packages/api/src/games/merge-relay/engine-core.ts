import type { MergeDirection } from "./contracts";

export const MERGE_MAX_TILE = 1_073_741_824;
export const MERGE_MAX_SCORE = 1_000_000_000_000;
export const MERGE_MAX_MOVE_COUNT = 100_000;
export const MERGE_MAX_UINT32 = 0xffffffff;

export class Rng {
  private value: number;

  constructor(state: number) {
    this.value = state >>> 0 || 0x6d2b79f5;
  }

  get state(): number {
    return this.value >>> 0;
  }

  nextInt(maximum: number): number {
    return this.nextUint32() % maximum;
  }

  private nextUint32(): number {
    this.value ^= (this.value << 13) >>> 0;
    this.value >>>= 0;
    this.value ^= this.value >>> 17;
    this.value >>>= 0;
    this.value ^= (this.value << 5) >>> 0;
    this.value >>>= 0;
    this.value = this.value || 0x6d2b79f5;
    return this.value;
  }
}

export function moveBoard(
  cells: readonly number[],
  direction: MergeDirection,
): { board: number[]; scoreDelta: number } {
  const result = [...cells];
  let scoreDelta = 0;
  for (let line = 0; line < 4; line += 1) {
    const indexes = lineIndexes(direction, line);
    const values = indexes.map((index) => cells[index]);
    const compact = values.filter((value) => value !== 0);
    const merged: number[] = [];
    for (let index = 0; index < compact.length; index += 1) {
      if (
        index + 1 < compact.length &&
        compact[index] === compact[index + 1] &&
        compact[index] < MERGE_MAX_TILE
      ) {
        const value = compact[index] * 2;
        merged.push(value);
        scoreDelta += value;
        index += 1;
      } else merged.push(compact[index]);
    }
    while (merged.length < 4) merged.push(0);
    indexes.forEach((index, position) => {
      result[index] = merged[position];
    });
  }
  return { board: result, scoreDelta };
}

function lineIndexes(direction: MergeDirection, line: number): number[] {
  if (direction === "left") return [line * 4, line * 4 + 1, line * 4 + 2, line * 4 + 3];
  if (direction === "right") return [line * 4 + 3, line * 4 + 2, line * 4 + 1, line * 4];
  if (direction === "up") return [line, line + 4, line + 8, line + 12];
  return [line + 12, line + 8, line + 4, line];
}

export function sameBoard(first: readonly number[], second: readonly number[]): boolean {
  return first.every((value, index) => value === second[index]);
}

export function spawnValue(rng: Rng, spawnFourWeight: number | undefined): 2 | 4 {
  if (spawnFourWeight === undefined || spawnFourWeight === 10) return rng.nextInt(10) === 0 ? 4 : 2;
  return rng.nextInt(100) < spawnFourWeight ? 4 : 2;
}
