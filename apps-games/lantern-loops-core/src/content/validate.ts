import { emptyTiles, equalTiles } from "../board";
import { decodePuzzle, encodePuzzle } from "../code";
import { measure, ratingOf } from "../gen/difficulty";
import { type Mechanics, rangesFor } from "../gen/ranges";
import { analyseLoops } from "../loops";
import { type Colour, validatePuzzleShape } from "../puzzle";
import { evaluate } from "../rules";
import { solve } from "../solver";
import { analyseRecord, countClues, median, puzzleFromRecord, solutionFromRecord } from "./analyse";
import {
  CAMPAIGN,
  CHAPTER_SIZE_COUNTS,
  CHAPTERS,
  PUZZLE_COUNT,
  PUZZLES_PER_CHAPTER,
} from "./chapters";
import { campaignSeed, CHAPTER_TITLE_ROWS } from "./spec";
import { CHAPTER_IDS, type ChapterId, type PuzzleRecord } from "./types";
import { TUTORIALS } from "./tutorials";

export interface ValidationIssue {
  readonly id: string;
  readonly message: string;
}

/** No puzzle may pin more than this share of its solution tiles. */
export const ANCHOR_HARD_LIMIT = 50;
/** The median anchor share of every chapter stays at or below this. */
export const ANCHOR_MEDIAN_LIMIT = 35;
export const MAX_TITLE_LENGTH = 24;
export const BAND_SIZE = 6;

/** Sky puzzle number at which each lantern colour is introduced (amber is always open). */
export const COLOUR_INTRO: Readonly<Record<Colour, number>> = {
  amber: 1,
  rose: 1,
  jade: 3,
  violet: 4,
  azure: 5,
};

const SKY_MIN_COLOURS = 2;

function chapterMechanics(chapter: ChapterId): Mechanics {
  return CHAPTERS[CHAPTER_IDS.indexOf(chapter)]?.mechanics as Mechanics;
}

function checkStructure(records: readonly PuzzleRecord[], out: ValidationIssue[]): void {
  const add = (id: string, message: string) => out.push({ id, message });
  if (records.length !== PUZZLE_COUNT) add("campaign", `${records.length} puzzles, expected 120`);
  const titles = new Set<string>();
  for (const chapter of CHAPTER_IDS) {
    const rows = records.filter((record) => record.chapter === chapter);
    if (rows.length !== PUZZLES_PER_CHAPTER) {
      add(chapter, `${rows.length} puzzles, expected ${PUZZLES_PER_CHAPTER}`);
    }
    const counts: Record<number, number> = {};
    let lastSize = 0;
    rows.forEach((record, k) => {
      counts[record.size] = (counts[record.size] ?? 0) + 1;
      if (record.size < lastSize) add(record.id, "size does not ascend inside the chapter");
      lastSize = record.size;
      const expectedId = `${chapter}-${String(k + 1).padStart(2, "0")}`;
      if (record.id !== expectedId || record.index !== k + 1) add(record.id, `expected ${expectedId}`);
      const row = CHAPTER_TITLE_ROWS[chapter][k];
      if (row === undefined || row[0] !== record.title || row[1] !== record.size) {
        add(record.id, "title or size differs from the campaign spec");
      }
    });
    const want = CHAPTER_SIZE_COUNTS[chapter];
    const sizes = new Set([...Object.keys(counts), ...Object.keys(want)].map(Number));
    for (const size of sizes) {
      if ((counts[size] ?? 0) !== (want[size] ?? 0)) {
        add(chapter, `${counts[size] ?? 0} boards of size ${size}, expected ${want[size] ?? 0}`);
      }
    }
  }
  for (const record of records) {
    if (record.title.length === 0 || record.title.length > MAX_TITLE_LENGTH) {
      add(record.id, `title must be 1 to ${MAX_TITLE_LENGTH} characters`);
    }
    if (titles.has(record.title.toLowerCase())) add(record.id, "duplicate title");
    titles.add(record.title.toLowerCase());
    if (record.seed !== campaignSeed(record.id)) add(record.id, "seed is not hash(ll-gen-1|id)");
  }
}

