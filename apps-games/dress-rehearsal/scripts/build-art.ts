import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import sharp, { type Sharp } from "sharp";
import {
  ART_DIR,
  isSlotId,
  runtimeSize,
  SLOT_IDS,
  type SlotId,
  type SlotKind,
  slotDef,
} from "../src/art/slots";
import { checkRuntime, decode, factsOf } from "./art-checks";
import { type SlotStatus, unacceptedFor } from "./art-verdicts";

const APP_ROOT = resolve(import.meta.dirname, "..");
const REPO_ROOT = resolve(APP_ROOT, "../..");
const EVIDENCE = join(REPO_ROOT, ".agents/resources/2026-10-23/web-games/dress-rehearsal");
const DEFAULT_INBOX = "/Users/ashutosh/Dev/W3DevMobile/aqf-art-inbox/dress-rehearsal";

const PATHS = {
  publicArt: join(APP_ROOT, "public/art"),
  masters: join(EVIDENCE, "art/masters"),
  manifest: join(APP_ROOT, "src/art/manifest.ts"),
  provenance: join(EVIDENCE, "06/provenance.json"),
  assetsIndex: join(REPO_ROOT, ".agents/games/dress-rehearsal/assets-index.md"),
} as const;

const SOURCE_SIZES: Readonly<Record<SlotKind, { width: number; height: number }>> = {
  item: { width: 1024, height: 1024 },
  client: { width: 1024, height: 1536 },
  backdrop: { width: 1024, height: 1536 },
  keyart: { width: 1024, height: 1536 },
  icon: { width: 1024, height: 1024 },
  landscape: { width: 1536, height: 1024 },
};

/** The designer's 3:4 content frame inside the 1024 x 1536 client canvas (art bible section 12). */
const CLIENT_FRAME = { left: 2, top: 85, width: 1020, height: 1360 } as const;
const RUNTIME_QUALITY = 82;
const MASTER_QUALITY = 90;

interface InboxEntry {
  readonly assetId: string;
  readonly file: string;
  readonly batch: string;
  readonly round: number;
}

interface ProvenanceRow {
  readonly slot: SlotId;
  readonly status: SlotStatus;
  readonly batch: string;
  readonly round: number;
  readonly review: string;
  readonly runtimeFile: string;
  readonly runtimeBytes: number;
  readonly runtimeSize: string;
  readonly master: string;
  readonly masterBytes: number;
  readonly masterSha256: string;
  readonly sourceSha256: string;
  readonly sourceSize: string;
  readonly note: string;
}

const sha256 = (data: Buffer): string => createHash("sha256").update(data).digest("hex");

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function readInbox(inbox: string): Map<SlotId, InboxEntry> {
  const manifestPath = join(inbox, "accepted/manifest.json");
  const entries = JSON.parse(readFileSync(manifestPath, "utf8")) as InboxEntry[];
  const found = new Map<SlotId, InboxEntry>();
  for (const entry of entries) {
    if (!isSlotId(entry.assetId)) throw new Error(`${entry.assetId}: not one of the 63 art slots`);
    found.set(entry.assetId, entry);
  }
  const files = readdirSync(join(inbox, "accepted")).filter((name) => name.endsWith(".png"));
  for (const name of files) {
    const id = name.replace(/\.png$/, "");
    if (!isSlotId(id) || !found.has(id)) {
      throw new Error(`${id}: file in accepted/ has no manifest entry or is not a slot`);
    }
  }
  for (const [slot, entry] of found) {
    if (entry.file !== `${slot}.png` || !files.includes(entry.file)) {
      throw new Error(`${slot}: accepted file ${entry.file} is missing`);
    }
  }
  return found;
}

function runtimePipeline(slot: SlotId, source: Buffer): Sharp {
  const def = slotDef(slot);
  const size = runtimeSize(slot);
  if (size === null) throw new Error(`${slot}: store slot has no runtime file`);
  let image = sharp(source);
  if (def.kind === "client") image = image.extract(CLIENT_FRAME);
  return image
    .resize(size.width, size.height, { kernel: "lanczos3", fit: "fill" })
    .webp({ quality: RUNTIME_QUALITY, alphaQuality: 100, effort: 4 });
}

async function checkSource(slot: SlotId, source: Buffer): Promise<void> {
  const meta = await sharp(source).metadata();
  const want = SOURCE_SIZES[slotDef(slot).kind];
  if (meta.width !== want.width || meta.height !== want.height) {
    throw new Error(
      `${slot}: source is ${meta.width} x ${meta.height}, expected ${want.width} x ${want.height}`,
    );
  }
  const transparent = ["item", "client"].includes(slotDef(slot).kind);
  if (transparent && meta.hasAlpha !== true)
    throw new Error(`${slot}: source has no alpha channel`);
}

