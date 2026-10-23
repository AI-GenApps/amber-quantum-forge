import {
  budgetLeft,
  type EconomyEvent,
  findPlacement,
  HINT_PRICE,
  mapUnlocked,
  nextMapId,
  type PieceKind,
  type Placement,
  shareText,
  tideLevel,
} from "@web-games/floodplain-dispatch-core";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { type CellPos, nextZoom, type Pan, type ZoomStep } from "../board/geometry";
import { type BoardView, buildView, fieldCellList, houseCellList } from "../board/model";
import { dirName, pieceName, placementErrorText } from "../labels";
import { useApp, useMapTheme, useProfile, useReducedMotion } from "../state/app";
import { useBack } from "../state/useBack";
import { t } from "../strings";
import { nextHint } from "./hint";
import { type KeyAction, keyAction } from "./keys";
import {
  beginStroke,
  canRedo,
  canUndo,
  clearPlan,
  emptyPlan,
  endStroke,
  erasePiece,
  type PlanResult,
  type PlanState,
  placePiece,
  redo,
  rotateAt,
  setGateAt,
  undo,
} from "./plan";
import {
  advance,
  finished,
  type PlaybackState,
  type Speed,
  scrubTo,
  setSpeed,
  startPlayback,
  tickDelay,
  togglePlaying,
} from "./playback";
import { badgesAt, buildTimeline, countBadges, frameAt, type Timeline } from "./timeline";
import { availableTools, isPieceTool, type Tool } from "./tools";
import type { SessionSource, SheetState } from "./types";
import { usePlanCues, useSessionFeedback } from "./useSessionFeedback";

export interface RunData {
  id: number;
  timeline: Timeline;
  events: readonly EconomyEvent[] | null;
  streak: number | null;
}

