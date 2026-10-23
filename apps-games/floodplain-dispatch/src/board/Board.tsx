import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { t } from "../strings";
import type { MapTheme } from "../theme/mapThemes";
import { boardSummary } from "./a11y";
import type { Draw2D } from "./Draw2D";
import {
  type CellPos,
  cellAt,
  FALLBACK_VIEWPORT,
  linePath,
  makeGeometry,
  type Pan,
  panToReveal,
  type Viewport,
  type ZoomStep,
} from "./geometry";
import { Marks } from "./Marks";
import type { BoardView } from "./model";
import { renderBoard } from "./render";

export type DragMode = "paint" | "pan" | "none";

export interface BoardProps {
  view: BoardView;
  theme: MapTheme;
  highContrast: boolean;
  reducedMotion: boolean;
  zoomStep: ZoomStep;
  pan: Pan;
  dragMode: DragMode;
  announcement?: string;
  highlights?: readonly CellPos[];
  images?: Readonly<Record<string, unknown>>;
  contextFactory?: (canvas: HTMLCanvasElement) => Draw2D | null;
  onPanChange: (pan: Pan) => void;
  onTap: (cell: CellPos) => void;
  onLongPress: (cell: CellPos) => void;
  onStrokeStart: (cell: CellPos) => void;
  onStrokeCell: (cell: CellPos) => void;
  onStrokeEnd: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

export const LONG_PRESS_MS = 500 as const;

function defaultContext(canvas: HTMLCanvasElement): Draw2D | null {
  const ctx = canvas.getContext("2d");
  return ctx ? (ctx as unknown as Draw2D) : null;
}

interface Gesture {
  start: CellPos | null;
  last: CellPos | null;
  moved: boolean;
  stroking: boolean;
  longFired: boolean;
  panFrom: { x: number; y: number; pan: Pan } | null;
  timer: ReturnType<typeof setTimeout> | null;
}

const idle = (): Gesture => ({
  start: null,
  last: null,
  moved: false,
  stroking: false,
  longFired: false,
  panFrom: null,
  timer: null,
});

export function Board(props: BoardProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gesture = useRef<Gesture>(idle());
  const latest = useRef(props);
  latest.current = props;
  const [viewport, setViewport] = useState<Viewport>(FALLBACK_VIEWPORT);

  const geom = useMemo(
    () =>
      makeGeometry(
        props.view.board.width,
        props.view.board.height,
        viewport,
        props.zoomStep,
        props.pan,
      ),
    [props.view.board.width, props.view.board.height, viewport, props.zoomStep, props.pan],
  );
  const geomRef = useRef(geom);
  geomRef.current = geom;

  useEffect(() => {
    const element = host.current;
    if (!element) return undefined;
    const measure = (): void => {
      const rect = element.getBoundingClientRect();
      if (rect.width >= 50 && rect.height >= 50) {
        setViewport({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };
    measure();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    host.current?.focus({ preventScroll: true });
  }, []);

  const draw = (time: number): void => {
    const element = canvas.current;
    if (!element) return;
    const current = latest.current;
    const ctx = (current.contextFactory ?? defaultContext)(element);
    if (!ctx) return;
    const g = geomRef.current;
    const ratio = Math.min(2, globalThis.devicePixelRatio || 1);
    const pixelWidth = Math.round(g.viewport.width * ratio);
    const pixelHeight = Math.round(g.viewport.height * ratio);
    if (element.width !== pixelWidth) element.width = pixelWidth;
    if (element.height !== pixelHeight) element.height = pixelHeight;
    ctx.save();
    ctx.scale(ratio, ratio);
    renderBoard(ctx, current.view, g, {
      theme: current.theme,
      highContrast: current.highContrast,
      reducedMotion: current.reducedMotion,
      time,
      ...(current.images ? { images: current.images } : {}),
    });
    ctx.restore();
  };

  useEffect(() => {
    draw(0);
    if (props.reducedMotion || typeof requestAnimationFrame !== "function") return undefined;
    if (!canvas.current || !(props.contextFactory ?? defaultContext)(canvas.current))
      return undefined;
    let frame = 0;
    let last = 0;
    const loop = (now: number): void => {
      if (now - last > 120) {
        last = now;
        draw(now);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  });

  const cursorX = props.view.cursor?.x;
  const cursorY = props.view.cursor?.y;
  // biome-ignore lint/correctness/useExhaustiveDependencies: only a cursor move should re-pan
  useEffect(() => {
    if (props.zoomStep === 0 || cursorX === undefined || cursorY === undefined) return;
    const next = panToReveal(geomRef.current, cursorX, cursorY);
    if (next.x !== props.pan.x || next.y !== props.pan.y) props.onPanChange(next);
  }, [cursorX, cursorY, props.zoomStep]);

  const cellFor = (event: PointerEvent): CellPos | null => {
    const rect = canvas.current?.getBoundingClientRect();
    const left = rect?.left ?? 0;
    const top = rect?.top ?? 0;
    return cellAt(geomRef.current, event.clientX - left, event.clientY - top);
  };

  const clearTimer = (): void => {
    const g = gesture.current;
    if (g.timer) clearTimeout(g.timer);
    g.timer = null;
  };

  const finish = (): void => {
    const g = gesture.current;
    clearTimer();
    if (g.stroking) latest.current.onStrokeEnd();
    gesture.current = idle();
  };

  const onPointerDown = (event: PointerEvent): void => {
    const mode = latest.current.dragMode;
    const cell = cellFor(event);
    const g = idle();
    gesture.current = g;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
    if (mode === "pan") {
      g.panFrom = { x: event.clientX, y: event.clientY, pan: latest.current.pan };
    }
    if (!cell) return;
    g.start = cell;
    g.last = cell;
    g.timer = setTimeout(() => {
      g.timer = null;
      if (g.moved || g.stroking) return;
      g.longFired = true;
      latest.current.onLongPress(cell);
    }, LONG_PRESS_MS);
  };

  const onPointerMove = (event: PointerEvent): void => {
    const g = gesture.current;
    if (g.panFrom) {
      const dx = event.clientX - g.panFrom.x;
      const dy = event.clientY - g.panFrom.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        g.moved = true;
        clearTimer();
        latest.current.onPanChange({ x: g.panFrom.pan.x + dx, y: g.panFrom.pan.y + dy });
      }
      return;
    }
    if (!g.start || latest.current.dragMode !== "paint") return;
    const cell = cellFor(event);
    if (!cell) {
      finish();
      return;
    }
    if (g.last && cell.x === g.last.x && cell.y === g.last.y) return;
    g.moved = true;
    clearTimer();
    if (!g.stroking) {
      g.stroking = true;
      latest.current.onStrokeStart(g.start);
    }
    for (const step of linePath(g.last ?? cell, cell)) latest.current.onStrokeCell(step);
    g.last = cell;
  };

  const onPointerUp = (): void => {
    const g = gesture.current;
    const tapCell = !g.moved && !g.longFired && g.start ? g.start : null;
    finish();
    if (tapCell) latest.current.onTap(tapCell);
  };

  return (
    <div
      ref={host}
      class="fd-board-host"
      role="application"
      aria-label={t("boardLabel")}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: the board is a keyboard application surface
      tabIndex={0}
      data-testid="board-host"
      onKeyDown={props.onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={finish}
      onPointerLeave={finish}
      onContextMenu={(event) => event.preventDefault()}
    >
      {/* biome-ignore lint/a11y/noInteractiveElementToNoninteractiveRole: the canvas is decoration for the text summary */}
      <canvas ref={canvas} class="fd-board-canvas" data-testid="board-canvas" role="presentation" />
      <Marks
        geom={geom}
        placements={props.view.placements}
        {...(props.highlights ? { highlights: props.highlights } : {})}
      />
      <div class="fd-sr-only" role="status" aria-live="polite" data-testid="board-live">
        {props.announcement ? `${props.announcement}. ` : ""}
        {boardSummary(props.view)}
      </div>
    </div>
  );
}
