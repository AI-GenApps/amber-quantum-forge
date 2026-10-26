import {
  type Category,
  challengeUnlocked,
  HINT_PRICE,
  type Look,
  nextChallengeId,
  openSlots,
  PIECE_BY_ID,
  type ProgressEvent,
  pickHint,
  type ScoreResult,
  type Slot,
  scoreLook,
  TRAY_TAB_ORDER,
} from "@web-games/dress-rehearsal-core";
import { useToast } from "@web-games/kit";
import { useCallback, useMemo, useRef, useState } from "preact/hooks";
import { progressFeedback, resultFeedback, STAR_STAGGER_MS } from "../audio/events";
import { lookCues } from "../audio/lookCues";
import { announceHistory, announcePlaced, announceRefused, announceRemoved } from "../board/a11y";
import { type BoardView, buildView, pieceOf, SLOT_LABELS } from "../board/model";
import {
  type BoardAction,
  type BoardContext,
  type BoardEvent,
  type BoardState,
  initialBoard,
  lookOf,
  reduceBoard,
} from "../board/state";
import { useApp, useFeedback, useProfile } from "../state/app";
import type { Session } from "../state/session";
import { t } from "../strings";

export interface FinishState {
  readonly score: ScoreResult;
  readonly events: readonly ProgressEvent[];
  readonly streak: number | null;
  readonly look: Look;
  readonly nextId: string | null;
  readonly savedId: string | null;
  readonly note: string;
}

export interface Landing {
  readonly slot: Slot;
  readonly n: number;
}

function firstTab(session: Session): Category {
  const open = openSlots(session.challenge.slotSet);
  return TRAY_TAB_ORDER.find((category) => open.includes(category)) ?? "top";
}

export function lookKey(look: Look): string {
  return Object.entries(look)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slot, id]) => `${slot}=${id}`)
    .join("|");
}

export interface StylingHooks {
  readonly onPlaced?: () => void;
  readonly onFinished?: () => void;
}

