import { loreById } from "@web-games/cloud-observatory-core";
import { useEffect } from "preact/hooks";
import { useApp } from "../app/context";
import { Btn } from "../components/Btn";
import { ManagedSheet } from "../components/ManagedSheet";
import { t } from "../strings";
import { ArtImage } from "../ui/ArtImage";
import { loreSlot } from "../ui/art-slots";

export interface EntryReaderProps {
  entryId: string | null;
  onClose: () => void;
}

/** Reading view for one unlocked lore entry; opening it marks the entry as read. */
export function EntryReader({ entryId, onClose }: EntryReaderProps) {
  const { session, snapshot } = useApp();
  const entry = entryId === null ? undefined : loreById.get(entryId);
  const unlocked = entry !== undefined && snapshot.profile.loreUnlocked.includes(entry.id);

  useEffect(() => {
    if (entry && unlocked) session.markLoreSeen(entry.id);
  }, [entry, unlocked, session]);

  return (
    <ManagedSheet
      open={entry !== undefined && unlocked}
      title={entry?.title ?? ""}
      onClose={onClose}
      class="co-reader"
    >
      {entry ? (
        <article class="co-reader__body" data-reading={entry.id}>
          <ArtImage slot={loreSlot(entry.chapter)} class="co-reader__art" />
          <p class="co-reader__text">{entry.body}</p>
          <Btn fullWidth onClick={onClose}>
            {t("common.close")}
          </Btn>
        </article>
      ) : null}
    </ManagedSheet>
  );
}
