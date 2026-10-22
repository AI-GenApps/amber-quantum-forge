import type {
  AudioContextLike,
  AudioManager,
  BufferSourceLike,
  GainNodeLike,
  MusicOptions,
  PlayOptions,
  VolumeKind,
  Volumes,
} from "./types";

export interface AudioManagerOptions {
  /** Returns a context, or null when WebAudio is missing. Defaults to the global `AudioContext`. */
  createContext?: () => AudioContextLike | null;
  /** Fetches encoded audio. Defaults to `fetch`. */
  fetchBuffer?: (url: string) => Promise<ArrayBuffer>;
  volumes?: Partial<Volumes>;
  /** Most simultaneous sound effects; the oldest is cut when exceeded (default 16). */
  maxVoices?: number;
}

const DEFAULT_FADE_MS = 800;
const DEFAULT_EVENTS = ["pointerdown", "touchend", "keydown", "click"] as const;

export function defaultCreateContext(): AudioContextLike | null {
  const scope = globalThis as unknown as {
    AudioContext?: new () => AudioContextLike;
    webkitAudioContext?: new () => AudioContextLike;
  };
  const Ctor = scope.AudioContext ?? scope.webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
}

async function defaultFetchBuffer(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Audio request failed: ${response.status}`);
  return response.arrayBuffer();
}

const clamp01 = (value: number): number =>
  Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;

interface Voice {
  source: BufferSourceLike;
  gain: GainNodeLike;
}

interface MusicTrack extends Voice {
  id: string;
}

export function createAudioManager(options: AudioManagerOptions = {}): AudioManager {
  const createContext = options.createContext ?? defaultCreateContext;
  const fetchBuffer = options.fetchBuffer ?? defaultFetchBuffer;
  const maxVoices = options.maxVoices ?? 16;
  const volumes: Volumes = { master: 1, sfx: 1, music: 1, ...options.volumes };
  for (const kind of ["master", "sfx", "music"] as const) volumes[kind] = clamp01(volumes[kind]);

  const buffers = new Map<string, unknown>();
  const voices = new Set<Voice>();
  let soundOn = true;
  let musicOn = true;
  let desired: { id: string; fadeMs: number } | null = null;
  let track: MusicTrack | null = null;
  let wasUnlocked = false;

  let ctx: AudioContextLike | null = null;
  let contextTried = false;
  let master: GainNodeLike | null = null;
  let sfxBus: GainNodeLike | null = null;
  let musicBus: GainNodeLike | null = null;

  const ensure = (): AudioContextLike | null => {
    if (contextTried) return ctx;
    contextTried = true;
    try {
      ctx = createContext();
    } catch {
      ctx = null;
    }
    if (!ctx) return null;
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    master.gain.value = volumes.master;
    sfxBus.gain.value = volumes.sfx;
    musicBus.gain.value = volumes.music;
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(ctx.destination);
    return ctx;
  };

  const running = (): boolean => ctx?.state === "running";

  const disposeVoice = (voice: Voice): void => {
    voices.delete(voice);
    try {
      voice.source.disconnect();
      voice.gain.disconnect();
    } catch {
      // Already disconnected.
    }
  };

  const fadeTo = (gain: GainNodeLike, target: number, fadeMs: number): void => {
    if (!ctx) return;
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(target, now + Math.max(0, fadeMs) / 1000);
  };

  const retire = (old: MusicTrack, fadeMs: number): void => {
    if (!ctx) return;
    fadeTo(old.gain, 0, fadeMs);
    old.source.onended = () => disposeVoice(old);
    try {
      old.source.stop(ctx.currentTime + Math.max(0, fadeMs) / 1000 + 0.02);
    } catch {
      disposeVoice(old);
    }
  };

  const startMusic = (): void => {
    if (!ctx || !musicBus || !desired || !musicOn || !running()) return;
    if (track?.id === desired.id) return;
    const buffer = buffers.get(desired.id);
    if (buffer === undefined) return;
    const { id, fadeMs } = desired;
    if (track) {
      retire(track, fadeMs);
      track = null;
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(musicBus);
    source.start();
    const next: MusicTrack = { id, source, gain };
    track = next;
    fadeTo(gain, 1, fadeMs);
  };

  const silenceMusic = (fadeMs: number): void => {
    if (!track) return;
    retire(track, fadeMs);
    track = null;
  };

  const setBusGain = (kind: VolumeKind): void => {
    const node = kind === "master" ? master : kind === "sfx" ? sfxBus : musicBus;
    if (node) node.gain.value = volumes[kind];
  };

  const manager: AudioManager = {
    get available() {
      return ensure() !== null;
    },
    get unlocked() {
      return running();
    },
    get currentMusic() {
      return track?.id ?? null;
    },
    async unlock() {
      const context = ensure();
      if (!context) return false;
      if (context.state !== "running") {
        try {
          await context.resume();
        } catch {
          return false;
        }
      }
      if (!running()) return false;
      wasUnlocked = true;
      startMusic();
      return true;
    },
    installUnlock(target = globalThis.document, events = DEFAULT_EVENTS) {
      if (!target) return () => undefined;
      const remove = (): void => {
        for (const name of events) target.removeEventListener(name, handler);
      };
      const handler = (): void => {
        void manager.unlock().then((ok) => {
          if (ok) remove();
        });
      };
      for (const name of events) target.addEventListener(name, handler);
      return remove;
    },
    addBuffer(id, buffer) {
      buffers.set(id, buffer);
      if (desired?.id === id) startMusic();
    },
    async load(id, url) {
      const context = ensure();
      if (!context) return false;
      try {
        const encoded = await fetchBuffer(url);
        const decoded = await context.decodeAudioData(encoded);
        manager.addBuffer(id, decoded);
        return true;
      } catch {
        return false;
      }
    },
    has: (id) => buffers.has(id),
    play(id, playOptions: PlayOptions = {}) {
      if (!soundOn || !ctx || !sfxBus || !running()) return false;
      const buffer = buffers.get(id);
      if (buffer === undefined) return false;
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playOptions.rate ?? 1;
      gain.gain.value = clamp01(playOptions.volume ?? 1);
      source.connect(gain);
      gain.connect(sfxBus);
      const voice: Voice = { source, gain };
      source.onended = () => disposeVoice(voice);
      voices.add(voice);
      if (voices.size > maxVoices) {
        const oldest = voices.values().next().value as Voice;
        try {
          oldest.source.stop();
        } catch {
          // Already stopped.
        }
        disposeVoice(oldest);
      }
      source.start();
      return true;
    },
    playMusic(id, musicOptions: MusicOptions = {}) {
      ensure();
      desired = { id, fadeMs: musicOptions.fadeMs ?? DEFAULT_FADE_MS };
      startMusic();
    },
    stopMusic(musicOptions: MusicOptions = {}) {
      desired = null;
      silenceMusic(musicOptions.fadeMs ?? DEFAULT_FADE_MS);
    },
    setVolume(kind, value) {
      volumes[kind] = clamp01(value);
      setBusGain(kind);
    },
    getVolume: (kind) => volumes[kind],
    syncSettings(enabled) {
      const wasSound = soundOn;
      soundOn = enabled.sound;
      musicOn = enabled.music;
      if (wasSound && !soundOn) {
        for (const voice of [...voices]) {
          try {
            voice.source.stop();
          } catch {
            // Already stopped.
          }
          disposeVoice(voice);
        }
      }
      if (!musicOn) silenceMusic(200);
      else startMusic();
    },
    async suspend() {
      if (!ctx || !wasUnlocked || !ctx.suspend) return;
      try {
        await ctx.suspend();
      } catch {
        // Suspending is best effort.
      }
    },
    async resume() {
      if (!ctx || !wasUnlocked) return;
      try {
        await ctx.resume();
      } catch {
        return;
      }
      startMusic();
    },
  };
  return manager;
}
