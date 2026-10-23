import {
  type GalleryEntry,
  galleryEntryText,
  getChallenge,
  MAX_GALLERY,
  openSlots,
} from "@web-games/dress-rehearsal-core";
import { Button, Screen, StarRating } from "@web-games/kit";
import { useState } from "preact/hooks";
import { entryExportInput, entryShareText, slotsOfLook } from "../export/inputs";
import { Confirm } from "../sheets/Confirm";
import { ExportSheet } from "../sheets/Export";
import { useApp, useProfile } from "../state/app";
import { t } from "../strings";
import { BoardThumb } from "../ui/BoardThumb";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";

function slotsFor(entry: GalleryEntry) {
  const def = entry.kind === "campaign" ? getChallenge(entry.ref) : undefined;
  return def ? openSlots(def.slotSet) : slotsOfLook(entry.look);
}

export function Gallery() {
  const { game } = useApp();
  const profile = useProfile();
  const [sharing, setSharing] = useState<GalleryEntry | null>(null);
  const [deleting, setDeleting] = useState<GalleryEntry | null>(null);
  const empty = Math.max(0, MAX_GALLERY - profile.gallery.length);
  return (
    <Screen name="gallery">
      <Header title={t("galleryTitle")} />
      <p class="dr-note" data-testid="gallery-count">
        {t("galleryCount", { count: profile.gallery.length, max: MAX_GALLERY })}
      </p>
      <ul class="dr-grid dr-gallery" data-testid="gallery-grid">
        {profile.gallery.map((entry) => (
          <li key={entry.id} class="dr-card dr-gallery__entry" data-entry={entry.id}>
            <BoardThumb look={entry.look} slots={slotsFor(entry)} />
            <p class="dr-gallery__text">{galleryEntryText(entry)}</p>
            <StarRating value={entry.stars} label={t("starsLabel", { stars: entry.stars })} />
            <div class="dr-gallery__actions">
              <Button size="small" variant="secondary" onClick={() => setSharing(entry)}>
                <Icon name="share" size={18} /> {t("gallerySharePic")}
              </Button>
              <Button size="small" variant="secondary" onClick={() => setDeleting(entry)}>
                <Icon name="clear" size={18} /> {t("galleryDelete")}
              </Button>
            </div>
          </li>
        ))}
        {Array.from({ length: empty }, (_, i) => (
          <li
            key={`empty-${i}`}
            class="dr-gallery__empty"
            data-empty="true"
            aria-label={t("galleryEmptySlot")}
          >
            <span aria-hidden="true">{profile.gallery.length + i + 1}</span>
          </li>
        ))}
      </ul>
      {sharing && entryExportInput(sharing, profile.frameSelected) ? (
        <ExportSheet
          open
          onClose={() => setSharing(null)}
          build={(frame) => {
            const input = entryExportInput(sharing, frame);
            if (!input) throw new Error("gallery entry has no export input");
            return input;
          }}
          shareText={entryShareText(sharing, profile.daily.streak)}
        />
      ) : null}
      <Confirm
        open={deleting !== null}
        title={t("galleryDeleteTitle")}
        body={t("galleryDeleteBody")}
        confirmLabel={t("galleryDelete")}
        cancelLabel={t("cancel")}
        danger
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          const target = deleting;
          setDeleting(null);
          if (target) void game.deleteBoard(target.id);
        }}
      />
    </Screen>
  );
}
