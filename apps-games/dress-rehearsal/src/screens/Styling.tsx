import { CLIENT_IDS, challengeUnlocked, type Slot } from "@web-games/dress-rehearsal-core";
import { Button, IconButton, localDateKey, Screen, Toast } from "@web-games/kit";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { Board } from "../board/Board";
import { type DragSource, useDrag } from "../board/drag";
import { HarmonyMeter } from "../board/HarmonyMeter";
import { keyIntent } from "../board/keyboard";
import { pieceOf } from "../board/model";
import { RuleChips } from "../board/RuleChips";
import { moveFocus, Tray } from "../board/Tray";
import { sessionExportInput, sessionShareText } from "../export/inputs";
import { useMotion } from "../motion/useMotion";
import type { StylingTarget } from "../nav";
import { Coachmark } from "../onboarding/Coachmark";
import { RuleCardSheet } from "../onboarding/cards";
import { useOnboarding } from "../onboarding/useOnboarding";
import { Brief } from "../sheets/Brief";
import { Confirm } from "../sheets/Confirm";
import { ExportSheet } from "../sheets/Export";
import { HintConfirm } from "../sheets/HintConfirm";
import { Pause } from "../sheets/Pause";
import { Result } from "../sheets/Result";
import { useApp, useFeedback, useProfile } from "../state/app";
import { resolveSession, type Session } from "../state/session";
import { useBack } from "../state/useBack";
import { t } from "../strings";
import { CoinBadge } from "../ui/Header";
import { Icon } from "../ui/Icon";
import { PieceArt } from "../ui/PieceBits";
import { accentStyle } from "./styleVars";
import { useStyling } from "./useStyling";

function NotFound({ message }: { message: string }) {
  const { router } = useApp();
  return (
    <Screen name="styling">
      <p class="dr-note">{message}</p>
      <Button onClick={() => router.pop()}>{t("back")}</Button>
    </Screen>
  );
}

export function Styling({ target }: { target: StylingTarget }) {
  const app = useApp();
  const profile = useProfile();
  const dateKey = localDateKey(app.clock());
  // biome-ignore lint/correctness/useExhaustiveDependencies: the closet is fixed when the board opens so a daily never changes mid-look
  const session = useMemo(
    () => resolveSession(target, profile, dateKey),
    [JSON.stringify(target), dateKey],
  );
  if (session === null) return <NotFound message={t("stylingMissing")} />;
  if (session.kind === "campaign" && !challengeUnlocked(profile, session.challenge.id)) {
    return <NotFound message={t("stylingLocked")} />;
  }
  return <StylingBoard session={session} />;
}

