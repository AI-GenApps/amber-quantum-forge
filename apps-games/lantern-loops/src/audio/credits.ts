import { AUDIO_RECORDS, type AudioRecord } from "./sources";

export interface AudioCredit {
  pack: string;
  packUrl: string;
  licence: string;
  ids: string[];
}

/** One line per source pack, built from the per-file records. */
export function audioCredits(records: readonly AudioRecord[] = AUDIO_RECORDS): AudioCredit[] {
  const byPack = new Map<string, AudioCredit>();
  for (const record of records) {
    const known = byPack.get(record.packUrl);
    if (known) known.ids.push(record.id);
    else {
      byPack.set(record.packUrl, {
        pack: record.pack,
        packUrl: record.packUrl,
        licence: record.licence,
        ids: [record.id],
      });
    }
  }
  return [...byPack.values()];
}
