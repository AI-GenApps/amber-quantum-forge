import { Button, plural, Sheet, StarRating } from "@web-games/kit";
import { formatDuration, getChapter } from "@web-games/lantern-loops-core";
import { useEffect, useRef } from "preact/hooks";
import { useApp, useSheetBack } from "../app/AppContext";
import { EmberIcon } from "../components/icons";
import { starPop } from "../motion/presets";
import type { WinSummary } from "../state/finish";
import { t } from "../strings";

export interface WinSheetProps {
  summary: WinSummary | null;
  onNext: () => void;
  onReplay: () => void;
  onShare: () => void;
  onHome: () => void;
}

export function WinSheet({ summary, onNext, onReplay, onShare, onHome }: WinSheetProps) {
  const { motion } = useApp();
  const body = useRef<HTMLDivElement>(null);
  const shown = summary !== null;
  useSheetBack(shown, onHome);
  useEffect(() => {
    if (!shown || !body.current) return;
    const stars = Array.from(body.current.querySelectorAll<SVGElement>(".wg-star--on"));
    void starPop(motion, stars);
  }, [shown, motion]);
  if (summary === null) return null;
  const tutorial = summary.kind === "tutorial";
  const shareable = summary.shareText !== null;
  const cleared = summary.chaptersCleared.map((id) => getChapter(id).title);
  return (
    <Sheet open onClose={onHome} title={t("win.title")} dismissOnBackdrop={false}>
      <div class="ll-win" data-kind={summary.kind} ref={body}>
        {tutorial ? null : (
          <StarRating value={summary.stars} label={t("win.stars", { count: summary.stars })} />
        )}
        <ul class="ll-win-list">
          <li data-testid="win-time">{t("win.time", { time: formatDuration(summary.seconds) })}</li>
          {tutorial ? null : (
            <li data-testid="win-hints">{t("win.hints", { count: summary.hints })}</li>
          )}
          {summary.tokensGranted > 0 ? (
            <li class="ll-tokens-line" data-testid="win-tokens">
              <EmberIcon />
              {t("win.tokens", { count: summary.tokensGranted })}
            </li>
          ) : null}
          {summary.tokensCapped ? <li>{t("win.tokensCapped")}</li> : null}
          {summary.newBestTime ? <li>{t("win.bestTime")}</li> : null}
          {summary.streak !== null ? (
            <li data-testid="win-streak">
              {t("win.streak", {
                count: summary.streak,
                unit: plural(summary.streak, t("unit.day"), t("unit.days")),
              })}
            </li>
          ) : null}
          {summary.events.map((event) => {
            if (event.kind === "freeze-used") return <li key="freeze">{t("win.freezeUsed")}</li>;
            if (event.kind === "milestone") {
              return (
                <li key={`milestone-${event.days}`}>
                  {t("win.milestone", { count: event.days, tokens: event.tokens })}
                </li>
              );
            }
            return null;
          })}
          {cleared.map((title) => (
            <li key={title}>{t("win.chapterCleared", { title })}</li>
          ))}
        </ul>
        <div class="ll-stack">
          {summary.nextId !== null || tutorial ? (
            <Button fullWidth onClick={onNext}>
              {tutorial
                ? summary.nextId === null
                  ? t("win.finish")
                  : t("common.continue")
                : t("win.next")}
            </Button>
          ) : null}
          {shareable ? (
            <Button
              fullWidth
              variant={summary.nextId === null ? "primary" : "secondary"}
              onClick={onShare}
            >
              {t("win.share")}
            </Button>
          ) : null}
          {tutorial ? null : (
            <Button fullWidth variant="secondary" onClick={onReplay}>
              {t("common.replay")}
            </Button>
          )}
          <Button fullWidth variant="ghost" onClick={onHome}>
            {t("common.home")}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}
