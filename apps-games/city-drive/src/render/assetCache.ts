import type { AssetContainer } from "@babylonjs/core/assetContainer.js";
import { LoadAssetContainerAsync } from "@babylonjs/core/Loading/sceneLoader.js";
import type { Scene } from "@babylonjs/core/scene.js";
import "@babylonjs/loaders/glTF/2.0/glTFLoader.js";
import "@babylonjs/loaders/glTF/2.0/Extensions/KHR_texture_transform.js";
import type { AssetManifest, ModelEntry } from "../assets/manifest";

/** Returns the raw GLB bytes for a manifest `file` (relative to `public/assets`). */
export type LoadBytes = (file: string) => Promise<Uint8Array>;

/** Loads every requested manifest model exactly once and keeps the containers by id. */
export class AssetCache {
  private readonly containers = new Map<string, AssetContainer>();

  private constructor(
    readonly manifest: AssetManifest,
    private readonly scene: Scene,
  ) {}

  static async load(
    scene: Scene,
    manifest: AssetManifest,
    ids: Iterable<string>,
    loadBytes: LoadBytes,
  ): Promise<AssetCache> {
    const cache = new AssetCache(manifest, scene);
    for (const id of new Set(ids)) {
      await cache.add(id, loadBytes);
    }
    return cache;
  }

  private async add(id: string, loadBytes: LoadBytes): Promise<void> {
    const entry = this.entry(id);
    const bytes = await loadBytes(entry.file);
    const container = await LoadAssetContainerAsync(bytes, this.scene, {
      pluginExtension: ".glb",
      name: id,
    });
    this.containers.set(id, container);
  }

  entry(id: string): ModelEntry {
    const entry = this.manifest.models.find((model) => model.id === id);
    if (!entry) throw new Error(`asset cache: model "${id}" is not in the manifest`);
    return entry;
  }

  container(id: string): AssetContainer {
    const container = this.containers.get(id);
    if (!container) throw new Error(`asset cache: model "${id}" was not loaded`);
    return container;
  }

  loadedIds(): string[] {
    return [...this.containers.keys()];
  }

  /** Frees the source containers (their meshes, materials and textures). */
  dispose(): void {
    for (const container of this.containers.values()) container.dispose();
    this.containers.clear();
  }
}
