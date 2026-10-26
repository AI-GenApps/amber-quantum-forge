import { describe, expect, it } from "vitest";
import {
  defaultProfile,
  type GalleryDraft,
  galleryEntryText,
  MAX_GALLERY,
  type Profile,
  removeFromGallery,
  saveToGallery,
} from "../src/index";

const LOOK = {
  top: "item-riviera-1",
  bottom: "item-riviera-4",
  shoes: "item-riviera-5",
  bag: "item-riviera-6",
  hat: "item-riviera-7",
  accessory: "item-riviera-8",
};

function draft(overrides: Partial<GalleryDraft> = {}): GalleryDraft {
  return {
    kind: "campaign",
    ref: "riv-01",
    look: LOOK,
    stars: 3,
    harmony: 83,
    savedKey: "2026-10-23",
    ...overrides,
  };
}

function fill(count: number): Profile {
  let profile = defaultProfile();
  for (let i = 0; i < count; i += 1) {
    const result = saveToGallery(profile, draft());
    if (!result.ok) throw new Error(result.reason);
    profile = result.profile;
  }
  return profile;
}

describe("saveToGallery", () => {
  it("adds an entry with a generated id", () => {
    const result = saveToGallery(defaultProfile(), draft());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.profile.gallery).toHaveLength(1);
    expect(result.entry).toMatchObject({
      kind: "campaign",
      ref: "riv-01",
      stars: 3,
      harmony: 83,
      savedKey: "2026-10-23",
    });
    expect(result.entry.look).toEqual(LOOK);
  });

  it("gives every entry a distinct id, even for the same board saved twice", () => {
    const ids = fill(5).gallery.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("accepts up to 24 boards and rejects the 25th with a typed error", () => {
    const full = fill(24);
    expect(full.gallery).toHaveLength(MAX_GALLERY);
    expect(saveToGallery(full, draft())).toEqual({ ok: false, reason: "GALLERY_FULL" });
  });

  it("rejects a board with zero stars", () => {
    expect(saveToGallery(defaultProfile(), draft({ stars: 0 }))).toEqual({
      ok: false,
      reason: "NO_STARS",
    });
  });

  it("rejects entries that reference nothing real", () => {
    const start = defaultProfile();
    const bad = { ok: false, reason: "BAD_ENTRY" };
    expect(saveToGallery(start, draft({ ref: "nope" }))).toEqual(bad);
    expect(saveToGallery(start, draft({ look: {} }))).toEqual(bad);
    expect(saveToGallery(start, draft({ look: { top: "item-riviera-5" } }))).toEqual(bad);
    expect(saveToGallery(start, draft({ kind: "daily", ref: "riv-01" }))).toEqual(bad);
    expect(saveToGallery(start, draft({ savedKey: "today" }))).toEqual(bad);
  });

  it("accepts a daily board keyed by its date", () => {
    const result = saveToGallery(
      defaultProfile(),
      draft({ kind: "daily", ref: "2026-10-23", stars: 2 }),
    );
    expect(result.ok).toBe(true);
  });

  it("does not mutate the input", () => {
    const start = defaultProfile();
    saveToGallery(start, draft());
    expect(start.gallery).toEqual([]);
  });
});

describe("removeFromGallery", () => {
  it("removes one entry and frees a slot", () => {
    const full = fill(24);
    const id = full.gallery[3]?.id ?? "";
    const smaller = removeFromGallery(full, id);
    expect(smaller.gallery).toHaveLength(23);
    expect(smaller.gallery.some((entry) => entry.id === id)).toBe(false);
    expect(saveToGallery(smaller, draft()).ok).toBe(true);
  });

  it("returns the same profile for an unknown id", () => {
    const profile = fill(2);
    expect(removeFromGallery(profile, "missing")).toBe(profile);
  });
});

describe("galleryEntryText", () => {
  it("names the chapter and challenge for a campaign board", () => {
    const result = saveToGallery(defaultProfile(), draft({ ref: "gal-01" }));
    if (!result.ok) throw new Error(result.reason);
    expect(galleryEntryText(result.entry)).toBe('Gala Night "Cloakroom": 3/3 stars, harmony 83');
  });

  it("names the date for a daily board", () => {
    const result = saveToGallery(
      defaultProfile(),
      draft({ kind: "daily", ref: "2026-10-23", stars: 2, harmony: 76 }),
    );
    if (!result.ok) throw new Error(result.reason);
    expect(galleryEntryText(result.entry)).toBe(
      "Dress Rehearsal Daily 2026-10-23: 2/3 stars, harmony 76",
    );
  });
});
