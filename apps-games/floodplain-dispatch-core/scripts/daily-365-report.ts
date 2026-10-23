import { dailySeedOf, weekdayOfDateKey } from "../src/daily/dates";
import { generateDaily, provesThreeStars } from "../src/daily/generate";
import { tierFor } from "../src/daily/tiers";
import { validateDailyMap } from "../src/daily/validate";

const START = process.argv[2] ?? "2026-01-01";
const DAYS = Number(process.argv[3] ?? 365);

function plusDays(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

const sims: number[] = [];
const byWeekday = new Map<number, { count: number; par: number; ms: number; attempts: number }>();
let fallbacks = 0;
let unproven = 0;
const began = performance.now();
for (let i = 0; i < DAYS; i++) {
  const dateKey = plusDays(START, i);
  const weekday = weekdayOfDateKey(dateKey) ?? 0;
  const t = performance.now();
  const puzzle = generateDaily(dailySeedOf(dateKey), tierFor(weekday));
  const ms = performance.now() - t;
  if (puzzle.fallback !== null) fallbacks++;
  if (!provesThreeStars(puzzle.map)) unproven++;
  const issues = validateDailyMap(puzzle.map, tierFor(weekday));
  if (issues.length > 0) console.log(dateKey, JSON.stringify(issues));
  sims.push(puzzle.sims);
  const row = byWeekday.get(weekday) ?? { count: 0, par: 0, ms: 0, attempts: 0 };
  row.count++;
  row.par += puzzle.map.par;
  row.ms += ms;
  row.attempts += puzzle.attempt + 1;
  byWeekday.set(weekday, row);
}
sims.sort((a, b) => a - b);
console.log(`dates ${DAYS} from ${START}`);
console.log(`fallbacks ${fallbacks}, unproven ${unproven}`);
console.log(
  `sims min ${sims[0]}, median ${sims[Math.floor(sims.length / 2)]}, max ${sims[sims.length - 1]}`,
);
console.log(`total ${Math.round(performance.now() - began)} ms`);
for (const [weekday, row] of [...byWeekday].sort((a, b) => a[0] - b[0])) {
  console.log(
    `weekday ${weekday}: ${row.count} dates, avg par ${(row.par / row.count).toFixed(1)}, avg attempts ${(row.attempts / row.count).toFixed(2)}, avg ${Math.round(row.ms / row.count)} ms`,
  );
}
