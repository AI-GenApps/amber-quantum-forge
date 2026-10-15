export interface Box {
  x: number;
  z: number;
  /** Unit heading. */
  hx: number;
  hz: number;
  halfLength: number;
  halfWidth: number;
}

function axes(b: Box): [number, number][] {
  return [
    [b.hx, b.hz],
    [-b.hz, b.hx],
  ];
}

function radius(b: Box, ax: number, az: number): number {
  return (
    b.halfLength * Math.abs(b.hx * ax + b.hz * az) + b.halfWidth * Math.abs(-b.hz * ax + b.hx * az)
  );
}

/** Separating-axis test for two oriented rectangles on the ground plane. */
export function obbOverlap(a: Box, b: Box): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  for (const [ax, az] of [...axes(a), ...axes(b)]) {
    if (Math.abs(dx * ax + dz * az) > radius(a, ax, az) + radius(b, ax, az)) return false;
  }
  return true;
}
