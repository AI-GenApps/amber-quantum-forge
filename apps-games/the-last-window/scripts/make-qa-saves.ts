import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildQaSaves, envelope } from "./qa-saves";

const OUT = join(
  import.meta.dirname,
  "../../../.agents/resources/2026-10-23/web-games/the-last-window/qa-saves",
);

mkdirSync(OUT, { recursive: true });
for (const save of buildQaSaves()) {
  writeFileSync(join(OUT, save.file), envelope(save.profile));
  console.info(`${save.file}: ${save.title}`);
}
