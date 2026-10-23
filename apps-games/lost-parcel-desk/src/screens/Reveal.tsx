import { Button, Screen } from "@web-games/kit";
import {
  bestStamps,
  caseUnlocked,
  getCase,
  headlineFor,
  LEDGER,
  nextCaseId,
  PEOPLE_BY_ID,
  shareText,
} from "@web-games/lost-parcel-desk-core";
import { useEffect, useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { dailyReveal, todayKey } from "../lib/daily";
import { summarizeEvents } from "../lib/events";
import { type CaseTarget, isDailyTarget } from "../nav";
import { AchievementToast } from "../sheets/AchievementToast";
import { ChapterSheet } from "../sheets/ChapterSheet";
import { useApp, useArtManifest, useProfile } from "../state/app";
import { dailyCaseFor } from "../state/dailyCase";
import { useGame } from "../state/useGame";
import { t } from "../strings";
import { Header } from "../ui/Header";
import { PaperCard } from "../ui/PaperCard";
import { RubberStamp } from "../ui/RubberStamp";
import { StampRow } from "../ui/StampRow";
import { Typewriter } from "../ui/Typewriter";

export function Reveal({ target }: { target: CaseTarget }) {
  const { router, game, share, outcome, clock } = useApp();
  const profile = useProfile();
  const { active } = useGame();
  const manifest = useArtManifest();
  const [sharing, setSharing] = useState<string | null>(null);
  const [outro, setOutro] = useState<number | null>(null);
  const daily = isDailyTarget(target);
  const item = daily ? undefined : getCase(target.caseId);
  const heldDaily = daily && active?.kind === "daily" ? active : null;
  const dateKey = heldDaily?.id ?? todayKey(clock());
  const def = item ?? heldDaily?.def ?? dailyCaseFor(dateKey);
  const closed =
    active !== null && active.def.id === def.id && active.state.closed ? active.state : null;
  const stamps =
    closed?.stamps ??
    (daily ? (profile.daily.results[dateKey]?.stamps ?? 0) : bestStamps(profile, def.id));
  const elimination = closed?.byElimination ?? false;
  const last =
    outcome.last !== null && closed !== null && outcome.last.state.caseId === closed.caseId
      ? outcome.last
      : null;
  const events = summarizeEvents(last?.events ?? []);
  const owner = PEOPLE_BY_ID[def.ownerId];
  const returned = (closed?.returnedIds ?? []).map((id) => PEOPLE_BY_ID[id]?.name).filter(Boolean);
  const revealText = item ? item.reveal : dailyReveal(def);
  const fragment = item ? LEDGER.find((entry) => entry.caseId === item.id) : undefined;
  const nextId = item ? nextCaseId(item.id) : null;
  const canNext = nextId !== null && caseUnlocked(profile, nextId);

  useEffect(() => {
    if (item) void game.markLedgerSeen(item.id);
  }, [game, item]);

  const bonusChapter = events.chapterBonus?.chapter ?? null;
  const outroSeen =
    bonusChapter !== null && profile.flags[`chapter-${bonusChapter}-outro`] === true;
  useEffect(() => {
    if (bonusChapter === null || outroSeen) return;
    setOutro(bonusChapter);
    void game.markFlag(`chapter-${bonusChapter}-outro`);
  }, [game, bonusChapter, outroSeen]);

  const doShare = async (): Promise<void> => {
    const text = item
      ? shareText("campaign", {
          caseId: item.id,
          title: item.title,
          stamps,
          hints: closed?.hintsUsed ?? 0,
        })
      : shareText("daily", { dateKey, stamps, streak: profile.daily.streak });
    const result = await share({ title: t("shareTitle"), text });
    setSharing(
      result.ok ? t("shareDone") : result.cancelled ? t("shareCancelled") : t("shareFailed"),
    );
  };

  const replay = async (): Promise<void> => {
    const started = daily
      ? await game.startDaily({ restart: true })
      : await game.startCase(def.id, { restart: true });
    if (started.ok) router.replace("table", target);
  };

  return (
    <Screen name="reveal" class="lp-reveal">
      <Header title={t("revealTitle")} onBack={() => router.pop()} />
      <div class="lp-reveal__stamp">
        <RubberStamp text={t("revealStamp")} tone="teal" fall id={def.id} />
      </div>
      <h2 class="lp-reveal__headline" data-testid="headline">
        {headlineFor(stamps)}
      </h2>
      <p class="lp-reveal__to" data-testid="delivered-to">
        {t("revealDelivered", { name: owner?.name ?? "", trade: owner?.trade ?? "" })}
      </p>
      {owner ? (
        <Sprite
          slot={owner.portraitSlot}
          size={72}
          label={t("portraitOf", { name: owner.name })}
          {...(manifest ? { manifest } : {})}
        />
      ) : null}
      {elimination ? (
        <p class="lp-subnote" data-testid="elimination">
          {t("revealElimination")}
        </p>
      ) : null}
      {returned.length > 0 ? (
        <p class="lp-subnote" data-testid="returned">
          {t("revealReturned", { names: returned.join(", ") })}
        </p>
      ) : null}
      <PaperCard id={`reveal-${def.id}`} class="lp-revealtext">
        <Typewriter text={revealText} />
      </PaperCard>
      <p class="lp-stampline">
        <StampRow earned={stamps} size={28} />
        <span data-testid="stamps-text">{t("revealStamps", { stamps })}</span>
      </p>
      {last ? (
        <ul class="lp-gains" data-testid="gains">
          <li>{t("revealPostage", { postage: events.postage })}</li>
          {events.chapterBonus ? (
            <li>{t("revealChapterBonus", { amount: events.chapterBonus.amount })}</li>
          ) : null}
          {events.chapters.map((n) => (
            <li key={`c${n}`}>{t("revealChapterOpen", { n })}</li>
          ))}
          {events.themes.map((name) => (
            <li key={name}>{t("revealTheme", { name })}</li>
          ))}
          {events.streak !== null ? <li>{t("revealStreak", { streak: events.streak })}</li> : null}
        </ul>
      ) : null}
      {fragment ? (
        <PaperCard
          id={`ledger-${fragment.id}`}
          tone="cream2"
          class="lp-fragment"
          as="section"
          label={t("ledgerFragmentName", { n: fragment.id })}
        >
          <h3 class="lp-fragment__title">
            {t("ledgerFragment", { n: fragment.id, title: fragment.title })}
          </h3>
          <p data-testid="fragment-text">{fragment.text}</p>
        </PaperCard>
      ) : null}
      {item ? (
        <p class="lp-subnote" data-testid="map-note">
          {t("revealMap", { place: item.place })}
        </p>
      ) : null}
      <div class="lp-actions lp-actions--column">
        {canNext && nextId ? (
          <Button size="large" onClick={() => router.replace("intro", { caseId: nextId })}>
            {t("revealNext")}
          </Button>
        ) : (
          <Button
            size="large"
            onClick={() => (router.popTo("home") ? undefined : router.reset("home"))}
          >
            {t("revealHome")}
          </Button>
        )}
        <Button variant="secondary" onClick={() => void replay()}>
          {t("revealReplay")}
        </Button>
        <Button variant="secondary" onClick={() => void doShare()}>
          {t("revealShare")}
        </Button>
        {item ? (
          <Button
            variant="ghost"
            onClick={() => (router.popTo("files") ? undefined : router.replace("files"))}
          >
            {t("revealFiles")}
          </Button>
        ) : null}
      </div>
      {sharing !== null ? (
        <p role="status" class="lp-subnote" data-testid="share-status">
          {sharing}
        </p>
      ) : null}
      {outro !== null ? (
        <ChapterSheet open chapter={outro} part="outro" onClose={() => setOutro(null)} />
      ) : null}
      {last ? <AchievementToast ids={last.achievements} /> : null}
    </Screen>
  );
}
