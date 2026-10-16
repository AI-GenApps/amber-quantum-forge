/** Every sound the game can play. A sound missing from the shipped manifest is simply silent. */
export const SOUND_IDS = [
  "engine_idle",
  "engine_rev",
  "skid",
  "collision_light",
  "collision_medium",
  "collision_heavy",
  "horn",
  "checkpoint",
  "pickup",
  "success",
  "fail",
  "ui_tap",
  "music_menu",
  "music_drive",
] as const;
export type SoundId = (typeof SOUND_IDS)[number];

export type SoundKind = "loop" | "sfx" | "sting" | "music";

export interface SoundEntry {
  id: SoundId;
  /** File name inside `public/assets/audio/`. */
  file: string;
  kind: SoundKind;
  bytes: number;
  sha256: string;
  durationS: number;
  /** Licence record id: `assets-src/LICENSES/<source>.txt` holds URL, author, date and hashes. */
  source: string;
}

/** A sound made at run time, so it has no licence record. */
interface ProceduralEntry {
  id: SoundId;
  note: string;
}

export interface AudioManifest {
  version: 1;
  totalBytes: number;
  sounds: SoundEntry[];
  procedural: ProceduralEntry[];
}

/** The most audio the game may ship, in bytes ("at most 3 MB"). */
export const MAX_AUDIO_BYTES = 3_000_000;

const KINDS: readonly SoundKind[] = ["loop", "sfx", "sting", "music"];

/** Problems with a manifest: shape, ids, hashes, the byte total and licence coverage. */
export function validateAudioManifest(
  manifest: AudioManifest,
  licenceIds: ReadonlySet<string>,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  let total = 0;
  for (const sound of manifest.sounds) {
    if (!SOUND_IDS.includes(sound.id)) problems.push(`unknown sound id "${sound.id}"`);
    if (seen.has(sound.id)) problems.push(`duplicate sound id "${sound.id}"`);
    seen.add(sound.id);
    if (!sound.file.endsWith(".mp3")) problems.push(`${sound.id}: ${sound.file} is not an .mp3`);
    if (!KINDS.includes(sound.kind)) problems.push(`${sound.id}: bad kind "${sound.kind}"`);
    if (!/^[0-9a-f]{64}$/.test(sound.sha256)) problems.push(`${sound.id}: bad SHA-256`);
    if (!(sound.bytes > 0)) problems.push(`${sound.id}: no bytes`);
    if (!licenceIds.has(sound.source)) {
      problems.push(`${sound.id}: no licence record "${sound.source}"`);
    }
    total += sound.bytes;
  }
  for (const entry of manifest.procedural) {
    if (seen.has(entry.id)) problems.push(`${entry.id} is both shipped and procedural`);
    if (!entry.note.startsWith("procedural (no licence needed)")) {
      problems.push(`${entry.id}: a procedural note must start "procedural (no licence needed)"`);
    }
  }
  if (total !== manifest.totalBytes) {
    problems.push(`totalBytes ${manifest.totalBytes} does not match the files (${total})`);
  }
  if (total > MAX_AUDIO_BYTES) {
    problems.push(`audio is ${total} bytes, over the ${MAX_AUDIO_BYTES} byte budget`);
  }
  return problems;
}
