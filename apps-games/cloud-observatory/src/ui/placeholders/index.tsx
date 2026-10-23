import type { ComponentChildren } from "preact";
import type { ArtSlot } from "../art-slots";
import { EmblemPlaceholder } from "./emblem";
import { InstrumentPlaceholder } from "./instruments";
import { LorePlaceholder } from "./lore";
import {
  BuildingPlaceholder,
  FeaturePlaceholder,
  HillsPlaceholder,
  IconPlaceholder,
  KeyArtPlaceholder,
  NebulaPlaceholder,
  SkyFarPlaceholder,
} from "./scenes";

export interface PlaceholderDrawing {
  readonly viewBox: string;
  readonly aspect: string;
  readonly body: ComponentChildren;
}

/** Code-drawn stand-in for a slot, in the art-bible palette. */
export function placeholderFor(slot: ArtSlot): PlaceholderDrawing {
  if (slot.startsWith("emblem-")) {
    return {
      viewBox: "0 0 144 144",
      aspect: "xMidYMid meet",
      body: <EmblemPlaceholder id={slot.slice(7)} />,
    };
  }
  if (slot.startsWith("instrument-")) {
    return {
      viewBox: "0 0 112 112",
      aspect: "xMidYMid meet",
      body: <InstrumentPlaceholder id={slot.slice(11)} />,
    };
  }
  if (slot.startsWith("lore-")) {
    return {
      viewBox: "0 0 300 450",
      aspect: "xMidYMid slice",
      body: <LorePlaceholder chapter={Number(slot.slice(5))} />,
    };
  }
  switch (slot) {
    case "key-art":
      return { viewBox: "0 0 360 540", aspect: "xMidYMid slice", body: <KeyArtPlaceholder /> };
    case "observatory-building":
      return { viewBox: "0 0 320 320", aspect: "xMidYMax meet", body: <BuildingPlaceholder /> };
    case "sky-far":
      return { viewBox: "0 0 390 585", aspect: "xMidYMid slice", body: <SkyFarPlaceholder /> };
    case "nebula-mid":
      return { viewBox: "0 0 390 585", aspect: "xMidYMid slice", body: <NebulaPlaceholder /> };
    case "horizon-hills":
      return { viewBox: "0 0 390 585", aspect: "xMidYMax slice", body: <HillsPlaceholder /> };
    case "icon":
      return { viewBox: "0 0 512 512", aspect: "xMidYMid meet", body: <IconPlaceholder /> };
    default:
      return { viewBox: "0 0 768 512", aspect: "xMidYMid slice", body: <FeaturePlaceholder /> };
  }
}
