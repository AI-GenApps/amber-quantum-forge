import { formatNumberWords } from "@web-games/cloud-observatory-core";
import { useMemo } from "preact/hooks";
import { useApp } from "../app/context";
import { t } from "../strings";
import { createAnnouncer } from "../ui/announcer";

/** Visually hidden polite live region that mentions the starlight total at most every 5 seconds. */
export function LiveStarlight() {
  const { snapshot, now } = useApp();
  const announcer = useMemo(() => createAnnouncer(now), [now]);
  const text = t("shell.liveStarlight", {
    amount: formatNumberWords(snapshot.profile.game.starlight),
  });
  return (
    <p class="co-sr-only" role="status" aria-live="polite" data-live="starlight">
      {announcer.update(text)}
    </p>
  );
}
