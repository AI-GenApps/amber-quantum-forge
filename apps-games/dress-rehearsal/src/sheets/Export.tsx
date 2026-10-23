import { FRAME_IDS, FRAME_PRICE, FRAMES, type FrameId } from "@web-games/dress-rehearsal-core";
import { Button } from "@web-games/kit";
import { useEffect, useRef, useState } from "preact/hooks";
import { renderBoard } from "../export/render";
import {
  defaultExportEnv,
  type ExportEnv,
  exportFileName,
  renderToBlob,
  saveImage,
  shareImage,
} from "../export/share";
import { EXPORT_SIZE, type ExportInput } from "../export/types";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface ExportSheetProps {
  open: boolean;
  /** Builds the image input for a frame. */
  build: (frame: FrameId) => ExportInput;
  shareText: string;
  onClose: () => void;
}

export function framePrice(frame: FrameId): number {
  return frame === "plain" ? 0 : FRAME_PRICE[frame];
}

function previewContext(env: ExportEnv, canvas: HTMLCanvasElement) {
  if (env.previewContext) return env.previewContext(canvas);
  return null;
}

export function ExportSheet({ open, build, shareText, onClose }: ExportSheetProps) {
  const app = useApp();
  const profile = useProfile();
  const env = app.exportEnv ?? defaultExportEnv();
  const [frame, setFrame] = useState<FrameId>(profile.frameSelected);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const owned = profile.framesOwned.includes(frame);
  const images = app.images;

  // biome-ignore lint/correctness/useExhaustiveDependencies: the preview repaints when the frame or the sheet changes
  useEffect(() => {
    if (open) setFrame(profile.frameSelected);
  }, [open]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: build is rebuilt every render; its inputs are the frame and the art
  useEffect(() => {
    if (!open || !canvas.current) return;
    const context = previewContext(env, canvas.current);
    if (context) {
      try {
        renderBoard(context, { ...build(frame), ...(images ? { images } : {}) }, EXPORT_SIZE);
      } catch {
        setNote(t("exportPreviewFailed"));
      }
    }
  }, [open, frame, images]);

  const input = (): ExportInput => ({ ...build(frame), ...(images ? { images } : {}) });

  const choose = async (next: FrameId): Promise<void> => {
    setFrame(next);
    setNote("");
    if (profile.framesOwned.includes(next) && next !== profile.frameSelected) {
      await app.game.selectFrame(next);
    }
  };

  const buy = async (): Promise<void> => {
    const outcome = await app.game.buyFrame(frame);
    if (!outcome.ok) {
      setNote(outcome.reason === "INSUFFICIENT_COINS" ? t("exportNoCoins") : t("exportBuyFailed"));
      return;
    }
    await app.game.selectFrame(frame);
    setNote(t("exportBought", { name: FRAMES.find((f) => f.id === frame)?.name ?? frame }));
  };

  const share = async (): Promise<void> => {
    setBusy(true);
    try {
      const data = input();
      const blob = await renderToBlob(env, data);
      const outcome = await shareImage({
        env,
        blob,
        filename: exportFileName(data),
        text: shareText,
        title: data.gameTitle,
        shareText: app.share,
      });
      if (outcome === "shared" || outcome === "downloaded" || outcome === "downloaded-text")
        await app.game.recordExport();
      setNote(t(`exportShare_${outcome}`));
    } finally {
      setBusy(false);
    }
  };

  const save = async (): Promise<void> => {
    setBusy(true);
    try {
      const data = input();
      const blob = await renderToBlob(env, data);
      const ok = saveImage(env, blob, exportFileName(data));
      if (ok) await app.game.recordExport();
      setNote(ok ? t("exportSaved") : t("exportSaveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppSheet open={open} onClose={onClose} title={t("exportTitle")} class="dr-export">
      <div class="dr-export__body" data-testid="export">
        <canvas
          ref={canvas}
          class="dr-export__preview"
          data-testid="export-preview"
          width={EXPORT_SIZE.width}
          height={EXPORT_SIZE.height}
          role="img"
          aria-label={t("exportPreviewLabel")}
        />
        <fieldset class="dr-frames">
          <legend class="dr-sr-only">{t("exportFrames")}</legend>
          {FRAME_IDS.map((id) => {
            const name = FRAMES.find((entry) => entry.id === id)?.name ?? id;
            const has = profile.framesOwned.includes(id);
            const price = framePrice(id);
            return (
              <button
                key={id}
                type="button"
                class="dr-frame"
                data-frame={id}
                data-owned={has ? "true" : "false"}
                aria-pressed={frame === id}
                onClick={() => void choose(id)}
              >
                <span class="dr-frame__name">{name}</span>
                <span class="dr-frame__price">
                  {has ? t("framesOwned") : t("framesPrice", { price })}
                </span>
              </button>
            );
          })}
        </fieldset>
        {!owned ? (
          <Button fullWidth onClick={() => void buy()} class="dr-export__buy">
            {t("exportBuy", { price: framePrice(frame) })}
          </Button>
        ) : null}
        {note ? (
          <p role="status" class="dr-note" data-testid="export-note">
            {note}
          </p>
        ) : null}
      </div>
      <div class="dr-sheet__actions dr-sheet__actions--wrap">
        <Button variant="secondary" onClick={onClose}>
          {t("done")}
        </Button>
        <Button variant="secondary" disabled={!owned || busy} onClick={() => void save()}>
          {t("exportSave")}
        </Button>
        <Button disabled={!owned || busy} onClick={() => void share()}>
          {t("exportShare")}
        </Button>
      </div>
    </AppSheet>
  );
}
