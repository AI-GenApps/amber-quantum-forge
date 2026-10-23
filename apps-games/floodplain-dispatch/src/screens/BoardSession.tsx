import { Button, IconButton, Screen, Toast } from "@web-games/kit";
import { playbackSummary } from "../board/a11y";
import { Board, type DragMode } from "../board/Board";
import { BudgetMeter } from "../board/BudgetMeter";
import { Forecast } from "../board/Forecast";
import { type CellPos, zoomLabel } from "../board/geometry";
import { Tray } from "../board/Tray";
import { Coachmark } from "../onboarding/Coachmark";
import { MechanicCardSheet } from "../onboarding/cards";
import { type Onboarding, useOnboarding } from "../onboarding/useOnboarding";
import type { SessionSource } from "../session/types";
import { type BoardSession, useBoardSession } from "../session/useBoardSession";
import { Confirm } from "../sheets/Confirm";
import { HintConfirm } from "../sheets/HintConfirm";
import { Inspector } from "../sheets/Inspector";
import { Pause } from "../sheets/Pause";
import { Result } from "../sheets/Result";
import { useSettings } from "../state/app";
import { t } from "../strings";
import { Glyph } from "../ui/Glyph";
import { Header } from "../ui/Header";
import { PlaybackBar } from "./Playback";

function cellsOf(indices: readonly number[], width: number): CellPos[] {
  return indices.map((index) => ({ x: index % width, y: Math.floor(index / width) }));
}

function dragModeOf(session: BoardSession): DragMode {
  if (session.phase === "playback") return session.zoom > 0 ? "pan" : "none";
  if (session.tool === "select") return session.zoom > 0 ? "pan" : "none";
  return "paint";
}

function Sheets({
  session,
  source,
  onboarding,
}: {
  session: BoardSession;
  source: SessionSource;
  onboarding: Onboarding;
}) {
  const { sheet, run, app } = session;
  const piece = session.selected
    ? (session.placements.find((p) => p.x === session.selected?.x && p.y === session.selected?.y) ??
      null)
    : null;
  const exitConfirmed = (): void => session.leave();
  const seen = (action: () => void) => (): void => {
    onboarding.notify({ type: "result-seen" });
    action();
  };
  return (
    <>
      <MechanicCardSheet card={onboarding.card} onDismiss={onboarding.dismissCard} />
      <Inspector
        open={sheet?.kind === "inspector"}
        piece={piece}
        def={source.def}
        onRotate={() => session.selected && session.rotate(session.selected)}
        onGate={session.setGate}
        onRemove={session.removeSelected}
        onClose={session.closeSheet}
      />
      <Pause
        open={sheet?.kind === "pause"}
        canClear={session.placements.length > 0 && session.phase === "plan"}
        onResume={session.closeSheet}
        onClear={() => {
          session.clear();
          session.closeSheet();
        }}
        onHowTo={() => {
          session.closeSheet();
          app.router.push("howto");
        }}
        onExit={() => {
          session.closeSheet();
          session.requestLeave();
        }}
      />
      <HintConfirm
        open={sheet?.kind === "hint"}
        price={session.hintPrice}
        coins={session.profile.coins}
        onConfirm={() => void session.confirmHint()}
        onClose={session.closeSheet}
      />
      <Confirm
        open={sheet?.kind === "exit"}
        title={t("confirmExitTitle")}
        body={t("confirmExitBody")}
        confirmLabel={t("confirmExitYes")}
        cancelLabel={t("confirmExitNo")}
        danger
        onConfirm={exitConfirmed}
        onCancel={session.closeSheet}
      />
      {run ? (
        <Result
          open={sheet?.kind === "result"}
          evaluation={run.timeline.evaluation}
          budget={source.def.budget}
          events={run.events}
          streak={run.streak}
          next={session.nextMap}
          shareNote={session.shareNote}
          tutorialStep={
            onboarding.tutorial && onboarding.tutorial.step >= 5 ? onboarding.tutorial.step : null
          }
          onNext={seen(session.goNext)}
          onRetry={seen(session.retry)}
          onEdit={seen(session.toEdit)}
          onShare={() => void session.share()}
          onSeen={() => onboarding.notify({ type: "result-seen" })}
          onClose={seen(session.closeSheet)}
        />
      ) : null}
    </>
  );
}

