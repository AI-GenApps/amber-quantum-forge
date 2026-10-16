import type { AudioManifest, SoundId } from "./manifest";
import { type EngineParams, MUSIC_LEVEL, musicTarget } from "./mapping";
import { ALL_ON, Mixer, type MixerToggles } from "./mixer";
import { LoopVoice, playOnce } from "./voices";
import type { BufferLike, ContextLike } from "./webaudio";

export type MusicId = Extract<SoundId, "music_menu" | "music_drive">;

export interface AudioDeps {
  /** Makes the audio context; undefined when the platform has no Web Audio. */
  createContext(): ContextLike | undefined;
  /** Fetches one shipped file by its name in the manifest. */
  loadBytes(file: string): Promise<Uint8Array>;
  manifest: AudioManifest;
}

/** The surface the rest of the game uses, so tests and the director can swap in a fake. */
export interface AudioPort {
  unlock(): Promise<void>;
  setToggles(toggles: MixerToggles): void;
  play(id: SoundId, gain?: number): boolean;
  setEngine(params: EngineParams | undefined): void;
  setSkid(gain: number): void;
  playMusic(id: MusicId | undefined): void;
  setDucked(ducked: boolean): void;
}

function exactBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

/**
 * Plain Web Audio mixer: one-shots, two crossfaded engine loops, a skid loop and two music loops.
 * Nothing sounds before `unlock()` (the first user gesture); requests made earlier are kept and
 * applied once the sounds are decoded. A sound that fails to load is logged and stays silent.
 */
export class AudioManager implements AudioPort {
  private ctx: ContextLike | undefined;
  private mixer: Mixer | undefined;
  private unlocking: Promise<void> | undefined;
  private toggles: MixerToggles = ALL_ON;
  private ducked = false;
  private wantedMusic: MusicId | undefined;
  private engineWanted: EngineParams | undefined;
  private skidWanted = 0;
  private readonly buffers = new Map<SoundId, BufferLike>();
  private readonly loops = new Map<SoundId, LoopVoice>();
  private readonly failed = new Set<SoundId>();

  constructor(private readonly deps: AudioDeps) {}

  /** True once the context runs and the sounds are decoded. */
  get ready(): boolean {
    return this.mixer !== undefined && this.buffers.size + this.failed.size >= this.shipped;
  }

  private get shipped(): number {
    return this.deps.manifest.sounds.length;
  }

  has(id: SoundId): boolean {
    return this.buffers.has(id);
  }

  /** Creates and resumes the context, then decodes every sound. Safe to call again. */
  unlock(): Promise<void> {
    this.unlocking ??= this.start().catch((error: unknown) => {
      this.unlocking = undefined;
      throw error;
    });
    return this.unlocking;
  }

  setToggles(toggles: MixerToggles): void {
    this.toggles = toggles;
    this.mixer?.setToggles(toggles);
  }

  /** One-shot effect or sting. False when nothing played (locked, missing or muted bus). */
  play(id: SoundId, gain = 1): boolean {
    const { ctx, mixer } = this;
    const buffer = this.buffers.get(id);
    if (!ctx || !mixer || !buffer || !this.toggles.master || !this.toggles.sfx) return false;
    playOnce(ctx, buffer, mixer.sfx, gain);
    return true;
  }

  /** Engine loudness and pitch for this step; undefined silences it (menus, pause). */
  setEngine(params: EngineParams | undefined): void {
    this.engineWanted = params;
    this.applyEngine();
  }

  setSkid(gain: number): void {
    this.skidWanted = gain;
    this.applySkid();
  }

  playMusic(id: MusicId | undefined): void {
    this.wantedMusic = id;
    this.applyMusic();
  }

  setDucked(ducked: boolean): void {
    if (ducked === this.ducked && this.mixer) return;
    this.ducked = ducked;
    this.mixer?.setMusicLevel(musicTarget(ducked));
  }

  dispose(): void {
    for (const loop of this.loops.values()) loop.stop();
    this.loops.clear();
    void this.ctx?.close();
    this.ctx = undefined;
    this.mixer = undefined;
  }

  private async start(): Promise<void> {
    const ctx = this.deps.createContext();
    if (!ctx) {
      console.warn("City Drive: Web Audio is not available; the game stays silent");
      return;
    }
    if (ctx.state !== "running") await ctx.resume();
    this.ctx = ctx;
    this.mixer = new Mixer(ctx);
    this.mixer.setToggles(this.toggles);
    this.mixer.setMusicLevel(this.ducked ? musicTarget(true) : MUSIC_LEVEL);
    await Promise.all(
      this.deps.manifest.sounds.map((entry) => this.decode(ctx, entry.id, entry.file)),
    );
    this.applyEngine();
    this.applySkid();
    this.applyMusic();
  }

  private async decode(ctx: ContextLike, id: SoundId, file: string): Promise<void> {
    try {
      const bytes = await this.deps.loadBytes(file);
      this.buffers.set(id, await ctx.decodeAudioData(exactBuffer(bytes)));
    } catch (error) {
      this.failed.add(id);
      console.warn(`City Drive: sound "${id}" (${file}) could not load and stays silent`, error);
    }
  }

  private loop(id: SoundId, output: "sfx" | "music"): LoopVoice | undefined {
    const { ctx, mixer } = this;
    const buffer = this.buffers.get(id);
    if (!ctx || !mixer || !buffer) return undefined;
    let voice = this.loops.get(id);
    if (!voice) {
      voice = new LoopVoice(ctx, buffer, mixer[output]);
      this.loops.set(id, voice);
    }
    return voice;
  }

  private applyEngine(): void {
    const { ctx } = this;
    if (!ctx) return;
    const params = this.engineWanted;
    if (!params && !this.loops.has("engine_idle")) return;
    const idle = this.loop("engine_idle", "sfx");
    const rev = this.loop("engine_rev", "sfx");
    const volume = params ? params.volume * 0.5 : 0;
    idle?.set(ctx, volume * (params?.idleGain ?? 0), params?.rate);
    rev?.set(ctx, volume * (params?.revGain ?? 0), params?.rate);
  }

  private applySkid(): void {
    if (!this.ctx) return;
    this.loop("skid", "sfx")?.set(this.ctx, this.skidWanted * 0.6);
  }

  private applyMusic(): void {
    if (!this.ctx) return;
    for (const id of ["music_menu", "music_drive"] as const) {
      const wanted = this.wantedMusic === id;
      if (wanted || this.loops.has(id)) this.loop(id, "music")?.set(this.ctx, wanted ? 1 : 0);
    }
  }
}