function StylingBoard({ session }: { session: Session }) {
  const app = useApp();
  const { router } = app;
  const feedback = useFeedback();
  const motion = useMotion();
  const onboarding = useOnboarding(session);
  const { notify } = onboarding;
  const styling = useStyling(session, {
    onPlaced: () => notify({ type: "placed" }),
    onFinished: () => notify({ type: "finish" }),
  });
  const { state, view, dispatch, toast } = styling;
  const root = useRef<HTMLDivElement>(null);
  const [briefOpen, setBriefOpen] = useState(true);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const profile = useProfile();
  const clientIndex = Math.max(0, CLIENT_IDS.indexOf(session.client.id));

  const requestLeave = (): void => {
    if (styling.needsConfirm) setLeaveOpen(true);
    else router.pop();
  };
  const leaveFromBrief = (): void => {
    if (styling.needsConfirm) {
      setBriefOpen(false);
      setLeaveOpen(true);
    } else router.pop();
  };
  useBack(router, true, () => {
    if (!styling.needsConfirm) return false;
    setLeaveOpen(true);
    return true;
  });

  const { drag, begin, consumeClick } = useDrag({
    onStart: () => feedback.fire({ type: "pick" }),
    onDrop: (source: DragSource, targetSlot: Slot | null) => {
      if (source.origin === "board") {
        if (targetSlot === null && source.slot) dispatch({ type: "remove", slot: source.slot });
        else if (targetSlot !== null && targetSlot !== source.slot) {
          dispatch({ type: "place", pieceId: source.pieceId, slot: targetSlot });
        }
        return;
      }
      if (targetSlot !== null)
        dispatch({ type: "place", pieceId: source.pieceId, slot: targetSlot });
    },
  });

  const placedIds = useMemo(() => new Set(Object.values(styling.look)), [styling.look]);
  const selectedPiece = state.selected?.kind === "piece" ? state.selected.pieceId : null;
  const canUndo = state.history.past.length > 0;

  const onKeyDown = (event: KeyboardEvent): void => {
    const element = event.target instanceof HTMLElement ? event.target : null;
    if (element?.closest("[role='dialog']")) return;
    const pieceId = element?.closest<HTMLElement>("[data-piece-id]")?.dataset.pieceId;
    const slot = element?.closest<HTMLElement>("[data-board-slot]")?.dataset.boardSlot as
      | Slot
      | undefined;
    const intent = keyIntent(event, {
      ...(pieceId === undefined ? {} : { pieceId }),
      ...(slot === undefined ? {} : { slot }),
    });
    if (intent === null) return;
    event.preventDefault();
    switch (intent.type) {
      case "undo":
        dispatch({ type: "undo" });
        break;
      case "redo":
        dispatch({ type: "redo" });
        break;
      case "place-piece":
        dispatch({ type: "place", pieceId: intent.pieceId });
        break;
      case "tap-slot":
        dispatch({ type: "tap-slot", slot: intent.slot });
        break;
      case "remove-slot":
        dispatch({ type: "remove", slot: intent.slot });
        break;
      case "move": {
        const grid = element?.closest(".dr-tray__grid");
        if (grid) moveFocus(grid, intent.delta);
        break;
      }
    }
  };

  const complete = view.preview.complete;
  useEffect(() => {
    notify({ type: "complete", complete });
  }, [complete, notify]);

  useEffect(() => {
    const slot = styling.landing?.slot;
    if (!slot) return;
    const element = root.current?.querySelector<HTMLElement>(`[data-board-slot="${slot}"]`);
    if (element) void motion.landingPop(element);
  }, [styling.landing, motion]);

  const finish = async (): Promise<void> => {
    const outcome = await styling.finishLook();
    if (outcome) setResultOpen(true);
  };

  const hintId = state.hint?.pieceId ?? null;
  const ghostPiece = drag ? pieceOf(drag.source.pieceId) : null;
  const result = styling.finish;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: key handling for the whole styling board (Ctrl+Z, Enter, Backspace)
    <div
      ref={root}
      class="dr-styling"
      onKeyDown={onKeyDown}
      style={accentStyle(session.accent)}
      data-coach={briefOpen ? "" : onboarding.targets}
    >
      <Screen name="styling" class="dr-styling__screen">
        <header class="dr-header dr-header--board">
          <IconButton label={t("back")} onClick={requestLeave}>
            <Icon name="back" size={22} />
          </IconButton>
          <h1 class="dr-header__title">{session.challenge.name}</h1>
          <div class="dr-header__end">
            <IconButton label={t("stylingBrief")} onClick={() => setBriefOpen(true)}>
              <Icon name="brief" size={22} />
            </IconButton>
            <IconButton label={t("stylingPause")} onClick={() => setPauseOpen(true)}>
              <Icon name="pause" size={22} />
            </IconButton>
            <CoinBadge />
          </div>
        </header>
        {onboarding.tutorial && !briefOpen && onboarding.cards.length === 0 ? (
          <Coachmark
            step={onboarding.tutorial.step}
            client={session.client}
            onClientSeen={() => notify({ type: "client-seen" })}
            onSkip={() => notify({ type: "skip" })}
          />
        ) : null}
        <Board
          view={view}
          theme={session.themeId}
          selected={state.selected}
          hint={state.hint}
          drag={drag}
          {...(app.artManifest ? { manifest: app.artManifest } : {})}
          onTap={(slot) => dispatch({ type: "tap-slot", slot })}
          onPointerDown={(event, slot) => {
            if (slot.piece)
              begin(event, { pieceId: slot.piece.id, origin: "board", slot: slot.slot });
          }}
          consumeClick={consumeClick}
        />
        <fieldset class="dr-actions">
          <legend class="dr-sr-only">{t("actionsLabel")}</legend>
          <Button
            size="small"
            variant="secondary"
            disabled={!canUndo}
            onClick={() => dispatch({ type: "undo" })}
          >
            <Icon name="undo" size={18} /> {t("undo")}
          </Button>
          <Button
            size="small"
            variant="secondary"
            disabled={state.history.future.length === 0}
            onClick={() => dispatch({ type: "redo" })}
          >
            <Icon name="redo" size={18} /> {t("redo")}
          </Button>
          <Button
            size="small"
            variant="secondary"
            disabled={!styling.hasPieces}
            onClick={() => dispatch({ type: "clear" })}
          >
            <Icon name="clear" size={18} /> {t("clear")}
          </Button>
          {state.selected?.kind === "slot" ? (
            <Button
              size="small"
              variant="secondary"
              onClick={() => dispatch({ type: "remove-selected" })}
            >
              <Icon name="remove" size={18} /> {t("remove")}
            </Button>
          ) : null}
          <Button size="small" variant="secondary" onClick={() => setHintOpen(true)}>
            <Icon name="hint" size={18} /> {t("hint")}
          </Button>
        </fieldset>
        <RuleChips rules={view.preview.rules} pending={!styling.hasPieces} />
        <HarmonyMeter harmony={view.preview.harmony} empty={!styling.hasPieces} />
        <Tray
          closet={session.closet}
          openCategories={view.openCategories}
          tab={state.tab}
          selectedId={selectedPiece}
          placedIds={placedIds}
          hintId={hintId}
          onTab={(tab) => {
            feedback.fire({ type: "tab" });
            notify({ type: "tab-opened", tab });
            dispatch({ type: "set-tab", tab });
          }}
          onSelect={(piece) => dispatch({ type: "select-piece", pieceId: piece.id })}
          onPointerDown={(event, piece) => begin(event, { pieceId: piece.id, origin: "tray" })}
          consumeClick={consumeClick}
        />
        <div class="dr-finish" data-sfx="own">
          <Button
            size="large"
            fullWidth
            disabled={!complete || styling.busy}
            onClick={() => void finish()}
          >
            {t("finishLook")}
          </Button>
          <p class="dr-note dr-finish__hint" data-testid="finish-hint">
            {complete ? t("finishReady") : t("finishLeft", { count: view.preview.missing.length })}
          </p>
        </div>
        <div class="dr-sr-only" role="status" aria-live="polite" data-testid="live">
          {styling.live}
        </div>
      </Screen>
      {ghostPiece && drag ? (
        <div
          class="dr-ghost"
          data-testid="ghost"
          style={{ left: `${drag.point.x}px`, top: `${drag.point.y}px` }}
        >
          <PieceArt piece={ghostPiece} size={64} />
        </div>
      ) : null}
      {toast.toast ? (
        <Toast
          key={toast.toast.id}
          message={toast.toast.message}
          tone={toast.toast.tone}
          onDismiss={toast.dismiss}
        />
      ) : null}
      <RuleCardSheet
        card={briefOpen ? (onboarding.cards[0] ?? null) : null}
        position={onboarding.cardPosition}
        total={onboarding.cardTotal}
        onDismiss={onboarding.dismissCard}
      />
      <Brief
        open={briefOpen && onboarding.cards.length === 0}
        challenge={session.challenge}
        client={session.client}
        clientIndex={clientIndex}
        accent={session.accent}
        chapterTitle={session.chapterTitle}
        onStart={() => setBriefOpen(false)}
        onLeave={leaveFromBrief}
      />
      <Pause
        open={pauseOpen}
        onResume={() => setPauseOpen(false)}
        onBrief={() => {
          setPauseOpen(false);
          setBriefOpen(true);
        }}
        onRestart={() => {
          setPauseOpen(false);
          dispatch({ type: "reset" });
        }}
        onLeave={() => {
          setPauseOpen(false);
          requestLeave();
        }}
      />
      <HintConfirm
        open={hintOpen}
        price={styling.hintPrice}
        coins={profile.coins}
        onCancel={() => setHintOpen(false)}
        onBuy={() => {
          setHintOpen(false);
          void styling.buyHint();
        }}
      />
      <Confirm
        open={leaveOpen}
        title={t("leaveTitle")}
        body={t("leaveBody")}
        confirmLabel={t("leaveYes")}
        cancelLabel={t("leaveStay")}
        danger
        onCancel={() => setLeaveOpen(false)}
        onConfirm={() => {
          setLeaveOpen(false);
          router.pop();
        }}
      />
      {result ? (
        <Result
          open={resultOpen}
          session={session}
          score={result.score}
          events={result.events}
          streak={result.streak}
          saved={result.savedId !== null}
          hasNext={result.nextId !== null}
          note={result.note}
          onSave={() => void styling.saveBoard()}
          onExport={() => {
            setResultOpen(false);
            setExportOpen(true);
          }}
          onNext={() => {
            if (result.nextId) router.replace("styling", { challengeId: result.nextId });
          }}
          onRetry={() => {
            setResultOpen(false);
            styling.setFinish(null);
            dispatch({ type: "reset" });
          }}
          onEdit={() => setResultOpen(false)}
        />
      ) : null}
      {result ? (
        <ExportSheet
          open={exportOpen}
          onClose={() => {
            setExportOpen(false);
            setResultOpen(true);
          }}
          build={(frame) =>
            sessionExportInput(
              session,
              { look: result.look, stars: result.score.stars, harmony: result.score.harmony.total },
              frame,
            )
          }
          shareText={sessionShareText(
            session,
            { look: result.look, stars: result.score.stars, harmony: result.score.harmony.total },
            result.streak ?? profile.daily.streak,
          )}
        />
      ) : null}
    </div>
  );
}
