import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { ART_MANIFEST } from "./manifest";
import type { SlotId } from "./slots";

export const ArtContext = createContext<readonly SlotId[]>(ART_MANIFEST);

export function useManifest(): readonly SlotId[] {
  return useContext(ArtContext);
}
