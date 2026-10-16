import type { MissionResult } from "@city-drive/core";
import { CoinIcon } from "../components/Icons";
import { Stars } from "../components/Stars";
import type { AppController, AppView } from "../controller";
import type { MissionSummary } from "../model/districts";
import { formatBestTime, formatCoins, outcomeTitle } from "../model/format";

function detailLine(result: MissionResult): string {
  const parts = [`Damage ${Math.round(result.damage)}`];
  if (result.comfort !== null) parts.push(`Comfort ${Math.round(result.comfort)}%`);
  return parts.join("  ");
}

export function Results({
  view,
  result,
  summary,
  controller,
}: {
  view: AppView;
  result: MissionResult;
  summary: MissionSummary | undefined;
  controller: AppController;
}) {
  const payout = view.play?.payout;
  const paid = payout && payout.missionId === result.id ? payout : undefined;
  const best = view.save.missions[result.id]?.best_time_s ?? null;
  const hasNext = controller.nextMission() !== undefined;
  return (
    <section class="cd-screen cd-results" aria-label="Mission result" role="dialog">
      <div class="cd-panel cd-results-card" data-success={result.success}>
        {summary ? <p class="cd-dim">{summary.title}</p> : null}
        <h2 data-testid="outcome">{outcomeTitle(result)}</h2>
        <Stars earned={result.success ? result.stars : 0} animate />
        <dl class="cd-result-stats">
          <div>
            <dt>Time</dt>
            <dd data-testid="result-time">{formatBestTime(result.time)}</dd>
          </div>
          <div>
            <dt>Best</dt>
            <dd data-testid="result-best">{formatBestTime(best)}</dd>
          </div>
          <div>
            <dt>Run</dt>
            <dd>{detailLine(result)}</dd>
          </div>
        </dl>
        <p class="cd-payout" data-testid="payout" aria-live="polite">
          <CoinIcon />
          <span>+{formatCoins(paid?.coins ?? 0)} coins</span>
          {paid?.firstClear ? <small>First clear</small> : null}
          {paid && !paid.firstClear && paid.improved ? <small>New best stars</small> : null}
        </p>
        <div class="cd-row">
          <button
            type="button"
            class="cd-button cd-button-primary"
            onClick={() => controller.retry()}
          >
            Retry
          </button>
          {hasNext && result.success ? (
            <button type="button" class="cd-button" onClick={() => controller.next()}>
              Next mission
            </button>
          ) : null}
          <button type="button" class="cd-button" onClick={() => controller.freeRoam()}>
            Free roam
          </button>
        </div>
      </div>
    </section>
  );
}
