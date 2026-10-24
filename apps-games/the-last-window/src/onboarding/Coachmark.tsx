import { Button, Sheet } from "@web-games/kit";
import { t } from "../strings";
import type { TutorialView } from "./useTutorial";

const ACK_STEPS = new Set(["note", "patience"]);

/** The Day 1 coach card. The first card is a modal; the rest sit above the stations. */
export function Coachmark({ view }: { view: TutorialView }) {
  const step = view.step;
  if (!step) return null;
  const needsAck = ACK_STEPS.has(step.id);
  const progress = t("coachStep", { step: view.index + 1, total: view.total });
  const body = (
    <>
      <p class="tlw-muted">{progress}</p>
      <p>{step.text}</p>
      <div class="tlw-actions">
        <Button variant="ghost" onClick={view.skip}>
          {t("coachSkip")}
        </Button>
        {needsAck ? <Button onClick={view.ack}>{step.action}</Button> : null}
      </div>
    </>
  );
  if (step.id === "note") {
    return (
      <Sheet open onClose={view.ack} title={step.title} variant="modal" class="tlw-coach-modal">
        {body}
      </Sheet>
    );
  }
  return (
    <section class="wg-card tlw-card tlw-coach" aria-label={t("coachRegion")} data-step={step.id}>
      <h2 class="tlw-coach__title">{step.title}</h2>
      {body}
      {needsAck ? null : <p class="tlw-coach__action">{step.action}</p>}
    </section>
  );
}
