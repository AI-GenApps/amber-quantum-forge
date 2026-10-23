import type { Face } from "@web-games/the-last-window-core";
import { C } from "./colors";
import { FaceMarks } from "./face";
import { BodyGear, FaceGear } from "./gear";
import { HairBack, HairFront } from "./hair";
import { type Look, lookFor } from "./looks";

const FACE_GEAR = new Set([
  "round-glasses",
  "tortoise-glasses",
  "spectacles",
  "moustache",
  "freckles",
]);

export interface BustProps {
  look: Look;
  face: Face;
}

/** Shoulders-up bust on a 300 x 400 canvas: head about 41 percent of the height, eyes at 38 percent. */
export function Bust({ look, face }: BustProps) {
  const neck = C.ink;
  return (
    <g>
      <HairBack look={look} />
      <path d="M14 400 C14 330 70 296 150 296 C230 296 286 330 286 400Z" fill={look.outfit} />
      <path d="M118 296 C130 320 170 320 182 296Z" fill={look.trim} opacity="0.6" />
      {look.gear
        .filter((gear) => !FACE_GEAR.has(gear))
        .map((gear) => (
          <BodyGear key={gear} gear={gear} look={look} />
        ))}
      <rect x="128" y="226" width="44" height="76" rx="14" fill={look.skin} />
      <path d="M128 262 Q150 280 172 262 V280 Q150 296 128 280Z" fill={neck} opacity="0.12" />
      <ellipse cx="82" cy="160" rx="10" ry="16" fill={look.skin} />
      <ellipse cx="218" cy="160" rx="10" ry="16" fill={look.skin} />
      <ellipse cx="150" cy="150" rx="68" ry="82" fill={look.skin} />
      <FaceMarks face={face} />
      {look.gear
        .filter((gear) => FACE_GEAR.has(gear))
        .map((gear) => (
          <FaceGear key={gear} gear={gear} look={look} />
        ))}
      <HairFront look={look} />
    </g>
  );
}

export function RegularBust({ regularId, face }: { regularId: number; face: Face }) {
  return <Bust look={lookFor(regularId)} face={face} />;
}
