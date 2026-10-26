import type { ShareContent, ShareResult } from "@web-games/kit";
import type { Draw2D } from "./Draw2D";
import { renderBoard } from "./render";
import { EXPORT_SIZE, type ExportInput, type Size } from "./types";

export interface CanvasLike {
  width: number;
  height: number;
  getContext(type: "2d"): Draw2D | null;
  toBlob(callback: (blob: Blob | null) => void, type?: string): void;
}

export interface FileShareData {
  files?: File[];
  text?: string;
  title?: string;
}

export interface FileShareNavigator {
  share?: (data: FileShareData) => Promise<void>;
  canShare?: (data: FileShareData) => boolean;
}

export interface ExportEnv {
  createCanvas(width: number, height: number): CanvasLike | null;
  navigator?: FileShareNavigator | undefined;
  createFile(blob: Blob, name: string): File | null;
  /** Context for the on-screen preview canvas; null where canvas is unavailable. */
  previewContext?(canvas: HTMLCanvasElement): Draw2D | null;
  download(blob: Blob, filename: string): boolean;
}

export function defaultExportEnv(): ExportEnv {
  return {
    createCanvas(width, height) {
      if (typeof document === "undefined") return null;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      return canvas as unknown as CanvasLike;
    },
    navigator: globalThis.navigator as FileShareNavigator | undefined,
    previewContext(canvas) {
      try {
        return canvas.getContext("2d") as unknown as Draw2D | null;
      } catch {
        return null;
      }
    },
    createFile(blob, name) {
      try {
        return new File([blob], name, { type: "image/png" });
      } catch {
        return null;
      }
    },
    download(blob, filename) {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        return true;
      } catch {
        return false;
      }
    },
  };
}

/** Draws into a fresh canvas; null when the platform has no canvas or the draw fails. */
export function paintTo(
  env: ExportEnv,
  input: ExportInput,
  size: Size = EXPORT_SIZE,
): CanvasLike | null {
  try {
    const canvas = env.createCanvas(size.width, size.height);
    const context = canvas?.getContext("2d") ?? null;
    if (!canvas || !context) return null;
    renderBoard(context, input, size);
    return canvas;
  } catch {
    return null;
  }
}

/** PNG blob of the export image, or null when canvas export is unavailable. */
export async function renderToBlob(
  env: ExportEnv,
  input: ExportInput,
  size: Size = EXPORT_SIZE,
): Promise<Blob | null> {
  const canvas = paintTo(env, input, size);
  if (!canvas) return null;
  return new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), "image/png");
    } catch {
      resolve(null);
    }
  });
}

export type ShareOutcome =
  | "shared"
  | "downloaded"
  | "downloaded-text"
  | "text-only"
  | "cancelled"
  | "failed";

export function exportFileName(input: ExportInput): string {
  const slug = input.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `dress-rehearsal-${slug || "look"}.png`;
}

function isAbort(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

export interface ShareImageArgs {
  env: ExportEnv;
  blob: Blob | null;
  filename: string;
  text: string;
  title: string;
  shareText: (content: ShareContent) => Promise<ShareResult>;
}

/**
 * Shares the PNG through the Web Share API with files when the browser can, otherwise saves it as
 * a download and sends the share text through the kit share path. Never throws.
 */
export async function shareImage(args: ShareImageArgs): Promise<ShareOutcome> {
  const { env, blob, filename, text, title, shareText } = args;
  const nav = env.navigator;
  if (blob && nav && typeof nav.share === "function") {
    const file = env.createFile(blob, filename);
    if (file) {
      try {
        const data: FileShareData = { files: [file], text, title };
        if (!nav.canShare || nav.canShare(data)) {
          await nav.share(data);
          return "shared";
        }
      } catch (error) {
        if (isAbort(error)) return "cancelled";
      }
    }
  }
  let saved = false;
  if (blob) saved = env.download(blob, filename);
  try {
    const result = await shareText({ title, text });
    if (result.cancelled) return saved ? "downloaded" : "cancelled";
    if (saved) return result.ok ? "downloaded-text" : "downloaded";
    return result.ok ? "text-only" : "failed";
  } catch {
    return saved ? "downloaded" : "failed";
  }
}

/** Saves the PNG as a download ("Save to device"). */
export function saveImage(env: ExportEnv, blob: Blob | null, filename: string): boolean {
  if (!blob) return false;
  try {
    return env.download(blob, filename);
  } catch {
    return false;
  }
}
