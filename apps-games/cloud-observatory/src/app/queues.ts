import { useCallback, useRef, useState } from "preact/hooks";
import type { Toast } from "../session/types";
import { t } from "../strings";

export type ToastTone = "info" | "success" | "danger";

export interface ToastItem {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
}

export interface ChapterItem {
  readonly chapter: number;
  readonly title: string;
}

export interface Queues {
  readonly toast: ToastItem | null;
  readonly chapter: ChapterItem | null;
  push(toasts: readonly Toast[]): void;
  message(text: string, tone?: ToastTone): void;
  dismissToast(): void;
  dismissChapter(): void;
}

/** Shows one toast and one chapter card at a time; extra ones wait their turn. */
export function useQueues(onSound: (id: "lore" | "achievement") => void): Queues {
  const [toasts, setToasts] = useState<readonly ToastItem[]>([]);
  const [chapters, setChapters] = useState<readonly ChapterItem[]>([]);
  const counter = useRef(0);
  const sound = useRef(onSound);
  sound.current = onSound;

  const message = useCallback((text: string, tone: ToastTone = "info") => {
    counter.current += 1;
    const item = { id: counter.current, message: text, tone };
    setToasts((queue) => [...queue, item]);
  }, []);

  const push = useCallback(
    (batch: readonly Toast[]) => {
      for (const toast of batch) {
        if (toast.kind === "chapter") {
          setChapters((queue) => [...queue, { chapter: toast.chapter, title: toast.title }]);
        } else if (toast.kind === "lore") {
          sound.current("lore");
          message(t("toast.lore", { title: toast.title }));
        } else {
          sound.current("achievement");
          message(t("toast.achievement", { name: toast.name }), "success");
        }
      }
    },
    [message],
  );

  const dismissToast = useCallback(() => setToasts((queue) => queue.slice(1)), []);
  const dismissChapter = useCallback(() => setChapters((queue) => queue.slice(1)), []);

  return {
    toast: toasts[0] ?? null,
    chapter: chapters[0] ?? null,
    push,
    message,
    dismissToast,
    dismissChapter,
  };
}
