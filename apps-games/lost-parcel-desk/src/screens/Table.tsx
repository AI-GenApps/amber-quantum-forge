import { Button, IconButton, Screen } from "@web-games/kit";
import type { Clue } from "@web-games/lost-parcel-desk-core";
import { useState } from "preact/hooks";
import { Sprite } from "../art/Sprite";
import { chipState } from "../lib/board";
import { openAlmanac } from "../lib/openAlmanac";
import { caseTitle } from "../lib/titles";
import { type CaseTarget, isDailyTarget } from "../nav";
import { useCoachStep } from "../onboarding/TutorialProvider";
import { Confirm } from "../sheets/Confirm";
import { Pause } from "../sheets/Pause";
import { useApp, useArtManifest, useFeedback } from "../state/app";
import { useCase } from "../state/useCase";
import { t } from "../strings";
import { ClueChip } from "../ui/ClueChip";
import { EvidenceArt } from "../ui/EvidenceArt";
import { Header } from "../ui/Header";
import { HintControl } from "../ui/HintControl";
import { Icon } from "../ui/Icon";
import { tiltFor } from "../ui/seed";
import { arrowNav } from "../ui/useHotkeys";

export function Table({ target }: { target: CaseTarget }) {
  const { router, game } = useApp();
  const feedback = useFeedback();
  const coach = useCoachStep();
  const manifest = useArtManifest();
  const { active, failed } = useCase(target);
  const [pausing, setPausing] = useState(false);
  const [leaving, setLeaving] = useState(false);

  if (active === null) {
    return (
      <Screen name="table" class="lp-table">
        <Header title={t("tableTitle")} />
        <p role={failed ? "alert" : "status"}>{failed ? t("introLocked") : t("tableOpening")}</p>
      </Screen>
    );
  }

  const { def, state } = active;
  const found = def.clues.filter((clue) => state.foundClueIds.includes(clue.id));
  const open = (objectId: string): void => {
    feedback.fire({ type: "object-open" });
    void game.inspect(objectId);
    router.push("viewer", { ...target, objectId });
  };
  const togglePin = (clue: Clue): void => {
    void (state.pinnedClueIds.includes(clue.id) ? game.unpin(clue.id) : game.pin(clue.id));
  };
  const pause = (on: boolean): void => {
    setPausing(on);
    game.setVisible(!on);
  };

  return (
    <Screen name="table" class="lp-table">
      <Header title={caseTitle(def, isDailyTarget(target))}>
        <IconButton label={t("pause")} onClick={() => pause(true)}>
          <Icon name="pause" />
        </IconButton>
      </Header>
      <section class="lp-desk" data-navgroup="objects" aria-label={t("tableObjects")}>
        <Sprite
          slot="parcel-open"
          size={72}
          class="lp-desk__parcel"
          {...(manifest ? { manifest } : {})}
        />
        {def.objects.map((object) => {
          const seen = state.seenObjectIds.includes(object.id);
          return (
            <button
              type="button"
              key={object.id}
              class={`lp-object${seen ? " lp-object--seen" : ""}${coach === 2 && object.id === "01-2" ? " lp-coach-target" : ""}`}
              style={{ "--lp-tilt": `${tiltFor(object.id, 3)}deg` }}
              data-nav="true"
              data-object={object.id}
              onClick={() => open(object.id)}
              onKeyDown={arrowNav}
            >
              <EvidenceArt object={object} size={84} />
              <span class="lp-object__name">{object.name}</span>
              <span class="lp-object__state">{seen ? t("objectSeen") : t("objectNew")}</span>
            </button>
          );
        })}
      </section>
      <section class="lp-tray" aria-label={t("trayTitle")}>
        <h2 class="lp-tray__title" data-testid="tray-count">
          {t("trayCount", {
            found: found.length,
            total: def.clues.length,
            pinned: state.pinnedClueIds.length,
          })}
        </h2>
        <div class="lp-tray__chips" data-navgroup="tray">
          {found.length === 0 ? <p class="lp-empty">{t("trayEmpty")}</p> : null}
          {found.map((clue) => {
            return (
              <ClueChip
                key={clue.id}
                clueId={clue.id}
                tag={clue.tag}
                state={chipState(state, clue.id)}
                onClick={() => togglePin(clue)}
                onAlmanac={() => openAlmanac(router, clue)}
              />
            );
          })}
        </div>
      </section>
      <div class="lp-actions">
        <Button size="large" onClick={() => router.push("board", target)}>
          {t("tableBoard")}
        </Button>
        <HintControl active={active} />
      </div>
      <Pause
        open={pausing}
        onResume={() => pause(false)}
        onSettings={() => {
          pause(false);
          router.push("settings");
        }}
        onLeave={() => {
          pause(false);
          setLeaving(true);
        }}
      />
      <Confirm
        open={leaving}
        title={t("exitTitle")}
        body={t("exitBody")}
        confirmLabel={t("exitYes")}
        cancelLabel={t("cancel")}
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          void game.flush();
          game.leaveCase();
          if (!router.popTo("home")) router.reset("home");
        }}
      />
    </Screen>
  );
}
