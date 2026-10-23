import { Button, Screen } from "@web-games/kit";
import {
  advanceBeat,
  type Beat,
  choicesMadeFor,
  chooseOption,
  currentView,
  endingLean,
  getRegular,
  type OptionKey,
  SCENE_BY_ID,
  SCENES_PER_REGULAR,
  type SceneApplied,
  SECTION_LABELS,
  startScene,
} from "@web-games/the-last-window-core";
import { useEffect, useRef, useState } from "preact/hooks";
import { Backdrop } from "../art/Backdrop";
import { Portrait } from "../art/Portrait";
import type { SceneParams } from "../nav";
import { useApp, useProfile } from "../state/app";
import { useGameStore } from "../state/useGame";
import { t } from "../strings";

function speakerName(beat: Beat, regularId: number): string | null {
  if (beat.speaker === "narration") return null;
  if (beat.speaker === "you") return SECTION_LABELS.speakerYou;
  return getRegular(regularId).name;
}

export function Scene({ params }: { params: SceneParams }) {
  const { router } = useApp();
  const store = useGameStore();
  const profile = useProfile();
  const id = params.ids[params.index];
  const script = id === undefined ? undefined : SCENE_BY_ID.get(id);
  const [scene, setScene] = useState(() =>
    script ? startScene(script, choicesMadeFor(profile, script.regular)) : null,
  );
  const [applied, setApplied] = useState<SceneApplied | null>(null);
  const saved = useRef(false);
  const focusRef = useRef<HTMLButtonElement>(null);

  const leave = (): void => {
    if (params.index + 1 < params.ids.length) {
      router.replace("scene", { ...params, index: params.index + 1 });
    } else if (params.after === "finale") {
      router.replace("result", { target: { kind: "day", day: 14 }, summary: null, finale: true });
    } else if (params.after === "pop") {
      router.pop();
    } else {
      router.reset("home");
    }
  };

  const view = scene ? currentView(scene) : null;
  const done = view?.kind === "done";

  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  useEffect(() => {
    if (!script) leaveRef.current();
  }, [script]);

  useEffect(() => {
    if (!scene || !script || !done || saved.current) return;
    saved.current = true;
    if (params.replay) return;
    void store.finishScene(script.id, scene.own ?? undefined).then(setApplied);
  }, [scene, script, done, params.replay, store]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refocus on each step
  useEffect(() => {
    focusRef.current?.focus();
  }, [scene?.step, done, scene?.own]);

  if (!script || !scene || !view) return <Screen name="scene" class="tlw-page" />;
  const regular = getRegular(script.regular);
  const lean = endingLean(scene);
  const endingTitle = lean !== null ? script.endings?.[lean].title : undefined;
  const inEnding = view.kind === "beat" && view.section === "ending";
  const advance = (): void => setScene(advanceBeat(scene));
  const pick = (option: OptionKey): void => setScene(chooseOption(scene, option));
  const mood = view.kind === "beat" ? (view.beat.mood ?? "neutral") : "neutral";

  return (
    <Screen name="scene" class="tlw-page tlw-scene">
      <Backdrop slot="interior-evening" owned={profile.owned} class="tlw-backdrop--dim" />
      <p class="tlw-muted tlw-scene__head">
        {t("sceneStory", { story: regular.storyTitle, index: script.index })}
        {params.replay ? ` - ${t("sceneReplay")}` : ""}
      </p>
      <h1 class="tlw-subtitle">{script.title}</h1>
      <Portrait slot={regular.artPrefix} mood={mood} class="tlw-scene__bust" />
      {inEnding && endingTitle ? (
        <h2 class="tlw-ending" data-testid="ending-title">
          {t("sceneEnding", { title: endingTitle })}
        </h2>
      ) : null}
      {view.kind === "beat" ? (
        <button
          ref={focusRef}
          type="button"
          class="tlw-dialogue"
          data-testid="dialogue"
          data-speaker={view.beat.speaker}
          onClick={advance}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              advance();
            }
          }}
        >
          {speakerName(view.beat, script.regular) ? (
            <span class="tlw-dialogue__speaker">{speakerName(view.beat, script.regular)}</span>
          ) : null}
          <span class="tlw-dialogue__text" data-narration={view.beat.speaker === "narration"}>
            {view.beat.text}
          </span>
          <span class="tlw-dialogue__hint">{t("sceneAdvance")}</span>
        </button>
      ) : null}
      {view.kind === "choice" ? (
        <section class="wg-card tlw-card" aria-labelledby="scene-choice" data-testid="choice">
          <h2 id="scene-choice" class="wg-card__title">
            {view.choice.prompt}
          </h2>
          <div class="tlw-actions tlw-actions--stack">
            {(["a", "b"] as const).map((key) => (
              <Button key={key} variant="secondary" fullWidth onClick={() => pick(key)}>
                {view.choice.options[key].label}
              </Button>
            ))}
          </div>
        </section>
      ) : null}
      {done ? (
        <section class="wg-card tlw-card" data-testid="scene-done">
          {script.index === SCENES_PER_REGULAR && endingTitle ? (
            <>
              <h2 class="wg-card__title">{t("sceneEnding", { title: endingTitle })}</h2>
              {params.replay ? null : <p>{t("sceneJournal")}</p>}
            </>
          ) : null}
          {applied && applied.gift > 0 ? <p>{t("sceneGift", { coins: applied.gift })}</p> : null}
          <Button size="large" fullWidth onClick={leave}>
            {params.index + 1 < params.ids.length ? t("sceneNext") : t("continue")}
          </Button>
        </section>
      ) : null}
    </Screen>
  );
}
