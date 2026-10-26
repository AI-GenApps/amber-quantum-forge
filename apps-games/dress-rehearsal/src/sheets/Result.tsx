import {
  CHAPTERS,
  CLIENT_BY_ID,
  CLIENT_IDS,
  type ProgressEvent,
  resultHeadline,
  type ScoreResult,
  STAR_NAMES,
} from "@web-games/dress-rehearsal-core";
import { Button, StarRating } from "@web-games/kit";
import { useEffect, useRef } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { clientSlot } from "../art/slots";
import { HarmonyMeter } from "../board/HarmonyMeter";
import { RuleChips } from "../board/RuleChips";
import { useMotion } from "../motion/useMotion";
import type { Session } from "../state/session";
import { t } from "../strings";
import { AppSheet } from "./AppSheet";

export interface ResultProps {
  open: boolean;
  session: Session;
  score: ScoreResult;
  events: readonly ProgressEvent[] | null;
  streak: number | null;
  saved: boolean;
  hasNext: boolean;
  note: string;
  onSave: () => void;
  onExport: () => void;
  onNext: () => void;
  onRetry: () => void;
  onEdit: () => void;
}

export function coinsFrom(events: readonly ProgressEvent[] | null): number {
  let total = 0;
  for (const event of events ?? []) if (event.type === "coins-gained") total += event.amount;
  return total;
}

export function progressLines(events: readonly ProgressEvent[] | null): string[] {
  const lines: string[] = [];
  for (const event of events ?? []) {
    if (event.type === "chapter-unlocked") {
      lines.push(t("resultChapterUnlocked", { name: CHAPTERS[event.chapterIndex]?.title ?? "" }));
    } else if (event.type === "pieces-unlocked") {
      lines.push(t("resultPieces", { count: event.count, size: event.closetSize }));
    } else if (event.type === "chapter-bonus") {
      lines.push(t("resultChapterBonus", { amount: event.amount }));
    } else if (event.type === "affinity-level") {
      const name = CLIENT_BY_ID.get(event.clientId)?.name ?? "";
      lines.push(t("resultAffinity", { name, level: event.level }));
    } else if (event.type === "freeze-used") {
      lines.push(t("resultFreezeUsed", { count: event.count }));
    } else if (event.type === "streak-reset") {
      lines.push(t("resultStreakReset"));
    }
  }
  return lines;
}

function reactionFor(session: Session, stars: ScoreResult["stars"]): string {
  const lines = session.client.lines;
  if (stars === 3) return lines.stars3;
  if (stars === 2) return lines.stars2;
  if (stars === 1) return lines.stars1;
  return lines.stars0;
}

export function Result(props: ResultProps) {
  const { score, session } = props;
  const stars = score.stars;
  const coins = coinsFrom(props.events);
  const lines = progressLines(props.events);
  const motion = useMotion();
  const body = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: the reveal runs each time the sheet opens
  useEffect(() => {
    if (!props.open || !body.current) return;
    const earned = Array.from(body.current.querySelectorAll<SVGElement>(".wg-star--on"));
    void motion.starReveal(earned);
  }, [props.open]);

  return (
    <AppSheet
      open={props.open}
      onClose={props.onEdit}
      title={resultHeadline(stars)}
      class="dr-result"
      silentOpen
    >
      <div
        ref={body}
        class="dr-result__body"
        data-testid="result"
        style={{ "--dr-accent": session.accent }}
      >
        <div class="dr-result__stars">
          <StarRating value={stars} label={t("resultStarsLabel", { stars })} />
          <span class="dr-result__star-name" data-testid="result-star-name">
            {stars === 0 ? t("resultNotFinished") : STAR_NAMES[stars - 1]}
          </span>
        </div>
        <div class="dr-result__client">
          <Sprite
            slot={clientSlot(Math.max(0, CLIENT_IDS.indexOf(session.client.id)))}
            size={60}
            label={session.client.name}
            decorative
          />
          <p class="dr-quote" data-testid="result-reaction">
            <span class="dr-quote__who">{session.client.name}</span>
            {reactionFor(session, stars)}
          </p>
        </div>
        <h3 class="dr-sheet__heading">
          {t("resultRules", { met: score.metCount, total: score.rules.length })}
        </h3>
        <RuleChips rules={score.rules} />
        <h3 class="dr-sheet__heading">{t("resultHarmony", { value: score.harmony.total })}</h3>
        <HarmonyMeter harmony={score.harmony} empty={false} expandable={false} />
        {coins > 0 ? (
          <p class="dr-result__coins" data-testid="result-coins">
            {t("resultCoins", { amount: coins })}
          </p>
        ) : null}
        {props.streak !== null ? (
          <p data-testid="result-streak">{t("resultStreak", { streak: props.streak })}</p>
        ) : null}
        {lines.map((line) => (
          <p key={line} class="dr-result__line">
            {line}
          </p>
        ))}
        {props.note ? (
          <p role="status" class="dr-note" data-testid="result-note">
            {props.note}
          </p>
        ) : null}
      </div>
      <div class="dr-sheet__actions dr-sheet__actions--wrap">
        {props.hasNext ? <Button onClick={props.onNext}>{t("resultNext")}</Button> : null}
        <Button variant="secondary" onClick={props.onRetry}>
          {t("resultRetry")}
        </Button>
        <Button variant="secondary" onClick={props.onEdit}>
          {t("resultEdit")}
        </Button>
        {stars >= 1 ? (
          <>
            <Button variant="secondary" disabled={props.saved} onClick={props.onSave}>
              {props.saved ? t("resultSaved") : t("resultSave")}
            </Button>
            <Button variant="secondary" onClick={props.onExport}>
              {t("resultExport")}
            </Button>
          </>
        ) : null}
      </div>
    </AppSheet>
  );
}
