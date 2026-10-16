import type { SoundId, SoundKind } from "../../src/audio/manifest";

/** One downloaded archive or file, kept in the scratch `--zips` directory for hashing. */
interface Download {
  url: string;
  /** File name inside the `--zips` directory. */
  file: string;
}

/** A CC0 source page. Its licence record is `assets-src/LICENSES/<id>.txt`. */
export interface AudioSource {
  id: string;
  title: string;
  author: string;
  pageUrl: string;
  /** What states the licence: the pack's own License.txt, or the OpenGameArt page. */
  licenceBasis: "pack-license-file" | "opengameart-page";
  downloads: Download[];
}

const KENNEY = "https://kenney.nl/media/pages/assets";
const OGA = "https://opengameart.org/sites/default/files";

export const SOURCES: AudioSource[] = [
  {
    id: "audio-kenney-impact-sounds",
    title: "Kenney Impact Sounds",
    author: "Kenney (www.kenney.nl)",
    pageUrl: "https://kenney.nl/assets/impact-sounds",
    licenceBasis: "pack-license-file",
    downloads: [
      {
        url: `${KENNEY}/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip`,
        file: "kenney_impact-sounds.zip",
      },
    ],
  },
  {
    id: "audio-kenney-interface-sounds",
    title: "Kenney Interface Sounds",
    author: "Kenney (www.kenney.nl)",
    pageUrl: "https://kenney.nl/assets/interface-sounds",
    licenceBasis: "pack-license-file",
    downloads: [
      {
        url: `${KENNEY}/interface-sounds/fa43c1dd4d-1677589452/kenney_interface-sounds.zip`,
        file: "kenney_interface-sounds.zip",
      },
    ],
  },
  {
    id: "audio-kenney-music-jingles",
    title: "Kenney Music Jingles",
    author: "Kenney (www.kenney.nl)",
    pageUrl: "https://kenney.nl/assets/music-jingles",
    licenceBasis: "pack-license-file",
    downloads: [
      {
        url: `${KENNEY}/music-jingles/f37e530b9e-1677590399/kenney_music-jingles.zip`,
        file: "kenney_music-jingles.zip",
      },
    ],
  },
  {
    id: "audio-oga-racing-car-engine-loops",
    title: "racing car engine sound loops (OpenGameArt)",
    author: "domasx2",
    pageUrl: "https://opengameart.org/content/racing-car-engine-sound-loops",
    licenceBasis: "opengameart-page",
    downloads: [
      { url: `${OGA}/loop_0.wav`, file: "loop_0.wav" },
      { url: `${OGA}/loop_4_0.wav`, file: "loop_4_0.wav" },
    ],
  },
  {
    id: "audio-oga-car-sound-effects-pack",
    title: "Car Sound Effects Pack, low quality (OpenGameArt)",
    author: "GGBotNet",
    pageUrl: "https://opengameart.org/content/car-sound-effects-pack-low-quality",
    licenceBasis: "opengameart-page",
    downloads: [{ url: `${OGA}/car_sound_effects_pack.zip`, file: "car_sound_effects_pack.zip" }],
  },
  {
    id: "audio-oga-lofi-hip-hop-loop",
    title: "Lofi Hip Hop Loop (OpenGameArt)",
    author: "omfgdude",
    pageUrl: "https://opengameart.org/content/lofi-hip-hop-loop",
    licenceBasis: "opengameart-page",
    downloads: [{ url: `${OGA}/LofiLoop_2.ogg`, file: "LofiLoop_2.ogg" }],
  },
  {
    id: "audio-oga-chill-lofi-loop",
    title: "Chill lofi inspired [loop edit] (OpenGameArt)",
    author: "qubodup (loop edit of a piece by omfgdude)",
    pageUrl: "https://opengameart.org/content/chill-lofi-inspired-loop-edit",
    licenceBasis: "opengameart-page",
    downloads: [{ url: `${OGA}/chilllofir-loop.ogg`, file: "chilllofir-loop.ogg" }],
  },
];

/** One shipped sound: where it comes from and how it is encoded. */
export interface SoundSpec {
  id: SoundId;
  kind: SoundKind;
  source: string;
  /** Path inside `<raw>/<source>/`. */
  input: string;
  kbps: number;
  /** Sample rate in Hz. */
  rate: number;
  channels: 1 | 2;
}

const spec = (
  id: SoundId,
  kind: SoundKind,
  source: string,
  input: string,
  kbps = 64,
  rate = 44100,
  channels: 1 | 2 = 1,
): SoundSpec => ({ id, kind, source, input, kbps, rate, channels });

export const SOUNDS: SoundSpec[] = [
  spec("engine_idle", "loop", "audio-oga-racing-car-engine-loops", "loop_0.wav"),
  spec("engine_rev", "loop", "audio-oga-racing-car-engine-loops", "loop_4_0.wav"),
  spec("collision_light", "sfx", "audio-kenney-impact-sounds", "Audio/impactMetal_light_000.ogg"),
  spec("collision_medium", "sfx", "audio-kenney-impact-sounds", "Audio/impactMetal_medium_000.ogg"),
  spec("collision_heavy", "sfx", "audio-kenney-impact-sounds", "Audio/impactMetal_heavy_000.ogg"),
  spec("horn", "sfx", "audio-oga-car-sound-effects-pack", "Car_Horn.ogg"),
  spec("checkpoint", "sfx", "audio-kenney-interface-sounds", "Audio/confirmation_002.ogg"),
  spec("pickup", "sfx", "audio-kenney-interface-sounds", "Audio/pluck_001.ogg"),
  spec("ui_tap", "sfx", "audio-kenney-interface-sounds", "Audio/click_001.ogg"),
  spec("success", "sting", "audio-kenney-music-jingles", "Audio/Steel jingles/jingles_STEEL11.ogg"),
  spec(
    "fail",
    "sting",
    "audio-kenney-music-jingles",
    "Audio/Pizzicato jingles/jingles_PIZZI13.ogg",
  ),
  spec("music_menu", "music", "audio-oga-chill-lofi-loop", "chilllofir-loop.ogg", 40, 32000),
  spec("music_drive", "music", "audio-oga-lofi-hip-hop-loop", "LofiLoop_2.ogg", 40, 22050),
];

/** Sounds that ship without a sample, and why. The mapping code still drives them if added. */
export const MISSING: { id: SoundId; reason: string }[] = [
  {
    id: "skid",
    reason:
      "no CC0 tyre-skid sample was found on kenney.nl or OpenGameArt (searched: skid, screech, squeal, tire, brake, drift); see open-questions.md",
  },
];
