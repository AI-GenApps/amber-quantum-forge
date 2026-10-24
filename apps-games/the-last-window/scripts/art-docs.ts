import { readFileSync, writeFileSync } from "node:fs";

export type Status = "accepted" | "rejected" | "missing";

export interface SlotRecord {
  id: string;
  status: Status;
  batch: string;
  round: number;
  /** Evidence copy of the review notes, relative to the art evidence folder. */
  verdictFile: string;
  runtimeFile: string;
  runtimeBytes: number;
  masterFile: string;
  masterBytes: number;
  masterSha: string;
  sourceSha: string;
}

const DASH = "-";

/** Replaces the text between two marker lines in a file and fails loudly if a marker is missing. */
export function replaceBetween(path: string, start: string, end: string, body: string): void {
  const text = readFileSync(path, "utf8");
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from < 0 || to < from) throw new Error(`markers ${start} / ${end} not found in ${path}`);
  const next = `${text.slice(0, from + start.length)}\n${body}\n${text.slice(to)}`;
  if (next !== text) writeFileSync(path, next);
}

export function manifestBody(records: readonly SlotRecord[]): string {
  const ids = records
    .filter((record) => record.status === "accepted" && record.runtimeFile !== DASH)
    .map((record) => `  "${record.id}",`);
  return `export const ART_MANIFEST: readonly SlotId[] = [\n${ids.join("\n")}\n];`;
}

function bytes(value: number): string {
  return value.toLocaleString("en-US");
}

export function provenanceTable(records: readonly SlotRecord[]): string {
  const rows = records.map((record) => {
    const cells =
      record.status !== "accepted"
        ? [`\`${record.id}\``, record.status, ...Array.from({ length: 7 }, () => DASH)]
        : [
            `\`${record.id}\``,
            record.status,
            `${record.batch}, round ${record.round}`,
            `ACCEPTED, \`${record.verdictFile}\``,
            record.runtimeFile === DASH ? DASH : `\`${record.runtimeFile}\``,
            record.runtimeFile === DASH ? DASH : bytes(record.runtimeBytes),
            `\`${record.masterFile}\``,
            bytes(record.masterBytes),
            `\`${record.masterSha}\``,
          ];
    return `| ${cells.join(" | ")} |`;
  });
  const header = [
    "| Slot | Status | Source (batch, round) | Review verdict | Runtime file | Runtime bytes | Master | Master bytes | Master SHA-256 |",
    "|---|---|---|---|---|---|---|---|---|",
  ];
  return [...header, ...rows].join("\n");
}

export function decisionTable(records: readonly SlotRecord[]): string {
  const header = [
    "| Slot | Decision | Batch, round | Delivered PNG SHA-256 | Review notes |",
    "|---|---|---|---|---|",
  ];
  const rows = records.map((record) =>
    record.status === "accepted"
      ? `| \`${record.id}\` | accepted | ${record.batch}, round ${record.round} | \`${record.sourceSha}\` | \`${record.verdictFile}\` |`
      : `| \`${record.id}\` | ${record.status} (placeholder kept) | ${DASH} | ${DASH} | ${DASH} |`,
  );
  return [...header, ...rows].join("\n");
}

export function summary(records: readonly SlotRecord[]): string {
  const count = (status: Status): number =>
    records.filter((record) => record.status === status).length;
  return `Accepted ${count("accepted")}, rejected ${count("rejected")}, missing ${count("missing")} of ${records.length} slots.`;
}
