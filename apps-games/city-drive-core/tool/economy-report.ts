import { readRoster } from "../test/economy/roster-support";
import { readMissions, readProgression, simulate } from "../test/economy/sim";

const roster = readRoster();
const missions = readMissions();
const progression = readProgression();
const sum = (level: "1" | "2" | "3", district?: string) =>
  missions
    .filter((m) => district === undefined || m.district === district)
    .reduce((total, m) => total + m.reward_coins[level], 0);
const prices = roster.cars.reduce((total, c) => total + c.price, 0);

const out: string[] = [];
out.push(
  "## Cars",
  "",
  "| id | model | name | price | mass kg | engine N | top km/h | brake N | steer rad | grip |",
);
out.push("|---|---|---|---|---|---|---|---|---|---|");
for (const c of roster.cars) {
  const s = {
    mass: 1200,
    engineForce: 6000,
    topSpeedKmh: 115,
    brakeForce: 12000,
    maxSteerAngle: 0.5,
    frictionSlip: 2.6,
    ...c.spec,
  };
  out.push(
    `| \`${c.id}\` | \`${c.model_id}\` | ${c.name} | ${c.price} | ${s.mass} | ${s.engineForce} | ${s.topSpeedKmh} | ${s.brakeForce} | ${s.maxSteerAngle} | ${s.frictionSlip} |`,
  );
}
out.push(
  "",
  "## Mission payouts",
  "",
  "| mission | type | 1 star | 2 stars | 3 stars | replay bonus |",
  "|---|---|---|---|---|---|",
);
for (const m of missions) {
  const r = m.reward_coins;
  out.push(
    `| \`${m.id}\` | ${m.type} | ${r["1"]} | ${r["2"]} | ${r["3"]} | ${Math.round(r["1"] * 0.1)} |`,
  );
}
out.push("", "## Totals", "", "| district | 1 star | 2 stars | 3 stars |", "|---|---|---|---|");
for (const d of progression.districts)
  out.push(`| ${d.id} | ${sum("1", d.id)} | ${sum("2", d.id)} | ${sum("3", d.id)} |`);
out.push(`| all | ${sum("1")} | ${sum("2")} | ${sum("3")} |`);
out.push(
  "",
  `Total car prices: ${prices}. 3-star total / prices = ${(sum("3") / prices).toFixed(3)} (needs >= 1.150).`,
);
for (const level of [1, 2, 3] as const) {
  out.push(
    "",
    `## Simulation: every mission at ${level} star(s), once, buying the cheapest cars after each district`,
    "",
  );
  out.push(
    "| district | earned | bought | coins left | cars owned (paid) | total stars |",
    "|---|---|---|---|---|---|",
  );
  for (const s of simulate(roster, missions, progression, () => level).steps) {
    out.push(
      `| ${s.district} | ${s.earned} | ${s.carsBought.join(", ") || "-"} | ${s.coinsAfter} | ${s.ownedAfter} | ${s.starsAfter} |`,
    );
  }
}
console.log(out.join("\n"));