function checkBoard(record: PuzzleRecord, out: ValidationIssue[]): boolean {
  const add = (message: string) => out.push({ id: record.id, message });
  const decoded = decodePuzzle(record.code, record.id);
  if (!decoded.ok) {
    add(`code does not decode: ${decoded.error.message}`);
    return false;
  }
  const puzzle = decoded.value;
  if (encodePuzzle(puzzle) !== record.code) add("code does not re-encode to itself");
  if (puzzle.size !== record.size) add("size differs from the code");
  const shape = validatePuzzleShape(puzzle);
  if (!shape.ok) add(`shape: ${shape.errors[0]?.message ?? "invalid"}`);
  let solution: Uint8Array;
  try {
    solution = solutionFromRecord(record);
  } catch (error) {
    add(`solution does not decode: ${(error as Error).message}`);
    return false;
  }
  const result = solve(puzzle, { limit: 2 });
  if (result.exhausted) add("solver ran out of budget before proving uniqueness");
  else if (result.count !== 1) add(`${result.count} solutions found, expected exactly 1`);
  else if (!equalTiles(result.solutions[0] as Uint8Array, solution)) {
    add("the unique solution differs from the stored solution");
  }
  if (!evaluate(puzzle, solution).solved) add("stored solution is not solved");
  if (evaluate(puzzle, emptyTiles(puzzle)).solved) add("the initial board is already solved");
  const analysis = analyseLoops(puzzle, solution);
  if (analysis.chains.length > 0) add("stored solution has open chains");
  if (analysis.loops.some((loop) => loop.lanterns.length === 0)) add("a loop has no lantern");
  const stats = measure(puzzle);
  if (!Number.isInteger(record.rating) || record.rating < 1 || record.rating > 5) {
    add("rating must be an integer 1 to 5");
  } else if (ratingOf(stats) !== record.rating) {
    add(`stored rating ${record.rating} differs from recomputed ${ratingOf(stats)}`);
  }
  return true;
}

function checkMechanics(record: PuzzleRecord, out: ValidationIssue[]): void {
  const add = (message: string) => out.push({ id: record.id, message });
  const puzzle = puzzleFromRecord(record);
  const counts = countClues(puzzle);
  const mechanics = chapterMechanics(record.chapter);
  const relax = record.chapter === "bridge" || record.chapter === "sky";
  const ranges = rangesFor(record.size, mechanics, relax);
  const within = (name: string, value: number, range: readonly [number, number]) => {
    if (value < range[0] || value > range[1]) {
      add(`${value} ${name} outside ${range[0]} to ${range[1]} for ${record.size}x${record.size}`);
    }
  };
  within("lanterns", counts.lanterns, ranges.lanterns);
  within("stones", counts.stones, ranges.stones);
  within("mirrors", counts.mirrors, ranges.mirrors);
  within("gates", counts.gates, ranges.gates);
  if (record.chapter !== "sky" && counts.colours.some((colour) => colour !== "amber")) {
    add("only amber lanterns are allowed before Sky");
  }
  if (record.chapter === "sky") checkSkyColours(record, counts.colours, add);
  const solution = solutionFromRecord(record);
  const tiles = solution.reduce((n, mask) => n + (mask === 0 ? 0 : 1), 0);
  if ((counts.anchors * 100) / tiles > ANCHOR_HARD_LIMIT) {
    add(`anchors ${counts.anchors}/${tiles} exceed ${ANCHOR_HARD_LIMIT}%`);
  }
}

function checkSkyColours(
  record: PuzzleRecord,
  colours: readonly Colour[],
  add: (message: string) => void,
): void {
  for (const colour of colours) {
    if (COLOUR_INTRO[colour] > record.index) add(`${colour} appears before its introduction`);
  }
  for (const [colour, intro] of Object.entries(COLOUR_INTRO) as Array<[Colour, number]>) {
    if (intro === record.index && !colours.includes(colour)) add(`${colour} must be introduced here`);
  }
  if (record.index === 1 && colours.some((colour) => colour !== "amber" && colour !== "rose")) {
    add("Sky 01 uses only amber and rose");
  }
  if (colours.length < SKY_MIN_COLOURS) add("Sky puzzles use at least two lantern colours");
  if (record.index === 27 && colours.length !== 5) add("Sky 27 must use all five colours");
  if (record.index === 30 && colours.length < SKY_MIN_COLOURS) add("Sky 30 must use colours");
}

