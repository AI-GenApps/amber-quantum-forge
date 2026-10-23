import type { Placement } from "@web-games/floodplain-dispatch-core";
import { useEffect, useRef, useState } from "preact/hooks";
import { useMotion } from "../motion/useMotion";
import { type CellPos, cellOrigin, type Geometry } from "./geometry";

export interface MarksProps {
  geom: Geometry;
  placements: readonly Placement[];
  highlights?: readonly CellPos[];
}

const keyOf = (p: Placement): string => `${p.kind}:${p.x}:${p.y}`;

interface PopEntry {
  id: number;
  x: number;
  y: number;
}

function Pop({ entry, geom, onDone }: { entry: PopEntry; geom: Geometry; onDone: () => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motion = useMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    void motion.placementPop(element).then(onDone);
  }, [motion, onDone]);
  const { px, py } = cellOrigin(geom, entry.x, entry.y);
  return (
    <span
      ref={ref}
      class="fd-mark fd-mark--pop"
      data-testid="placement-pop"
      style={{ left: px, top: py, width: geom.cell, height: geom.cell }}
    />
  );
}

/** Decorative overlay above the canvas: placement pops and tutorial rings. Never takes input. */
export function Marks({ geom, placements, highlights = [] }: MarksProps) {
  const known = useRef<Set<string>>(new Set(placements.map(keyOf)));
  const counter = useRef(0);
  const [pops, setPops] = useState<PopEntry[]>([]);

  useEffect(() => {
    const now = new Set(placements.map(keyOf));
    const fresh = placements.filter((p) => !known.current.has(keyOf(p)));
    known.current = now;
    if (fresh.length === 0) return;
    const entries = fresh.map((p) => {
      counter.current += 1;
      return { id: counter.current, x: p.x, y: p.y };
    });
    setPops((list) => [...list, ...entries]);
  }, [placements]);

  return (
    <div class="fd-marks" aria-hidden="true">
      {highlights.map((cell) => {
        const { px, py } = cellOrigin(geom, cell.x, cell.y);
        return (
          <span
            key={`${cell.x}:${cell.y}`}
            class="fd-mark fd-mark--ring"
            data-testid="tutorial-ring"
            style={{ left: px, top: py, width: geom.cell, height: geom.cell }}
          />
        );
      })}
      {pops.map((entry) => (
        <Pop
          key={entry.id}
          entry={entry}
          geom={geom}
          onDone={() => setPops((list) => list.filter((item) => item.id !== entry.id))}
        />
      ))}
    </div>
  );
}
