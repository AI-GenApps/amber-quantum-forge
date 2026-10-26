import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { ART_SLOTS, type ArtSlotDef } from "@web-games/the-last-window-core";
import sharp from "sharp";
import { type Analysis, analyse, checkIdentity, checkSlot } from "./art-checks";
import {
  decisionTable,
  manifestBody,
  provenanceTable,
  replaceBetween,
  type SlotRecord,
  summary,
} from "./art-docs";

const APP = join(import.meta.dirname, "..");
const ROOT = join(APP, "../..");
const EVIDENCE = join(ROOT, ".agents/resources/2026-10-23/web-games/the-last-window");
const ART_EVIDENCE = join(EVIDENCE, "art");
const MASTERS = join(ART_EVIDENCE, "masters");
const RUNTIME = join(APP, "public/art");
const DEFAULT_INBOX = "/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/the-last-window";

const MASTER_QUALITY = 90;
const RUNTIME_QUALITIES = [82, 78, 74, 70, 66] as const;

interface InboxEntry {
  assetId: string;
  file: string;
  batch: string;
  round: number;
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function inboxDir(): string {
  const flag = process.argv.indexOf("--inbox");
  return flag >= 0 ? (process.argv[flag + 1] ?? DEFAULT_INBOX) : DEFAULT_INBOX;
}

function readInbox(inbox: string): Map<string, InboxEntry> {
  const path = join(inbox, "accepted/manifest.json");
  const entries = new Map<string, InboxEntry>();
  if (!existsSync(path)) return entries;
  const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`${path} is not a list`);
  for (const item of raw as Array<Record<string, unknown>>) {
    const { assetId, file, batch, round } = item;
    if (
      typeof assetId !== "string" ||
      typeof file !== "string" ||
      typeof batch !== "string" ||
      typeof round !== "number"
    ) {
      throw new Error(`${path}: malformed entry ${JSON.stringify(assetId)}`);
    }
    entries.set(assetId, { assetId, file, batch, round });
  }
  return entries;
}

function verdictPath(entry: InboxEntry): string {
  return `${entry.batch}/round-${entry.round}/review/review.md`;
}

/** The slot needs a line in its round's review notes that says ACCEPT and never REJECT. */
function hasAcceptedVerdict(inbox: string, entry: InboxEntry): boolean {
  const path = join(inbox, verdictPath(entry));
  if (!existsSync(path)) return false;
  const pattern = new RegExp(`(?<![\\w-])${entry.assetId}(?![\\w-])`);
  return readFileSync(path, "utf8")
    .split("\n")
    .some((line) => pattern.test(line) && /ACCEPT/i.test(line) && !/REJECT/i.test(line));
}

async function encodeRuntime(
  source: Buffer,
  def: ArtSlotDef,
): Promise<{ buffer: Buffer; quality: number }> {
  const target = def.runtime;
  if (!target) throw new Error(`${def.id} has no runtime size`);
  let last: { buffer: Buffer; quality: number } | null = null;
  for (const quality of RUNTIME_QUALITIES) {
    const buffer = await sharp(source)
      .resize(target.width, target.height, { kernel: "lanczos3", fit: "fill" })
      .webp({ quality, alphaQuality: 100, effort: 5 })
      .toBuffer();
    last = { buffer, quality };
    const found = await analyse(buffer);
    if (checkSlot(def, found, "runtime").every((message) => !message.includes("byte limit"))) {
      return last;
    }
  }
  if (!last) throw new Error(`${def.id}: no quality tried`);
  return last;
}

interface Built {
  record: SlotRecord;
  master: Buffer;
  runtime: Buffer | null;
}

async function buildSlot(
  inbox: string,
  def: ArtSlotDef,
  entry: InboxEntry,
  problems: string[],
  busts: Map<string, Analysis>,
): Promise<Built> {
  const source = readFileSync(join(inbox, "accepted", entry.file));
  const format = (await sharp(source).metadata()).format;
  if (format !== "png") problems.push(`${def.id}: delivered file is ${format}, expected png`);
  const master = await sharp(source)
    .webp({ quality: MASTER_QUALITY, alphaQuality: 100, effort: 5 })
    .toBuffer();
  for (const message of checkSlot(def, await analyse(master), "master")) {
    problems.push(`${def.id} (master): ${message}`);
  }
  let runtime: Buffer | null = null;
  if (def.runtime) {
    const encoded = await encodeRuntime(source, def);
    runtime = encoded.buffer;
    const found = await analyse(runtime);
    for (const message of checkSlot(def, found, "runtime")) {
      problems.push(`${def.id} (runtime q${encoded.quality}): ${message}`);
    }
    if (def.kind === "bust") busts.set(def.id, found);
  }
  const record: SlotRecord = {
    id: def.id,
    status: "accepted",
    batch: entry.batch,
    round: entry.round,
    verdictFile: `review/${entry.batch}-round-${entry.round}.md`,
    runtimeFile: runtime ? `public/art/${def.id}.webp` : "-",
    runtimeBytes: runtime?.length ?? 0,
    masterFile: `masters/${def.id}.webp`,
    masterBytes: master.length,
    masterSha: sha256(master),
    sourceSha: sha256(source),
  };
  return { record, master, runtime };
}