function checkChapterShape(
  records: readonly PuzzleRecord[],
  sound: ReadonlySet<string>,
  out: ValidationIssue[],
): void {
  const add = (id: string, message: string) => out.push({ id, message });
  for (const chapter of CHAPTER_IDS) {
    const rows = records.filter((record) => record.chapter === chapter);
    const stats = rows.filter((record) => sound.has(record.id)).map((record) => analyseRecord(record));
    if (stats.length > 0) {
      const med = median(stats.map((row) => row.anchorShare));
      if (med > ANCHOR_MEDIAN_LIMIT) add(chapter, `median anchor share ${med}% exceeds ${ANCHOR_MEDIAN_LIMIT}%`);
    }
    const bands: number[][] = [];
    rows.forEach((record, k) => {
      const band = Math.floor(k / BAND_SIZE);
      (bands[band] ??= []).push(record.rating);
    });
    for (let b = 1; b < bands.length; b++) {
      const before = Math.max(...(bands[b - 1] as number[]));
      const after = Math.min(...(bands[b] as number[]));
      if (before > after) add(chapter, `rating falls between band ${b} and band ${b + 1}`);
    }
    const first = rows[0];
    if (first === undefined || !sound.has(first.id)) continue;
    const counts = countClues(puzzleFromRecord(first));
    if (chapter === "garden" && counts.stones === 0) add(first.id, "puzzle 1 must use stones");
    if (chapter === "bridge" && counts.mirrors === 0) add(first.id, "puzzle 1 must use mirrors");
    if (chapter === "sky" && counts.gates === 0) add(first.id, "puzzle 1 must use a gate");
    const last = rows[rows.length - 1];
    if (last === undefined || !sound.has(last.id)) continue;
    const finale = countClues(puzzleFromRecord(last));
    const mech = chapterMechanics(chapter);
    if (finale.lanterns === 0) add(last.id, "finale must use lanterns");
    if (mech.stones && finale.stones === 0) add(last.id, "finale must use stones");
    if (mech.mirrors && finale.mirrors === 0) add(last.id, "finale must use mirrors");
    if (mech.gates && finale.gates === 0) add(last.id, "finale must use gates");
  }
}

/** Every rule about the shipped campaign; empty means valid. Re-proves all puzzles with the solver. */
export function validateCampaign(records: readonly PuzzleRecord[] = CAMPAIGN): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  checkStructure(records, out);
  const sound = new Set<string>();
  for (const record of records) {
    if (!checkBoard(record, out)) continue;
    sound.add(record.id);
    checkMechanics(record, out);
  }
  checkChapterShape(records, sound, out);
  return out;
}

/** The tutorial boards: 4x4, unique, solved by the stored solution. */
export function validateTutorials(records = TUTORIALS): ValidationIssue[] {
  const out: ValidationIssue[] = [];
  for (const record of records) {
    const add = (message: string) => out.push({ id: record.id, message });
    const decoded = decodePuzzle(record.code, record.id);
    if (!decoded.ok) {
      add(`code does not decode: ${decoded.error.message}`);
      continue;
    }
    const puzzle = decoded.value;
    if (puzzle.size !== 4 || record.size !== 4) add("tutorial boards are 4x4");
    if (encodePuzzle(puzzle) !== record.code) add("code does not re-encode to itself");
    const result = solve(puzzle, { limit: 2 });
    if (result.exhausted || result.count !== 1) add(`${result.count} solutions, expected exactly 1`);
    let solution: Uint8Array;
    try {
      solution = solutionFromRecord(record);
    } catch (error) {
      add(`solution does not decode: ${(error as Error).message}`);
      continue;
    }
    if (!evaluate(puzzle, solution).solved) add("stored solution is not solved");
    else if (result.solutions[0] !== undefined && !equalTiles(result.solutions[0], solution)) {
      add("the unique solution differs from the stored solution");
    }
    if (evaluate(puzzle, emptyTiles(puzzle)).solved) add("the initial board is already solved");
  }
  return out;
}