async function integrate(
  slot: SlotId,
  entry: InboxEntry,
  inbox: string,
  problems: string[],
): Promise<ProvenanceRow> {
  const source = readFileSync(join(inbox, "accepted", entry.file));
  await checkSource(slot, source);
  const master = await sharp(source)
    .webp({ quality: MASTER_QUALITY, alphaQuality: 100, effort: 4 })
    .toBuffer();
  writeFileSync(join(PATHS.masters, `${slot}.webp`), master);
  const size = runtimeSize(slot);
  let runtimeFile = "-";
  let runtimeBytes = 0;
  if (size !== null) {
    const runtime = await runtimePipeline(slot, source).toBuffer();
    const violations = checkRuntime(
      slot,
      await decode(runtime),
      await factsOf(runtime, runtime.byteLength),
    );
    problems.push(...violations);
    writeFileSync(join(PATHS.publicArt, `${slot}.webp`), runtime);
    runtimeFile = `public/art/${slot}.webp`;
    runtimeBytes = runtime.byteLength;
  }
  const meta = await sharp(source).metadata();
  return {
    slot,
    status: "accepted",
    batch: entry.batch,
    round: entry.round,
    review: `art/reviews/${entry.batch}/round-${entry.round}.md`,
    runtimeFile,
    runtimeBytes,
    runtimeSize: size ? `${size.width} x ${size.height}` : "-",
    master: `art/masters/${slot}.webp`,
    masterBytes: master.byteLength,
    masterSha256: sha256(master),
    sourceSha256: sha256(source),
    sourceSize: `${meta.width} x ${meta.height}`,
    note: "",
  };
}

function withoutArt(slot: SlotId): ProvenanceRow {
  const verdict = unacceptedFor(slot);
  return {
    slot,
    status: verdict.status,
    batch: verdict.batch,
    round: verdict.round,
    review: verdict.round > 0 ? `art/reviews/${verdict.batch}/round-${verdict.round}.md` : "-",
    runtimeFile: "-",
    runtimeBytes: 0,
    runtimeSize: "-",
    master: "-",
    masterBytes: 0,
    masterSha256: "-",
    sourceSha256: "-",
    sourceSize: "-",
    note: verdict.reason,
  };
}

function replaceBetween(text: string, begin: string, end: string, body: string): string {
  const from = text.indexOf(begin);
  const to = text.indexOf(end);
  if (from < 0 || to < from) throw new Error(`markers ${begin} / ${end} not found`);
  return `${text.slice(0, from + begin.length)}\n${body}\n${text.slice(to)}`;
}

function manifestBlock(rows: readonly ProvenanceRow[]): string {
  const lines = rows
    .filter((row) => row.status === "accepted" && row.runtimeFile !== "-")
    .map((row) => {
      const [width, height] = row.runtimeSize.split(" x ");
      return `  { slot: "${row.slot}", file: "${ART_DIR}/${row.slot}.webp", width: ${width}, height: ${height} },`;
    });
  return `export const ART_ENTRIES: readonly ArtEntry[] = [\n${lines.join("\n")}\n];`;
}

const kb = (bytes: number): string => (bytes === 0 ? "-" : bytes.toLocaleString("en-US"));

function provenanceTable(rows: readonly ProvenanceRow[]): string {
  const head = [
    "| Slot | Status | Batch / round | Review notes | Runtime file | Runtime bytes | Master (WebP q90) | Master bytes | Master SHA-256 | Fallback or note |",
    "|---|---|---|---|---|---|---|---|---|---|",
  ];
  const body = rows.map((row) => {
    const batch = row.round > 0 ? `${row.batch} / ${row.round}` : "-";
    const note =
      row.status === "accepted"
        ? row.runtimeFile === "-"
          ? "store asset, not in the bundle"
          : "designer art shipped"
        : `code-drawn fallback kept: ${row.note}`;
    const review = row.review === "-" ? "-" : `\`${row.review}\``;
    const file = row.runtimeFile === "-" ? "-" : `\`${row.runtimeFile}\``;
    const master = row.master === "-" ? "-" : `\`${row.master}\``;
    const hash = row.masterSha256 === "-" ? "-" : `\`${row.masterSha256}\``;
    return `| \`${row.slot}\` | ${row.status} | ${batch} | ${review} | ${file} | ${kb(row.runtimeBytes)} | ${master} | ${kb(row.masterBytes)} | ${hash} | ${note} |`;
  });
  return [...head, ...body].join("\n");
}

async function main(): Promise<void> {
  const inbox = argValue("--inbox") ?? DEFAULT_INBOX;
  if (!existsSync(join(inbox, "accepted/manifest.json"))) {
    throw new Error(`no accepted/manifest.json under ${inbox}`);
  }
  const accepted = readInbox(inbox);
  rmSync(PATHS.publicArt, { recursive: true, force: true });
  rmSync(PATHS.masters, { recursive: true, force: true });
  mkdirSync(PATHS.publicArt, { recursive: true });
  mkdirSync(PATHS.masters, { recursive: true });
  mkdirSync(dirname(PATHS.provenance), { recursive: true });
  const rows: ProvenanceRow[] = [];
  const problems: string[] = [];
  for (const slot of SLOT_IDS) {
    const entry = accepted.get(slot);
    rows.push(entry ? await integrate(slot, entry, inbox, problems) : withoutArt(slot));
  }
  if (problems.length > 0) throw new Error(`art checks failed:\n${problems.join("\n")}`);
  writeFileSync(PATHS.provenance, `${JSON.stringify(rows, null, 2)}\n`);
  const manifest = readFileSync(PATHS.manifest, "utf8");
  writeFileSync(
    PATHS.manifest,
    replaceBetween(
      manifest,
      "// art:begin generated by task 06, do not edit by hand",
      "// art:end",
      manifestBlock(rows),
    ),
  );
  const index = readFileSync(PATHS.assetsIndex, "utf8");
  writeFileSync(
    PATHS.assetsIndex,
    replaceBetween(
      index,
      "<!-- provenance:begin -->",
      "<!-- provenance:end -->",
      provenanceTable(rows),
    ),
  );
  const done = rows.filter((row) => row.status === "accepted").length;
  process.stdout.write(`art: ${done} accepted, ${rows.length - done} keep placeholders\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
