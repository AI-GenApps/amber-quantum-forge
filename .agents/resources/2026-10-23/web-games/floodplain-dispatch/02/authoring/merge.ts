import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { decorate } from "./deco";
import { loadSpecs } from "./spec";

mkdirSync("merged_out", { recursive: true });
for (const spec of loadSpecs()) {
  const fin2 = `final_out2/${spec.id}.jsonl`;
  const fin = existsSync(fin2) ? fin2 : `final_out/${spec.id}.jsonl`;
  const raw = `out/${spec.id}.jsonl`;
  if (existsSync(fin)) {
    const lines = readFileSync(fin, "utf8").trim().split("\n");
    writeFileSync(`merged_out/${spec.id}.jsonl`, `${lines[lines.length - 1]}\n`);
  } else if (existsSync(raw)) {
    const rec = JSON.parse(readFileSync(raw, "utf8").trim().split("\n")[0] as string);
    rec.layout = decorate(rec, rec.seed);
    writeFileSync(`merged_out/${spec.id}.jsonl`, `${JSON.stringify(rec)}\n`);
  } else console.log("missing", spec.id);
}
