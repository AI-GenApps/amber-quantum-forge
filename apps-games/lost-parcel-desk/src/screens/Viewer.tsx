import { Button, IconButton, Screen } from "@web-games/kit";
import type { CaseDef, CaseState, Clue, EvidenceObject } from "@web-games/lost-parcel-desk-core";
import { useEffect, useRef, useState } from "preact/hooks";
import { chipState, hotspotOf, objectClues } from "../lib/board";
import { openAlmanac } from "../lib/openAlmanac";
import { FLIP_MS } from "../motion/timing";
import { useMotion } from "../motion/useMotion";
import type { ViewerTarget } from "../nav";
import { useCoachStep } from "../onboarding/TutorialProvider";
import { useApp, useFeedback, useReducedMotion } from "../state/app";
import { useCase } from "../state/useCase";
import { t } from "../strings";
import { EvidenceArt } from "../ui/EvidenceArt";
import { Header } from "../ui/Header";
import { Icon } from "../ui/Icon";
import { PaperCard } from "../ui/PaperCard";
import { useHotkeys } from "../ui/useHotkeys";

const SWIPE_MIN = 56;

interface BodyProps {
  target: ViewerTarget;
  def: CaseDef;
  state: CaseState;
  object: EvidenceObject;
}

function ViewerBody({ target, def, state, object }: BodyProps) {
  const { router, game } = useApp();
  const reduced = useReducedMotion();
  const motion = useMotion();
  const feedback = useFeedback();
  const coach = useCoachStep();
  const faceBox = useRef<HTMLDivElement>(null);
  const artBox = useRef<HTMLDivElement>(null);
  const [face, setFace] = useState<"front" | "back">("front");
  const [magnifier, setMagnifier] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const index = def.objects.findIndex((item) => item.id === object.id);
  const clues = objectClues(def, object.id);
  const found = clues.filter((clue) => state.foundClueIds.includes(clue.id));
  const zooms = clues.filter((clue) => clue.face === "zoom");
  const backFound = found.filter((clue) => clue.face === "back");

  useEffect(() => {
    void game.inspect(object.id);
  }, [game, object.id]);

  useEffect(() => {
    if (artBox.current) void motion.pickUp(artBox.current);
  }, [motion]);

  useEffect(() => {
    if (!flipping) return undefined;
    const timer = setTimeout(() => setFlipping(false), FLIP_MS);
    return () => clearTimeout(timer);
  }, [flipping]);

  const flip = (): void => {
    const next = face === "front" ? "back" : "front";
    setFace(next);
    if (next === "back") {
      setMagnifier(false);
      void game.flip(object.id);
    }
    feedback.fire({ type: "flip" });
    if (!reduced) setFlipping(true);
    if (faceBox.current) void motion.flip(faceBox.current);
  };
  const toggleMagnifier = (): void => {
    if (face === "back") return;
    feedback.fire({ type: "zoom" });
    setMagnifier((on) => !on);
  };
  const go = (step: number): void => {
    const count = def.objects.length;
    const next = def.objects[(index + step + count) % count];
    if (next) feedback.fire({ type: "object-open" });
    if (next) router.replace("viewer", { ...target, objectId: next.id });
  };
  const togglePin = (clue: Clue): void => {
    void (state.pinnedClueIds.includes(clue.id) ? game.unpin(clue.id) : game.pin(clue.id));
  };
  const pinNext = (): void => {
    const clue =
      found.find((item) => !state.pinnedClueIds.includes(item.id)) ?? found[found.length - 1];
    if (clue) togglePin(clue);
  };
  useHotkeys({
    f: flip,
    m: toggleMagnifier,
    p: pinNext,
    ArrowLeft: () => go(-1),
    ArrowRight: () => go(1),
  });

  const faceText =
    face === "front"
      ? t("faceFront", { name: object.name, caption: object.caption })
      : t("faceBack", {
          name: object.name,
          text:
            backFound.length > 0 ? backFound.map((clue) => clue.text).join(" ") : t("backBlank"),
        });

  return (
    <Screen name="viewer" class="lp-viewer">
      <Header title={object.name}>
        <span class="lp-position" data-testid="position">
          {t("viewerPosition", { n: index + 1, total: def.objects.length })}
        </span>
      </Header>
      <div
        class={`lp-mat${magnifier ? " lp-mat--lens" : ""}`}
        data-face={face}
        data-magnifier={magnifier ? "on" : "off"}
        onPointerDown={(event) => {
          swipe.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipe.current;
          swipe.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          const dy = event.clientY - start.y;
          if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dy) < Math.abs(dx) / 2) flip();
        }}
      >
        <div
          class={`lp-face lp-face--${face}${flipping ? " lp-face--flipping" : ""}`}
          ref={faceBox}
        >
          {face === "front" ? (
            <div class="lp-artbox" ref={artBox}>
              <EvidenceArt object={object} size={220} />
              {magnifier
                ? zooms.map((clue, at) => {
                    const spot = hotspotOf(clue);
                    if (!spot) return null;
                    const done = state.foundClueIds.includes(clue.id);
                    return (
                      <button
                        type="button"
                        key={clue.id}
                        class={`lp-hotspot${done ? " lp-hotspot--found" : ""}`}
                        style={{
                          left: `${spot.x / 10}%`,
                          top: `${spot.y / 10}%`,
                          width: "48px",
                          height: "48px",
                          minWidth: "48px",
                          minHeight: "48px",
                        }}
                        data-hotspot={clue.id}
                        aria-label={
                          done ? t("hotspotFound", { n: at + 1 }) : t("hotspotLabel", { n: at + 1 })
                        }
                        onClick={() => void game.zoom(clue.id)}
                      >
                        {done ? <Icon name="tick" size={18} /> : at + 1}
                      </button>
                    );
                  })
                : null}
            </div>
          ) : (
            <PaperCard id={`back-${object.id}`} class="lp-backnote">
              <p>
                {backFound.length > 0
                  ? backFound.map((clue) => clue.text).join(" ")
                  : t("backBlank")}
              </p>
            </PaperCard>
          )}
        </div>
      </div>
      <p class="lp-facetext" data-testid="face-text" aria-live="polite">
        {faceText}
        {magnifier ? ` ${t("magnifierOn", { count: zooms.length })}` : ""}
      </p>
      <div class="lp-actions">
        <Button variant="secondary" class="lp-own-sfx" onClick={flip}>
          <Icon name="flip" size={18} /> {face === "front" ? t("viewerFlip") : t("viewerFlipBack")}
        </Button>
        <Button
          variant={magnifier ? "primary" : "secondary"}
          disabled={face === "back"}
          onClick={toggleMagnifier}
          class={`lp-magnifier${coach === 3 ? " lp-coach-target" : ""}`}
        >
          <Icon name="magnifier" size={18} />{" "}
          {magnifier ? t("viewerMagnifierOff") : t("viewerMagnifierOn")}
        </Button>
      </div>
      <section class="lp-cluelist" aria-label={t("viewerClues")}>
        <h2 class="lp-section">{t("viewerClues")}</h2>
        {found.length === 0 ? <p class="lp-empty">{t("viewerNoClues")}</p> : null}
        <ul>
          {found.map((clue) => {
            const pinned = state.pinnedClueIds.includes(clue.id);
            return (
              <li
                key={clue.id}
                class="lp-clue"
                data-clue-row={clue.id}
                data-state={chipState(state, clue.id)}
              >
                <div class="lp-clue__head">
                  <strong class="lp-clue__tag">{clue.tag}</strong>
                  <IconButton
                    label={t("almanacFor", { tag: clue.tag })}
                    onClick={() => openAlmanac(router, clue)}
                  >
                    <Icon name="book" size={18} />
                  </IconButton>
                </div>
                <p class="lp-clue__text">{clue.text}</p>
                <Button
                  size="small"
                  variant={pinned ? "primary" : "secondary"}
                  class={`lp-pinbutton${coach === 4 ? " lp-coach-target" : ""}`}
                  onClick={() => togglePin(clue)}
                >
                  <Icon name="pin" size={16} /> {pinned ? t("viewerUnpin") : t("viewerPin")}
                  <span class="lp-sr-only"> {clue.tag}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </section>
      <div class="lp-actions">
        <Button variant="secondary" class="lp-own-sfx" onClick={() => go(-1)}>
          <Icon name="back" size={18} /> {t("viewerPrev")}
        </Button>
        <Button variant="secondary" class="lp-own-sfx" onClick={() => go(1)}>
          {t("viewerNext")} <Icon name="next" size={18} />
        </Button>
      </div>
    </Screen>
  );
}

export function Viewer({ target }: { target: ViewerTarget }) {
  const { active, failed } = useCase(target);
  if (active === null) {
    return (
      <Screen name="viewer" class="lp-viewer">
        <Header title={t("viewerTitle")} />
        <p role={failed ? "alert" : "status"}>{failed ? t("introLocked") : t("tableOpening")}</p>
      </Screen>
    );
  }
  const object =
    active.def.objects.find((item) => item.id === target.objectId) ?? active.def.objects[0];
  if (!object) return null;
  return (
    <ViewerBody
      key={object.id}
      target={target}
      def={active.def}
      state={active.state}
      object={object}
    />
  );
}