function copyEvidence(inbox: string, built: readonly Built[]): void {
  mkdirSync(join(ART_EVIDENCE, "review"), { recursive: true });
  copyFileSync(join(inbox, "art-bible.md"), join(ART_EVIDENCE, "art-bible.md"));
  copyFileSync(join(inbox, "accepted/manifest.json"), join(ART_EVIDENCE, "accepted-manifest.json"));
  const seen = new Set<string>();
  for (const { record } of built) {
    if (seen.has(record.verdictFile)) continue;
    seen.add(record.verdictFile);
    const name = record.verdictFile.replace("review/", "").replace(".md", "");
    const [batch = "", round = ""] = name.split("-round-");
    copyFileSync(
      join(inbox, batch, `round-${round}`, "review/review.md"),
      join(ART_EVIDENCE, record.verdictFile),
    );
  }
}

function writeFiles(built: readonly Built[]): void {
  mkdirSync(MASTERS, { recursive: true });
  mkdirSync(RUNTIME, { recursive: true });
  const keepMasters = new Set(built.map(({ record }) => `${record.id}.webp`));
  const keepRuntime = new Set(
    built.filter(({ runtime }) => runtime).map(({ record }) => `${record.id}.webp`),
  );
  for (const name of readdirSync(MASTERS)) {
    if (name.endsWith(".webp") && !keepMasters.has(name)) rmSync(join(MASTERS, name));
  }
  for (const name of readdirSync(RUNTIME)) {
    if (name.endsWith(".webp") && !keepRuntime.has(name)) rmSync(join(RUNTIME, name));
  }
  for (const { record, master, runtime } of built) {
    writeFileSync(join(MASTERS, `${record.id}.webp`), master);
    if (runtime) writeFileSync(join(RUNTIME, `${record.id}.webp`), runtime);
  }
}

function writeDocs(records: readonly SlotRecord[]): void {
  replaceBetween(
    join(APP, "src/art/manifest.ts"),
    "// art-manifest:start",
    "// art-manifest:end",
    manifestBody(records),
  );
  replaceBetween(
    join(ROOT, ".agents/games/the-last-window/assets-index.md"),
    "<!-- art-provenance:start -->",
    "<!-- art-provenance:end -->",
    provenanceTable(records),
  );
  replaceBetween(
    join(EVIDENCE, "06/README.md"),
    "<!-- art-decisions:start -->",
    "<!-- art-decisions:end -->",
    `${summary(records)}\n\n${decisionTable(records)}`,
  );
}

async function main(): Promise<void> {
  const inbox = inboxDir();
  const entries = readInbox(inbox);
  const problems: string[] = [];
  const busts = new Map<string, Analysis>();
  const built: Built[] = [];
  const records: SlotRecord[] = [];
  for (const def of ART_SLOTS) {
    const entry = entries.get(def.id);
    if (!entry || !existsSync(join(inbox, "accepted", entry.file))) {
      records.push(emptyRecord(def.id, "missing"));
      continue;
    }
    if (!hasAcceptedVerdict(inbox, entry)) {
      problems.push(`${def.id}: no ACCEPT line in ${verdictPath(entry)}`);
      continue;
    }
    const result = await buildSlot(inbox, def, entry, problems, busts);
    built.push(result);
    records.push(result.record);
  }
  for (const message of checkIdentity(busts)) problems.push(message);
  if (problems.length > 0) {
    throw new Error(`Art checks failed:\n${problems.map((line) => `- ${line}`).join("\n")}`);
  }
  copyEvidence(inbox, built);
  writeFiles(built);
  writeDocs(records);
  console.log(summary(records));
}

function emptyRecord(id: string, status: SlotRecord["status"]): SlotRecord {
  return {
    id,
    status,
    batch: "-",
    round: 0,
    verdictFile: "-",
    runtimeFile: "-",
    runtimeBytes: 0,
    masterFile: "-",
    masterBytes: 0,
    masterSha: "-",
    sourceSha: "-",
  };
}

await main();
