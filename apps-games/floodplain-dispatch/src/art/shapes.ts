import type { PaletteToken } from "../theme/tokens";

export type Role = PaletteToken | "wall" | "roof" | "leaf" | "leafDark" | "trunk";

export type RoleColors = Readonly<Record<Role, string>>;

interface Paint {
  fill?: Role;
  stroke?: Role;
  sw?: number;
  a?: number;
}

export type Shape =
  | ({ k: "rect"; x: number; y: number; w: number; h: number; r?: number } & Paint)
  | ({ k: "circle"; x: number; y: number; r: number } & Paint)
  | ({ k: "poly"; pts: readonly number[]; open?: boolean } & Paint);

export const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  fill?: Role,
  extra: Partial<Paint> & { r?: number } = {},
): Shape => ({ k: "rect", x, y, w, h, ...(fill ? { fill } : {}), ...extra });

export const circle = (
  x: number,
  y: number,
  r: number,
  fill?: Role,
  extra: Partial<Paint> = {},
): Shape => ({ k: "circle", x, y, r, ...(fill ? { fill } : {}), ...extra });

export const poly = (
  pts: readonly number[],
  fill?: Role,
  extra: Partial<Paint> & { open?: boolean } = {},
): Shape => ({ k: "poly", pts, ...(fill ? { fill } : {}), ...extra });

export const INK_LINE = 2.5 as const;
