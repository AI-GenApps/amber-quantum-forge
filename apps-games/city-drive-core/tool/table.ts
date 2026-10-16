import type { MissionDef } from "../src/index";
import type { Content } from "./content";
import type { Measured } from "./measure";

/** Time (s) by which the mission must be finished to earn the given star level. */
export function starTimeS(m: MissionDef, star: "1" | "2" | "3"): number {
  switch (m.type) {
    case "delivery":
      return round(m.params.time_limit_s - m.stars[star].min_time_left_s);
    case "taxi":
      return round(m.params.time_limit_s - m.stars[star].min_time_left_s);
    case "time_trial":
      return m.stars[star].max_time_s;
    case "parking":
      return m.stars[star].max_time_s;
  }
}

const round = (v: number): number => Math.round(v * 1000) / 1000;

/** Markdown table of every mission: id, type, title, difficulty, autopilot result, star times. */
export function missionTable(
  content: Content,
  rows: readonly { id: string; measured: Measured }[],
): string {
  const lines = [
    "| id | type | title | difficulty | route m | junctions | limit s | autopilot s | autopilot stars | 1 star by s | 2 stars by s | 3 stars by s |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  ];
  for (const district of content.districts) {
    for (const m of district.missions) {
      const row = rows.find((r) => r.id === m.id)?.measured;
      if (!row) continue;
      const v = row.validation;
      lines.push(
        `| ${m.id} | ${m.type} | ${m.title} | ${row.difficulty.toFixed(3)} | ${v.route_length_m} | ${v.intersections} | ${m.params.time_limit_s} | ${v.autopilot_time_s} | ${v.autopilot_stars} | ${starTimeS(m, "1")} | ${starTimeS(m, "2")} | ${starTimeS(m, "3")} |`,
      );
    }
  }
  return lines.join("\n");
}