export function useStyling(session: Session, hooks: StylingHooks = {}) {
  const app = useApp();
  const profile = useProfile();
  const toast = useToast();
  const feedback = useFeedback();
  const [landing, setLanding] = useState<Landing | null>(null);
  const ctx = useMemo<BoardContext>(
    () => ({ set: session.challenge.slotSet, pieces: PIECE_BY_ID }),
    [session],
  );
  const [state, setState] = useState<BoardState>(() => initialBoard({}, firstTab(session)));
  const stateRef = useRef(state);
  const [live, setLive] = useState("");
  const [finish, setFinish] = useState<FinishState | null>(null);
  const [settled, setSettled] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const look = lookOf(state);
  const view: BoardView = useMemo(() => buildView(session.challenge, look), [session, look]);

  const react = (event: BoardEvent, before: BoardView, after: BoardView): void => {
    switch (event.type) {
      case "placed":
        feedback.fire({ type: event.replaced === null ? "place" : "swap" });
        hooks.onPlaced?.();
        setLanding((current) => ({ slot: event.slot, n: (current?.n ?? 0) + 1 }));
        setLive(
          announcePlaced(
            event.piece,
            event.slot,
            pieceOf(event.replaced ?? undefined),
            before.preview,
            after.preview,
          ),
        );
        break;
      case "removed":
        feedback.fire({ type: "remove" });
        setLive(announceRemoved(event.piece, event.slot, before.preview, after.preview));
        break;
      case "refused": {
        feedback.fire({ type: "invalid" });
        const message =
          event.reason === "SLOT_CLOSED"
            ? t("toastSlotClosed", { slot: SLOT_LABELS[event.slot] })
            : announceRefused(event.piece, event.slot);
        toast.show(message, "danger");
        setLive(message);
        break;
      }
      case "history":
        setLive(announceHistory(event.action, before.preview, after.preview));
        break;
      case "selected":
        feedback.fire({ type: "pick" });
        setLive(t("announceSelected", { piece: event.piece.name }));
        break;
      case "tab-opened":
        feedback.fire({ type: "tab" });
        setLive(t("announceTab", { slot: SLOT_LABELS[event.slot] }));
        break;
      default:
        break;
    }
    if (event.type === "placed" || event.type === "removed" || event.type === "history") {
      for (const cue of lookCues(before.preview, after.preview)) {
        feedback.fireLater(cue.event, cue.delayMs);
      }
    }
  };

  const reactRef = useRef(react);
  reactRef.current = react;

  const dispatch = useCallback(
    (action: BoardAction): BoardEvent => {
      const before = stateRef.current;
      const result = reduceBoard(ctx, before, action);
      stateRef.current = result.state;
      setState(result.state);
      if (result.event.type !== "none") {
        reactRef.current(
          result.event,
          buildView(session.challenge, lookOf(before)),
          buildView(session.challenge, lookOf(result.state)),
        );
      }
      return result.event;
    },
    [ctx, session],
  );

  const hintKind = session.kind === "daily" ? "daily" : "campaign";
  const hintPrice = HINT_PRICE[hintKind];

  const buyHint = async (): Promise<"revealed" | "none" | "broke"> => {
    const current = lookOf(stateRef.current);
    const hint = pickHint(session.challenge, session.closet, current, session.challenge.reference);
    if (hint === null) {
      toast.show(t("toastHintNone"), "info");
      return "none";
    }
    const paid = await app.game.buyHint(hintKind);
    if (!paid.ok) {
      toast.show(t("toastHintBroke"), "danger");
      return "broke";
    }
    const piece = pieceOf(hint.pieceId);
    if (piece) {
      dispatch({ type: "set-tab", tab: piece.category });
      dispatch({ type: "set-hint", hint: { pieceId: hint.pieceId, slot: hint.slot } });
      setLive(t("announceHint", { piece: piece.name, slot: SLOT_LABELS[hint.slot] }));
    }
    feedback.fire({ type: "hint" });
    return "revealed";
  };

  const finishLook = async (): Promise<FinishState | null> => {
    if (busy) return null;
    const current = lookOf(stateRef.current);
    const score = scoreLook(session.challenge, PIECE_BY_ID, current);
    if (!score.complete) return null;
    feedback.fire({ type: "finish" });
    setBusy(true);
    try {
      const streakBefore = app.game.getState().profile.daily.streak;
      const spend = buildView(session.challenge, current).spend;
      const update =
        session.kind === "daily"
          ? await app.game.recordDailyResult({
              stars: score.stars,
              harmony: score.harmony.total,
              ...(session.dateKey ? { dateKey: session.dateKey } : {}),
            })
          : await app.game.recordCampaignResult(session.challenge.id, {
              stars: score.stars,
              harmony: score.harmony.total,
              spend,
            });
      const after = app.game.getState().profile;
      const candidate = session.kind === "campaign" ? nextChallengeId(session.challenge.id) : null;
      const nextId =
        candidate !== null && score.stars >= 1 && challengeUnlocked(after, candidate)
          ? candidate
          : null;
      const outcome: FinishState = {
        score,
        events: update.events,
        streak: session.kind === "daily" ? after.daily.streak : null,
        look: current,
        nextId,
        savedId: null,
        note: "",
      };
      const streakUp = outcome.streak !== null && outcome.streak > streakBefore;
      for (const entry of resultFeedback(score.stars)) {
        feedback.fireLater(entry.event, entry.delayMs);
      }
      const settleMs = Math.max(1, score.stars) * STAR_STAGGER_MS + 250;
      progressFeedback(update.events, streakUp).forEach((event, i) => {
        feedback.fireLater(event, settleMs + i * 200);
      });
      hooks.onFinished?.();
      setFinish(outcome);
      setSettled(lookKey(current));
      setLive(t("announceResult", { stars: score.stars, harmony: score.harmony.total }));
      return outcome;
    } finally {
      setBusy(false);
    }
  };

  const saveBoard = async (): Promise<void> => {
    if (!finish) return;
    const result = await app.game.saveBoard({
      kind: session.kind,
      ref: session.kind === "daily" ? (session.dateKey ?? "") : session.challenge.id,
      look: finish.look,
      stars: finish.score.stars,
      harmony: finish.score.harmony.total,
    });
    if (result.ok) {
      setFinish({ ...finish, savedId: result.entry.id, note: t("noteSaved") });
    } else {
      setFinish({
        ...finish,
        note: result.reason === "GALLERY_FULL" ? t("noteGalleryFull") : t("noteSaveFailed"),
      });
    }
  };

  const hasPieces = Object.keys(look).length > 0;
  const needsConfirm = hasPieces && lookKey(look) !== settled;

  return {
    state,
    view,
    look,
    dispatch,
    live,
    toast,
    finish,
    landing,
    setFinish,
    finishLook,
    saveBoard,
    buyHint,
    hintPrice,
    coins: profile.coins,
    hasPieces,
    needsConfirm,
    busy,
  };
}
