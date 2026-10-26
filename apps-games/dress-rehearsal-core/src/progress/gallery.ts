import { CHALLENGE_BY_ID, CHAPTERS } from "../content";
import { GAME_TITLE } from "../content/strings";
import type { Look, Stars } from "../types";
import { isDateKey } from "./dates";
import { cleanLook, MAX_GALLERY, toStars } from "./profile";
import type { GalleryEntry, Profile, ResultKind } from "./types";

export type GalleryFailure = "GALLERY_FULL" | "NO_STARS" | "BAD_ENTRY";

export type GalleryResult =
  | { readonly ok: true; readonly profile: Profile; readonly entry: GalleryEntry }
  | { readonly ok: false; readonly reason: GalleryFailure };

export interface GalleryDraft {
  readonly kind: ResultKind;
  readonly ref: string;
  readonly look: Look;
  readonly stars: Stars;
  readonly harmony: number;
  readonly savedKey: string;
}

function nextId(profile: Profile, draft: GalleryDraft): string {
  const taken = new Set(profile.gallery.map((entry) => entry.id));
  const base = `${draft.kind}-${draft.ref}-${draft.savedKey}`;
  let counter = 1;
  while (taken.has(`${base}-${counter}`)) counter += 1;
  return `${base}-${counter}`;
}

function validRef(draft: GalleryDraft): boolean {
  return draft.kind === "campaign" ? CHALLENGE_BY_ID.has(draft.ref) : isDateKey(draft.ref);
}

export function saveToGallery(profile: Profile, draft: GalleryDraft): GalleryResult {
  const stars = toStars(draft.stars);
  if (stars === 0) return { ok: false, reason: "NO_STARS" };
  const look = cleanLook(draft.look);
  if (look === null || !validRef(draft) || !isDateKey(draft.savedKey)) {
    return { ok: false, reason: "BAD_ENTRY" };
  }
  if (profile.gallery.length >= MAX_GALLERY) return { ok: false, reason: "GALLERY_FULL" };
  const entry: GalleryEntry = {
    id: nextId(profile, draft),
    kind: draft.kind,
    ref: draft.ref,
    look,
    stars,
    harmony: Math.min(100, Math.max(0, Math.floor(draft.harmony))),
    savedKey: draft.savedKey,
  };
  return { ok: true, profile: { ...profile, gallery: [...profile.gallery, entry] }, entry };
}

export function removeFromGallery(profile: Profile, id: string): Profile {
  if (!profile.gallery.some((entry) => entry.id === id)) return profile;
  return { ...profile, gallery: profile.gallery.filter((entry) => entry.id !== id) };
}

export function galleryEntryText(entry: GalleryEntry): string {
  const score = `${entry.stars}/3 stars, harmony ${entry.harmony}`;
  if (entry.kind === "daily") return `${GAME_TITLE} Daily ${entry.ref}: ${score}`;
  const def = CHALLENGE_BY_ID.get(entry.ref);
  const chapter = def === undefined ? undefined : CHAPTERS[def.chapterIndex];
  if (def === undefined || chapter === undefined) return `${GAME_TITLE}: ${score}`;
  return `${chapter.title} "${def.name}": ${score}`;
}
