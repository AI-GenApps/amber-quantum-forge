import { Button, Screen, StarRating, Toast, useToast } from "@web-games/kit";
import {
  BOOKS,
  DECOR,
  DRINKS,
  FINALE_DAY,
  getRegular,
  PASTRIES,
  type ProgressEvent,
  type ShiftResult,
} from "@web-games/the-last-window-core";
import { Backdrop } from "../art/Backdrop";
import { coinsText } from "../labels";
import type { ResultParams } from "../nav";
import { useApp } from "../state/app";
import { t } from "../strings";
import { Hearts } from "../ui/Hearts";
import { Finale } from "./Finale";
import type { ResultSummary } from "./resultSummary";

export function unlockLines(events: readonly ProgressEvent[]): string[] {
  const names: string[] = [];
  for (const event of events) {
    if (event.type === "unlock") {
      const found =
        event.kind === "drink"
          ? DRINKS.find((rule) => rule.id === event.id)?.name
          : event.kind === "pastry"
            ? PASTRIES.find((rule) => rule.id === event.id)?.name
            : BOOKS.find((rule) => rule.id === event.id)?.title;
      names.push(found ?? event.id);
    } else if (event.type === "decor-unlocked") {
      names.push(DECOR.find((rule) => rule.id === event.id)?.name ?? event.id);
    }
  }
  return names;
}

export function shareText(summary: ResultSummary): string {
  const result = summary.result;
  const happy = result.counts.delighted + result.counts.satisfied;
  if (summary.kind === "late") {
    return t("shareLate", {
      date: summary.dateKey ?? "",
      stars: result.grade.stars,
      coins: result.coins + summary.lamp + summary.streakBonus,
      run: result.longestDelightedRun,
    });
  }
  return t("shareDay", {
    day: summary.day,
    stars: result.grade.stars,
    happy,
    customers: result.arrived,
    coins: result.coins,
  });
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{value}</td>
    </tr>
  );
}

function Earnings({ result, summary }: { result: ShiftResult; summary: ResultSummary }) {
  const total = result.coins + summary.lamp + summary.streakBonus;
  return (
    <table class="tlw-table" data-testid="earnings">
      <tbody>
        <Row label={t("resultSales")} value={result.payments} />
        <Row label={t("resultTips")} value={result.tips} />
        <Row label={t("resultBonus")} value={result.bonusCoins} />
        {summary.lamp > 0 ? <Row label={t("resultLamp")} value={summary.lamp} /> : null}
        {summary.streakBonus > 0 ? (
          <Row label={t("resultStreak")} value={summary.streakBonus} />
        ) : null}
        <tr class="tlw-table__total">
          <th scope="row">{t("resultTotal")}</th>
          <td>{coinsText(total)}</td>
        </tr>
      </tbody>
    </table>
  );
}

export function Result({ params }: { params: ResultParams }) {
  const { router, share } = useApp();
  const toast = useToast();
  const summary = params.summary;
  if (params.finale || summary === null) return <Finale />;
  const result = summary.result;
  const levelUps = summary.events.filter((event) => event.type === "friendship-level");
  const unlocks = unlockLines(summary.events);
  const present = new Set(result.regularOutcomes.map((entry) => entry.regularId));
  const finaleDue = summary.kind === "day" && summary.day === FINALE_DAY && !summary.replay;

  const next = (): void => {
    if (summary.scenes.length > 0) {
      router.push("scene", {
        ids: summary.scenes,
        index: 0,
        after: finaleDue ? "finale" : "home",
        replay: false,
      });
    } else if (finaleDue) {
      router.replace("result", { target: params.target, summary: null, finale: true });
    } else {
      router.reset("home");
    }
  };
  const doShare = async (): Promise<void> => {
    const outcome = await share({ title: "The Last Window", text: shareText(summary) });
    if (outcome.cancelled) return;
    toast.show(
      outcome.ok
        ? outcome.path === "clipboard"
          ? t("resultCopied")
          : t("resultShared")
        : t("resultShareFailed"),
      outcome.ok ? "success" : "danger",
    );
  };
  return (
    <Screen name="result" class="tlw-page">
      <Backdrop slot="interior-evening" owned={[]} class="tlw-backdrop--dim" />
      <h1 class="tlw-display" data-testid="result-title">
        {summary.kind === "late" ? t("resultLate") : t("resultDay", { day: summary.day })}
      </h1>
      <div class="tlw-stars-row">
        <StarRating
          value={result.grade.stars}
          label={t("resultStars", { stars: result.grade.stars })}
        />
        <span>{t("resultStars", { stars: result.grade.stars })}</span>
      </div>
      <Earnings result={result} summary={summary} />
      <ul class="tlw-list tlw-counts" data-testid="counts">
        <li>
          {t("resultDelighted")}: {result.counts.delighted}
        </li>
        <li>
          {t("resultSatisfied")}: {result.counts.satisfied}
        </li>
        <li>
          {t("resultDisappointed")}: {result.counts.disappointed}
        </li>
        <li>
          {t("resultLeft")}: {result.counts.left}
        </li>
      </ul>
      {present.size > 0 ? (
        <section class="wg-card tlw-card" aria-label="Friendships">
          {summary.hearts
            .filter((row) => present.has(row.regularId))
            .map((row) => (
              <p key={row.regularId} class="tlw-heartline">
                <span>{getRegular(row.regularId).shortName}</span>
                <Hearts level={row.level} name={getRegular(row.regularId).shortName} />
              </p>
            ))}
          {levelUps.map((event) => (
            <p key={`${event.regularId}-${event.level}`} class="tlw-levelup">
              {t("resultLevelUp", {
                name: getRegular(event.regularId).shortName,
                level: event.level,
              })}
            </p>
          ))}
        </section>
      ) : null}
      {unlocks.length > 0 ? <p>{t("resultUnlocks", { names: unlocks.join(", ") })}</p> : null}
      <p data-testid="scene-count">
        {summary.scenes.length > 0
          ? t("resultScenes", { count: summary.scenes.length })
          : t("resultNoScenes")}
      </p>
      {summary.campaignDone ? <p class="tlw-note">{t("resultCampaignDone")}</p> : null}
      <div class="tlw-actions">
        <Button variant="secondary" onClick={() => void doShare()}>
          {t("resultShare")}
        </Button>
        <Button size="large" onClick={next}>
          {summary.scenes.length > 0
            ? t("resultRead")
            : finaleDue
              ? t("finaleTitle")
              : t("resultHome")}
        </Button>
      </div>
      {toast.toast ? (
        <Toast message={toast.toast.message} tone={toast.toast.tone} onDismiss={toast.dismiss} />
      ) : null}
    </Screen>
  );
}
