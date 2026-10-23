import { COLOURS } from "@web-games/lantern-loops-core";
import { contrastRatio } from "../../src/theme/contrast";
import { darkGame, darkTheme, highContrastGame, highContrastTheme } from "../../src/theme/tokens";

export interface Pair {
  name: string;
  fg: string;
  bg: string;
  min: number;
}

function pairs(label: string, ui: typeof darkTheme, game: typeof darkGame): Pair[] {
  const out: Pair[] = [];
  const text = (name: string, fg: string, bg: string): void => {
    out.push({ name: `${label} text ${name}`, fg, bg, min: 4.5 });
  };
  const graphic = (name: string, fg: string, bg: string): void => {
    out.push({ name: `${label} graphic ${name}`, fg, bg, min: 3 });
  };
  for (const [surface, hex] of [
    ["background", ui.colorBackground],
    ["surface", ui.colorSurface],
    ["raised", ui.colorSurfaceRaised],
  ] as const) {
    text(`text on ${surface}`, ui.colorText, hex);
    text(`muted on ${surface}`, ui.colorTextMuted, hex);
  }
  text("accent text on accent", ui.colorAccentText, ui.colorAccent);
  text("accent text on danger", ui.colorAccentText, ui.colorDanger);
  text("danger on surface", ui.colorDanger, ui.colorSurface);
  text("success on surface", ui.colorSuccess, ui.colorSurface);
  text("stone numeral on stone", game.stoneText, game.stoneFill);
  graphic("border on background", ui.colorBorder, ui.colorBackground);
  graphic("border on surface", ui.colorBorder, ui.colorSurface);
  graphic("border on raised", ui.colorBorder, ui.colorSurfaceRaised);
  graphic("focus on background", ui.colorFocus, ui.colorBackground);
  graphic("tile ribbon on plate", game.ribbon, game.boardPlate);
  graphic("unlit lantern on plate", game.unlit, game.boardPlate);
  graphic("conflict ring on plate", game.conflict, game.boardPlate);
  for (const colour of COLOURS) {
    graphic(`${colour} lantern on plate`, game.lantern[colour], game.boardPlate);
    graphic(`glyph ink on ${colour} body`, game.ink, game.lantern[colour]);
  }
  graphic("glyph ink on unlit body", game.ink, game.unlit);
  graphic("tile outline on plate (high contrast ribbons)", game.ribbon, game.ribbonOutline);
  return out;
}

export const ALL_PAIRS: Pair[] = [
  ...pairs("default", darkTheme, darkGame),
  ...pairs("high-contrast", highContrastTheme, highContrastGame),
];

export function contrastRows(): Array<Pair & { ratio: number }> {
  return ALL_PAIRS.map((pair) => ({ ...pair, ratio: contrastRatio(pair.fg, pair.bg) }));
}

export function contrastTable(): string {
  const rows = contrastRows();
  const head = "| Pair | Foreground | Background | Ratio | Minimum |\n|---|---|---|---|---|";
  const body = rows.map(
    (r) => `| ${r.name} | ${r.fg} | ${r.bg} | ${r.ratio.toFixed(2)} | ${r.min} |`,
  );
  return [head, ...body].join("\n");
}
