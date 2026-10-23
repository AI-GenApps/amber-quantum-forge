import { C } from "./colors";

const SHADOW = <ellipse cx="50" cy="90" rx="28" ry="5" fill={C.ink} opacity="0.25" />;

interface CupStyle {
  liquid: string;
  top?: string;
  steam?: boolean;
  extra?: "leaves" | "honey" | "marshmallow" | "layers";
}

const CUPS: Readonly<Record<string, CupStyle>> = {
  "drink-1": { liquid: C.coal, steam: true },
  "drink-2": { liquid: C.brown, top: C.paper, extra: "layers" },
  "drink-3": { liquid: C.sand, steam: true, extra: "leaves" },
  "drink-4": { liquid: C.glow, extra: "honey", steam: true },
  "drink-5": { liquid: C.auburn, top: C.paperDark, extra: "marshmallow" },
  "drink-6": { liquid: C.ink, top: C.paper, extra: "layers", steam: true },
};

export function Drink({ id }: { id: string }) {
  const style = CUPS[id] ?? (CUPS["drink-1"] as CupStyle);
  return (
    <g data-item={id}>
      {SHADOW}
      <ellipse cx="50" cy="82" rx="38" ry="7" fill={C.paperDark} />
      <path
        d="M20 40 H80 L74 78 Q50 88 26 78Z"
        fill={C.paper}
        stroke={C.inkSoft}
        stroke-width="3"
      />
      <path d="M80 48 C98 46 98 70 77 68" stroke={C.inkSoft} stroke-width="5" fill="none" />
      <ellipse
        cx="50"
        cy="40"
        rx="30"
        ry="7"
        fill={style.liquid}
        stroke={C.inkSoft}
        stroke-width="2"
      />
      {style.top ? (
        <ellipse cx="50" cy="39" rx="18" ry="3.5" fill={style.top} opacity="0.9" />
      ) : null}
      {style.extra === "marshmallow" ? (
        <g fill={C.paper}>
          <rect x="38" y="31" width="9" height="8" rx="2" />
          <rect x="52" y="32" width="9" height="8" rx="2" />
        </g>
      ) : null}
      {style.extra === "leaves" ? (
        <path d="M38 41 q6 -6 12 0 q6 -6 12 0" stroke={C.sage} stroke-width="3" fill="none" />
      ) : null}
      {style.extra === "honey" ? <circle cx="60" cy="38" r="5" fill={C.lamp} /> : null}
      {style.extra === "layers" ? (
        <path d="M30 46 H70" stroke={C.paper} stroke-width="3" opacity="0.5" />
      ) : null}
      {style.steam ? (
        <g stroke={C.steam} stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8">
          <path d="M40 28 C34 20 46 14 40 6" />
          <path d="M58 28 C52 20 64 14 58 6" />
        </g>
      ) : null}
    </g>
  );
}

interface PastryStyle {
  body: string;
  mark: string;
  shape: "roll" | "knot" | "tart" | "bun" | "loaf";
}

const PASTRIES: Readonly<Record<string, PastryStyle>> = {
  "pastry-1": { body: C.sand, mark: C.paper, shape: "roll" },
  "pastry-2": { body: C.terracotta, mark: C.paperDark, shape: "knot" },
  "pastry-3": { body: C.lamp, mark: C.sage, shape: "tart" },
  "pastry-4": { body: C.paperDark, mark: C.lamp, shape: "bun" },
  "pastry-5": { body: C.brown, mark: C.glow, shape: "loaf" },
};

export function Pastry({ id }: { id: string }) {
  const style = PASTRIES[id] ?? (PASTRIES["pastry-1"] as PastryStyle);
  return (
    <g data-item={id}>
      {SHADOW}
      <ellipse
        cx="50"
        cy="78"
        rx="40"
        ry="8"
        fill={C.paper}
        stroke={C.paperDark}
        stroke-width="3"
      />
      {style.shape === "roll" ? (
        <ellipse cx="50" cy="58" rx="30" ry="18" fill={style.body} />
      ) : null}
      {style.shape === "knot" ? (
        <path
          d="M22 62 C22 36 50 36 50 56 C50 36 78 36 78 62 C78 78 50 78 50 62 C50 78 22 78 22 62Z"
          fill={style.body}
        />
      ) : null}
      {style.shape === "tart" ? (
        <g>
          <path d="M20 60 L80 60 L72 78 L28 78Z" fill={style.body} />
          <ellipse cx="50" cy="58" rx="30" ry="9" fill={C.glow} />
          <path d="M44 48 C40 56 46 62 52 56 C58 62 62 54 56 48Z" fill={style.mark} />
        </g>
      ) : null}
      {style.shape === "bun" ? (
        <g>
          <ellipse cx="50" cy="60" rx="30" ry="20" fill={style.body} />
          <path d="M30 56 C40 46 60 46 70 56 C60 62 40 62 30 56Z" fill={style.mark} />
        </g>
      ) : null}
      {style.shape === "loaf" ? (
        <g>
          <path d="M18 74 L24 46 C40 36 60 36 76 46 L82 74Z" fill={style.body} />
          <path
            d="M26 52 C40 44 60 44 74 52"
            stroke={style.mark}
            stroke-width="5"
            fill="none"
            stroke-linecap="round"
          />
        </g>
      ) : null}
      <g fill={C.paper} opacity="0.85">
        <circle cx="38" cy="54" r="2" />
        <circle cx="60" cy="60" r="2" />
        <circle cx="50" cy="50" r="2" />
      </g>
    </g>
  );
}

const BOOK_COVERS: Readonly<Record<string, readonly [string, string]>> = {
  "book-1": [C.nightMid, C.lamp],
  "book-2": [C.teal, C.paper],
  "book-3": [C.sage, C.lamp],
  "book-4": [C.brick, C.paperDark],
  "book-5": [C.lamp, C.nightMid],
};

export function Book({ id }: { id: string }) {
  const [cover, mark] = BOOK_COVERS[id] ?? (BOOK_COVERS["book-1"] as readonly [string, string]);
  return (
    <g data-item={id}>
      {SHADOW}
      <rect
        x="24"
        y="12"
        width="52"
        height="74"
        rx="4"
        fill={C.paper}
        stroke={C.inkSoft}
        stroke-width="2"
      />
      <rect
        x="20"
        y="10"
        width="52"
        height="74"
        rx="4"
        fill={cover}
        stroke={C.ink}
        stroke-width="2"
      />
      <rect x="20" y="10" width="9" height="74" rx="3" fill={mark} opacity="0.5" />
      <rect x="36" y="22" width="26" height="18" rx="3" fill={mark} opacity="0.9" />
      <path d="M38 54 H60 M38 62 H54" stroke={mark} stroke-width="3" stroke-linecap="round" />
    </g>
  );
}