export function useBoardSession(source: SessionSource) {
  const app = useApp();
  const profile = useProfile();
  const theme = useMapTheme();
  const reduced = useReducedMotion();
  const { def } = source;
  const tools = useMemo(() => availableTools(def.pieces), [def]);

  const startCell = useMemo<CellPos>(() => {
    const view = buildView({ def, placements: [] });
    const inlet = view.board.inletCells[0] ?? 0;
    return { x: inlet % view.board.width, y: Math.floor(inlet / view.board.width) };
  }, [def]);

  const planRef = useRef<PlanState>(emptyPlan());
  const [plan, setPlanState] = useState<PlanState>(planRef.current);
  const [tool, setTool] = useState<Tool>(tools[0] ?? "select");
  const [cursor, setCursor] = useState<CellPos>(startCell);
  const [selected, setSelected] = useState<CellPos | null>(null);
  const [zoom, setZoom] = useState<ZoomStep>(0);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [phase, setPhase] = useState<"plan" | "playback">("plan");
  const [run, setRun] = useState<RunData | null>(null);
  const [playback, setPlayback] = useState<PlaybackState>(startPlayback());
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [ghost, setGhost] = useState<Placement | null>(null);
  const [note, setNote] = useState("");
  const [shareNote, setShareNote] = useState("");
  const runCounter = useRef(0);
  const resultShownFor = useRef(0);

  const setPlan = useCallback((next: PlanState) => {
    planRef.current = next;
    setPlanState(next);
  }, []);

  const placements = plan.placements;
  const left = budgetLeft(def, placements);

  useEffect(() => {
    if (!ghost) return;
    if (placements.some((p) => p.x === ghost.x && p.y === ghost.y && p.kind === ghost.kind)) {
      setGhost(null);
    }
  }, [placements, ghost]);

  const { planCue, strokeStarted, runStarted } = usePlanCues();

  const apply = useCallback(
    (result: PlanResult, quiet = false, piece?: PieceKind): void => {
      setPlan(result.state);
      planCue(result, piece);
      if (quiet) return;
      if (result.error) setNote(placementErrorText(result.error));
      else if (result.change === "placed") setNote("");
    },
    [planCue, setPlan],
  );

  const frame = run && phase === "playback" ? frameAt(run.timeline, playback.pos) : null;
  const view: BoardView = useMemo(() => {
    const houses = houseCellList(buildView({ def, placements: [] }).board);
    const base = buildView({ def, region: source.region, placements });
    const fields = fieldCellList(base.board);
    const badges =
      run && phase === "playback" ? badgesAt(run.timeline, houses, fields, playback.pos) : [];
    let depths = frame?.depths;
    if (!depths) {
      depths = new Uint8Array(base.board.width * base.board.height);
      const level = tideLevel(def, 0);
      for (const cell of base.board.seaCells) depths[cell] = level;
    }
    return buildView({
      def,
      region: source.region,
      placements,
      depths,
      week: run && phase === "playback" ? Math.floor(playback.pos / 4) : null,
      badges,
      ghost,
      cursor: phase === "plan" ? cursor : null,
      selected,
    });
  }, [def, source.region, placements, run, phase, playback.pos, frame, ghost, cursor, selected]);

  const counts = useMemo(() => {
    const c = countBadges(view.badges);
    return { supplied: c.suppliedHouses, flooded: c.floodedHouses, irrigated: c.irrigatedFields };
  }, [view.badges]);

  const showHint = nextHint(source.reference, placements);

  const tapAt = useCallback(
    (cell: CellPos): void => {
      setCursor(cell);
      const current = planRef.current;
      const piece = findPlacement(current.placements, cell.x, cell.y);
      if (tool === "erase") {
        const result = erasePiece(current, cell.x, cell.y);
        apply(result, true);
        setNote(
          result.change === "removed" && piece
            ? t("msgRemoved", { piece: pieceName(piece.kind) })
            : t("msgNothing"),
        );
        return;
      }
      if (piece) {
        setSelected(cell);
        setSheet({ kind: "inspector" });
        return;
      }
      if (!isPieceTool(tool)) return;
      const result = placePiece(current, def, tool, cell.x, cell.y);
      apply(result, false, tool);
      if (result.change === "placed") setNote(t("msgPlaced", { piece: pieceName(tool) }));
    },
    [apply, def, tool],
  );

  const strokeCell = useCallback(
    (cell: CellPos): void => {
      const current = planRef.current;
      if (tool === "erase") {
        apply(erasePiece(current, cell.x, cell.y), true);
      } else if (isPieceTool(tool) && !findPlacement(current.placements, cell.x, cell.y)) {
        apply(placePiece(current, def, tool, cell.x, cell.y), false, tool);
      }
    },
    [apply, def, tool],
  );

  const strokeStart = useCallback(
    (cell: CellPos): void => {
      strokeStarted();
      setPlan(beginStroke(planRef.current));
      setCursor(cell);
      strokeCell(cell);
    },
    [setPlan, strokeCell, strokeStarted],
  );

  const strokeEnd = useCallback((): void => setPlan(endStroke(planRef.current)), [setPlan]);

  const longPress = useCallback(
    (cell: CellPos): void => {
      if (phase !== "plan") return;
      const result = erasePiece(planRef.current, cell.x, cell.y);
      apply(result, true);
      if (result.change === "removed") setNote(t("msgRemoved", { piece: "" }).trim());
    },
    [apply, phase],
  );

  const undoPlan = useCallback((): void => setPlan(undo(planRef.current)), [setPlan]);
  const redoPlan = useCallback((): void => setPlan(redo(planRef.current)), [setPlan]);
  const clear = useCallback((): void => apply(clearPlan(planRef.current), true), [apply]);

  const rotate = useCallback(
    (cell: CellPos): void => {
      const result = rotateAt(planRef.current, cell.x, cell.y);
      apply(result, true);
      const piece = findPlacement(result.state.placements, cell.x, cell.y);
      if (result.change === "rotated" && piece?.dir)
        setNote(t("msgRotated", { dir: dirName(piece.dir) }));
    },
    [apply],
  );

  const setGate = useCallback(
    (opens: number, closes: number): void => {
      if (!selected) return;
      const result = setGateAt(planRef.current, def, selected.x, selected.y, opens, closes);
      apply(result, true);
      if (result.error) setNote(placementErrorText(result.error));
    },
    [apply, def, selected],
  );

  const removeSelected = useCallback((): void => {
    if (selected) apply(erasePiece(planRef.current, selected.x, selected.y), true);
    setSelected(null);
    setSheet(null);
  }, [apply, selected]);

  const closeSheet = useCallback((): void => {
    setSheet(null);
    setSelected(null);
  }, []);

  const cycleZoom = useCallback((): void => {
    const next = nextZoom(zoom);
    setZoom(next);
    if (next === 0) setPan({ x: 0, y: 0 });
  }, [zoom]);

  const startRun = useCallback((): void => {
    if (phase !== "plan") return;
    const timeline = buildTimeline(def, planRef.current.placements);
    runCounter.current += 1;
    const id = runCounter.current;
    setRun({ id, timeline, events: null, streak: null });
    setPhase("playback");
    setPlayback(startPlayback());
    setGhost(null);
    setSheet(null);
    setShareNote("");
    runStarted();
    const ev = timeline.evaluation;
    if (source.kind === "campaign" && source.mapId) {
      void app.game.recordCampaignResult(source.mapId, ev).then((events) => {
        setRun((current) => (current && current.id === id ? { ...current, events } : current));
      });
    } else {
      void app.game
        .recordDailyResult({ stars: ev.stars, score: ev.score, spend: ev.spend })
        .then((outcome) => {
          const streak = outcome.counted ? app.game.getState().profile.daily.streak : null;
          setRun((current) =>
            current && current.id === id ? { ...current, events: outcome.events, streak } : current,
          );
        });
    }
  }, [app.game, def, phase, runStarted, source.kind, source.mapId]);

  const toEdit = useCallback((): void => {
    setPhase("plan");
    setSheet(null);
    setPlayback(startPlayback());
  }, []);

  const retry = useCallback((): void => {
    setPlan(emptyPlan());
    setGhost(null);
    toEdit();
  }, [setPlan, toEdit]);

  const total = run?.timeline.steps ?? 0;

  useEffect(() => {
    if (phase !== "playback" || !playback.playing) return undefined;
    const id = setTimeout(
      () => setPlayback((state) => advance(state, total, reduced)),
      tickDelay(playback.speed, reduced),
    );
    return () => clearTimeout(id);
  }, [phase, playback, total, reduced]);

  useEffect(() => {
    if (phase !== "playback" || !run || !finished(playback, total)) return;
    if (resultShownFor.current === run.id) return;
    resultShownFor.current = run.id;
    setSheet({ kind: "result" });
  }, [phase, run, playback, total]);

  const onHint = useCallback((): void => {
    if (phase !== "plan") return;
    if (!nextHint(source.reference, planRef.current.placements)) {
      setNote(t("hintDone"));
      return;
    }
    setSheet({ kind: "hint" });
  }, [phase, source.reference]);

  useSessionFeedback({
    def,
    phase,
    playback,
    badges: view.badges,
    depths: frame?.depths,
    sheet,
    runId: run?.id ?? null,
    stars: run?.timeline.evaluation.stars ?? null,
    events: run?.events ?? null,
  });

  const hintKind = source.kind === "daily" ? "daily" : "campaign";
  const confirmHint = useCallback(async (): Promise<void> => {
    const outcome = await app.game.buyHint(hintKind);
    setSheet(null);
    if (!outcome.ok) {
      setNote(t("hintBroke"));
      return;
    }
    const piece = nextHint(source.reference, planRef.current.placements);
    setGhost(piece);
    if (piece) {
      setNote(
        t("hintShown", { piece: pieceName(piece.kind), column: piece.x + 1, row: piece.y + 1 }),
      );
    }
  }, [app.game, hintKind, source.reference]);

  const share = useCallback(async (): Promise<void> => {
    if (!run) return;
    const ev = run.timeline.evaluation;
    const text =
      source.kind === "campaign" && source.mapId
        ? shareText("campaign", {
            mapId: source.mapId,
            stars: ev.stars,
            flooded: ev.housesFlooded,
            spend: ev.spend,
            budget: def.budget,
          })
        : shareText("daily", {
            dateKey: source.dateKey ?? "",
            stars: ev.stars,
            flooded: ev.housesFlooded,
            streak: app.game.getState().profile.daily.streak,
          });
    const result = await app.share({ title: source.title, text });
    setShareNote(result.ok ? t("resultShared") : result.cancelled ? "" : t("resultShareFailed"));
  }, [app, def.budget, run, source]);

  const nextMap = useMemo(() => {
    if (source.kind !== "campaign" || !source.mapId || !run) return null;
    if (run.timeline.evaluation.stars < 1) return null;
    const next = nextMapId(source.mapId);
    return next && mapUnlocked(profile, next) ? next : null;
  }, [source, run, profile]);

  const goNext = useCallback((): void => {
    if (nextMap) app.router.replace("board", { mapId: nextMap });
  }, [app.router, nextMap]);

  const leave = useCallback((): void => {
    setSheet(null);
    app.router.pop();
  }, [app.router]);

  const requestLeave = useCallback((): void => {
    if (phase === "plan" && planRef.current.placements.length > 0) setSheet({ kind: "exit" });
    else leave();
  }, [leave, phase]);

  useBack(app.router, phase === "playback", () => {
    toEdit();
    return true;
  });
  useBack(app.router, phase === "plan" && placements.length > 0, () => {
    setSheet({ kind: "exit" });
    return true;
  });

  const act = useCallback(
    (action: KeyAction): void => {
      if (phase === "playback") {
        if (action.type === "run") setPlayback((state) => togglePlaying(state, total));
        return;
      }
      switch (action.type) {
        case "move":
          setCursor((c) => ({
            x: Math.max(0, Math.min(view.board.width - 1, c.x + action.dx)),
            y: Math.max(0, Math.min(view.board.height - 1, c.y + action.dy)),
          }));
          break;
        case "activate":
          tapAt(cursor);
          break;
        case "remove":
          apply(erasePiece(planRef.current, cursor.x, cursor.y), true);
          break;
        case "rotate":
          rotate(selected ?? cursor);
          break;
        case "run":
          startRun();
          break;
        case "undo":
          undoPlan();
          break;
        case "redo":
          redoPlan();
          break;
        case "zoom":
          cycleZoom();
          break;
        case "hint":
          onHint();
          break;
        case "tool":
          setTool(action.tool);
          break;
      }
    },
    [
      apply,
      cursor,
      cycleZoom,
      onHint,
      phase,
      redoPlan,
      rotate,
      selected,
      startRun,
      tapAt,
      total,
      undoPlan,
      view.board,
    ],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent): void => {
      if (sheet) return;
      const action = keyAction(event, tools);
      if (!action) return;
      event.preventDefault();
      act(action);
    },
    [act, sheet, tools],
  );

  return {
    app,
    profile,
    theme,
    reduced,
    tools,
    tool,
    setTool,
    plan,
    placements,
    left,
    canUndo: canUndo(plan),
    canRedo: canRedo(plan),
    view,
    counts,
    phase,
    run,
    playback,
    setPlayback: {
      toggle: () => setPlayback((state) => togglePlaying(state, total)),
      speed: (speed: Speed) => setPlayback((state) => setSpeed(state, speed)),
      scrub: (pos: number) => setPlayback((state) => scrubTo(state, pos, total)),
      skip: () => setPlayback((state) => scrubTo(state, total, total)),
    },
    total,
    sheet,
    setSheet,
    selected,
    zoom,
    pan,
    setPan,
    cycleZoom,
    note,
    setNote,
    shareNote,
    hintAvailable: showHint !== null,
    hintPrice: HINT_PRICE[hintKind],
    tapAt,
    strokeStart,
    strokeCell,
    strokeEnd,
    longPress,
    undoPlan,
    redoPlan,
    clear,
    rotate,
    setGate,
    removeSelected,
    closeSheet,
    startRun,
    toEdit,
    retry,
    onHint,
    confirmHint,
    share,
    nextMap,
    goNext,
    leave,
    requestLeave,
    onKeyDown,
  };
}

export type BoardSession = ReturnType<typeof useBoardSession>;