function ActionRow({ session, highlightRun }: { session: BoardSession; highlightRun: boolean }) {
  return (
    <fieldset class="fd-actions" aria-label={t("actionsLabel")}>
      <Button
        variant="secondary"
        size="small"
        disabled={!session.canUndo}
        onClick={session.undoPlan}
      >
        {t("undo")}
      </Button>
      <Button
        variant="secondary"
        size="small"
        disabled={!session.canRedo}
        onClick={session.redoPlan}
      >
        {t("redo")}
      </Button>
      <Button
        variant="secondary"
        size="small"
        disabled={session.placements.length === 0}
        onClick={session.clear}
      >
        {t("clear")}
      </Button>
      <button
        type="button"
        class="wg-btn wg-btn--secondary wg-btn--small"
        aria-label={t("zoomLabel", { level: zoomLabel(session.zoom) })}
        onClick={session.cycleZoom}
      >
        {zoomLabel(session.zoom)}
      </button>
      <Button variant="secondary" size="small" onClick={session.onHint}>
        {t("hint")}
      </Button>
      <Button class={highlightRun ? "fd-run fd-hl" : "fd-run"} onClick={session.startRun}>
        {t("run")}
      </Button>
    </fieldset>
  );
}

export function BoardSessionView({ source }: { source: SessionSource }) {
  const session = useBoardSession(source);
  const settings = useSettings();
  const { view, phase } = session;
  const onboarding = useOnboarding(source, {
    tool: session.tool,
    placements: session.placements,
    phase,
    houseCells: cellsOf(view.board.houseCells, view.board.width),
    inletCells: cellsOf(view.board.inletCells, view.board.width),
  });
  const coach = onboarding.tutorial && onboarding.tutorial.step < 5 && phase === "plan";
  const week = session.run ? Math.floor(session.playback.pos / 4) : null;
  const announcement =
    phase === "playback" && week !== null
      ? playbackSummary(week, source.def.weeks, session.counts)
      : session.note;
  return (
    <Screen name="board" class="fd-board-screen">
      <Header title={source.title} onBack={session.requestLeave}>
        <span class="fd-coins" data-testid="coins">
          {t("homeCoins", { coins: session.profile.coins })}
        </span>
        <IconButton label={t("boardOpenPause")} onClick={() => session.setSheet({ kind: "pause" })}>
          <Glyph kind="menu" size={22} />
        </IconButton>
      </Header>
      <Forecast def={source.def} week={phase === "playback" ? week : null} />
      {phase === "plan" ? (
        <BudgetMeter left={session.left} budget={source.def.budget} par={source.def.par} />
      ) : null}
      {coach && onboarding.tutorial ? (
        <Coachmark
          step={onboarding.tutorial.step}
          onAck={
            onboarding.tutorial.step === 1
              ? () => onboarding.notify({ type: "inlet-ack" })
              : undefined
          }
          onSkip={onboarding.skip}
        />
      ) : null}
      <Board
        view={view}
        highlights={onboarding.highlightCells}
        theme={session.theme}
        highContrast={settings.highContrast}
        reducedMotion={session.reduced}
        zoomStep={session.zoom}
        pan={session.pan}
        dragMode={dragModeOf(session)}
        announcement={announcement}
        {...(session.app.images ? { images: session.app.images } : {})}
        {...(session.app.contextFactory ? { contextFactory: session.app.contextFactory } : {})}
        onPanChange={session.setPan}
        onTap={session.tapAt}
        onLongPress={session.longPress}
        onStrokeStart={session.strokeStart}
        onStrokeCell={session.strokeCell}
        onStrokeEnd={session.strokeEnd}
        onKeyDown={session.onKeyDown}
      />
      {phase === "plan" ? (
        <>
          <Tray
            tools={session.tools}
            tool={session.tool}
            budgetLeft={session.left}
            highlight={onboarding.highlight.canalTool ? "canal" : null}
            onSelect={(next) => {
              session.setTool(next);
              onboarding.notify({ type: "tool", tool: next });
            }}
          />
          <ActionRow session={session} highlightRun={onboarding.highlight.runButton} />
        </>
      ) : (
        <PlaybackBar
          state={session.playback}
          total={session.total}
          weeks={source.def.weeks}
          counts={session.counts}
          totals={{ houses: view.board.houseCells.length, fields: view.board.fieldCells.length }}
          onToggle={session.setPlayback.toggle}
          onSpeed={session.setPlayback.speed}
          onScrub={session.setPlayback.scrub}
          onSkip={session.setPlayback.skip}
          onEdit={session.toEdit}
        />
      )}
      {session.note && phase === "plan" ? (
        <Toast message={session.note} durationMs={2600} onDismiss={() => session.setNote("")} />
      ) : null}
      <Sheets session={session} source={source} onboarding={onboarding} />
    </Screen>
  );
}
