import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { LiveRegion } from "../a11y/LiveRegion";
import { conflictAnnouncement } from "../a11y/labels";
import { useSessionState } from "../state/hooks";
import type { Session } from "../state/session";
import { t } from "../strings";
import { BoardView } from "./BoardView";
import { interpretKey } from "./keys";
import { computeMarks } from "./marks";
import { useBoardInput } from "./useBoardInput";

export type BoardCommand = "hint" | "pause";

export interface PlayBoardProps {
  session: Session;
  showConflicts: boolean;
  highContrast: boolean;
  cellPx: number;
  highlight?: readonly number[];
  disabled?: boolean;
  onCommand?: (command: BoardCommand) => void;
}

/** The interactive board: pointer drawing, long-press erase, keyboard play and announcements. */
export function PlayBoard({
  session,
  showConflicts,
  highContrast,
  cellPx,
  highlight,
  disabled = false,
  onCommand,
}: PlayBoardProps) {
  const state = useSessionState(session);
  const { puzzle } = session;
  const svg = useRef<SVGSVGElement>(null);
  const [focus, setFocus] = useState(0);
  const [focused, setFocused] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const marks = useMemo(
    () => computeMarks(puzzle, state.tiles, state.evaluation, showConflicts),
    [puzzle, state.tiles, state.evaluation, showConflicts],
  );
  const locked = disabled || state.solved;

  const handlers = useBoardInput({
    size: puzzle.size,
    disabled: locked,
    getRect: () => svg.current?.getBoundingClientRect() ?? null,
    onTap: (cell) => {
      setFocus(cell);
      session.tap(cell);
    },
    onLongPress: (cell) => {
      setFocus(cell);
      session.erase(cell);
    },
    onDragStart: () => session.beginDrag(),
    onDrag: (cells) => session.updateDrag(cells),
    onDragEnd: () => void session.endDrag(),
    onDragCancel: () => session.cancelDrag(),
  });

  const previousCount = useRef(0);
  useEffect(() => {
    if (state.solved) {
      setAnnouncement(t("live.solved"));
      return;
    }
    if (!showConflicts || previousCount.current === marks.conflictCount) return;
    previousCount.current = marks.conflictCount;
    setAnnouncement(conflictAnnouncement(marks.conflictCount));
  }, [state.solved, showConflicts, marks.conflictCount]);

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const action = interpretKey(event.key, focus, puzzle.size);
    if (action === null) return;
    event.preventDefault();
    switch (action.type) {
      case "move":
        setFocus(action.cell);
        break;
      case "apply":
        if (!locked) session.tap(focus);
        break;
      case "brush":
        session.setBrush(action.brush);
        break;
      case "undo":
        if (!locked) session.undo();
        break;
      case "redo":
        if (!locked) session.redo();
        break;
      default:
        onCommand?.(action.type);
        break;
    }
  };

  return (
    <div class="ll-board-wrap">
      <BoardView
        puzzle={puzzle}
        state={state}
        marks={marks}
        highContrast={highContrast}
        cellPx={cellPx}
        focus={focused ? focus : null}
        {...(highlight === undefined ? {} : { highlight })}
        svgRef={svg}
        handlers={handlers}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <LiveRegion message={announcement} />
    </div>
  );
}
