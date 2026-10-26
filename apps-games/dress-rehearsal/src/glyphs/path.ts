export type PathOp = "M" | "L" | "Q" | "C" | "Z";

export interface PathCommand {
  readonly op: PathOp;
  readonly args: readonly number[];
}

const ARITY: Readonly<Record<PathOp, number>> = { M: 2, L: 2, Q: 4, C: 6, Z: 0 };

function isPathOp(token: string): token is PathOp {
  return token in ARITY;
}

/** Parses absolute M, L, Q, C and Z path data, the only commands the garment drawings use. */
export function parsePath(d: string): PathCommand[] {
  const out: PathCommand[] = [];
  const tokens = d.match(/[A-Za-z]|-?\d+(?:\.\d+)?/g) ?? [];
  let index = 0;
  while (index < tokens.length) {
    const op = tokens[index] as string;
    index += 1;
    if (!isPathOp(op)) throw new Error(`Unsupported path command ${op}`);
    const arity = ARITY[op];
    const args = tokens.slice(index, index + arity).map(Number);
    if (args.length !== arity || args.some((value) => Number.isNaN(value))) {
      throw new Error(`Path command ${op} needs ${arity} numbers`);
    }
    index += arity;
    out.push({ op, args });
  }
  return out;
}
