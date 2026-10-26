import type { Face } from "@web-games/the-last-window-core";
import type { ComponentChildren } from "preact";
import { WALKIN_IDS, type WalkinId } from "../slots";
import { C } from "./colors";
import { FaceMarks } from "./face";

interface Silhouette {
  coat: string;
  skin: string;
  back?: ComponentChildren;
  front?: ComponentChildren;
}

const SILHOUETTES: Readonly<Record<WalkinId, Silhouette>> = {
  "walkin-umbrella": {
    coat: C.denim,
    skin: C.skinWarm,
    back: (
      <g>
        <path
          d="M30 120 C40 20 260 20 270 120 C240 100 210 110 150 100 C90 110 60 100 30 120Z"
          fill={C.brick}
        />
        <path d="M150 100 V300" stroke={C.ink} stroke-width="6" />
      </g>
    ),
  },
  "walkin-oilskin": {
    coat: C.mustard,
    skin: C.skinFair,
    back: <path d="M70 120 C70 40 230 40 230 120 L240 250 H60Z" fill={C.lampDeep} />,
    front: <path d="M96 122 C100 96 200 96 204 122 L214 150 H86Z" fill={C.mustard} opacity="0.9" />,
  },
  "walkin-satchel": {
    coat: C.nightMid,
    skin: C.skinMid,
    front: (
      <g>
        <path d="M60 330 L230 400" stroke={C.brown} stroke-width="12" />
        <rect x="200" y="350" width="64" height="50" rx="8" fill={C.brown} />
        <path d="M92 110 C98 70 202 70 208 110Z" fill={C.coal} />
      </g>
    ),
  },
  "walkin-basket": {
    coat: C.terracotta,
    skin: C.skinWarm,
    front: (
      <g>
        <path d="M84 112 C90 66 210 66 216 112 L226 190 L74 190Z" fill={C.sage} opacity="0.95" />
        <path d="M40 350 H140 L130 400 H50Z" fill={C.wood} />
        <path
          d="M52 350 C60 310 128 310 136 350"
          stroke={C.lampDeep}
          stroke-width="6"
          fill="none"
        />
      </g>
    ),
  },
  "walkin-nurse": {
    coat: C.teal,
    skin: C.skinDeep,
    front: (
      <g>
        <path d="M96 100 C100 62 200 62 204 100Z" fill={C.paper} />
        <rect x="136" y="78" width="28" height="8" rx="3" fill={C.brick} />
        <path
          d="M112 300 C110 350 190 350 188 300"
          stroke={C.paperDark}
          stroke-width="6"
          fill="none"
        />
      </g>
    ),
  },
  "walkin-leash": {
    coat: C.brick,
    skin: C.skinFair,
    front: (
      <g>
        <path d="M80 112 C92 74 208 74 220 112 L240 120 L60 120Z" fill={C.tweed} />
        <path d="M230 330 C270 340 280 380 252 396" stroke={C.lamp} stroke-width="5" fill="none" />
        <circle cx="250" cy="396" r="9" fill={C.lamp} />
      </g>
    ),
  },
};

export function isWalkinId(value: string): value is WalkinId {
  return (WALKIN_IDS as readonly string[]).includes(value);
}

export function WalkinBust({ id, face }: { id: WalkinId; face: Face }) {
  const look = SILHOUETTES[id];
  return (
    <g data-walkin={id}>
      {look.back}
      <path d="M14 400 C14 330 70 296 150 296 C230 296 286 330 286 400Z" fill={look.coat} />
      <rect x="128" y="226" width="44" height="76" rx="14" fill={look.skin} />
      <ellipse cx="150" cy="150" rx="68" ry="82" fill={look.skin} />
      <FaceMarks face={face} />
      {look.front}
    </g>
  );
}
