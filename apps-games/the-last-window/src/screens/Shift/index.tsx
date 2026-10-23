import { Screen } from "@web-games/kit";
import { type Component, WEATHER_NAMES } from "@web-games/the-last-window-core";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { Backdrop } from "../../art/Backdrop";
import { interiorSlot } from "../../art/slots";
import type { ShiftTarget } from "../../nav";
import { Pause } from "../../sheets/Pause";
import { Quit } from "../../sheets/Quit";
import { ServeEmpty } from "../../sheets/ServeEmpty";
import { Runner } from "../../shift/Runner";
import { useShift, useShiftEvents } from "../../shift/useShift";
import { useApp, useBack, useProfile } from "../../state/app";
import { useGameStore } from "../../state/useGame";
import { t } from "../../strings";
import { buildSummary } from "../resultSummary";
import { customerById, describeEvents } from "./announce";
import { BookShelf } from "./BookShelf";
import { shiftDefFor } from "./build";
import { DrinkStation } from "./DrinkStation";
import { Hud } from "./Hud";
import { useShiftKeys } from "./keys";
import { PastryStation } from "./PastryStation";
import { type Reaction, Seats } from "./Seats";
import { activeSeat, Ticket } from "./Ticket";
import { trayIsEmpty } from "./Tray";

type Sheet = "pause" | "quit" | "empty" | null;

const REACTION_TICKS = 12;

export function Shift({ target }: { target: ShiftTarget }) {
  const app = useApp();
  const { router } = app;
  const store = useGameStore();
  const profile = useProfile();
  const [runner] = useState(
    () =>
      new Runner({
        def: shiftDefFor(target, profile, store.lateToday()),
        stock: profile.stock,
        scheduler: app.scheduler,
        visibility: app.visibility ?? (typeof document === "undefined" ? null : document),
      }),
  );
  const state = useShift(runner);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [live, setLive] = useState<string[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const finished = useRef(false);

  useEffect(() => {
    runner.start();
    return () => runner.dispose();
  }, [runner]);

  useEffect(() => {
    if (sheet === null) runner.resume("sheet");
    else runner.pause("sheet");
  }, [runner, sheet]);

  useEffect(() => {
    const source = app.visibility ?? (typeof document === "undefined" ? null : document);
    if (!source) return undefined;
    const onChange = (): void => {
      if (source.hidden) setSheet((current) => current ?? "pause");
    };
    source.addEventListener("visibilitychange", onChange);
    return () => source.removeEventListener("visibilitychange", onChange);
  }, [app.visibility]);

  const onEvents = useCallback(
    (events: Parameters<typeof describeEvents>[0], next: typeof state) => {
      const messages = describeEvents(events, next);
      if (messages.length > 0) setLive(messages);
      const fresh: Reaction[] = [];
      for (const event of events) {
        if (event.type !== "served" && event.type !== "customer-left") continue;
        const customer = customerById(next, event.customerId);
        if (!customer) continue;
        fresh.push({
          seat: event.seat,
          customer,
          face: event.face,
          outcome: event.type === "served" ? event.outcome : "left",
          until: next.tick + REACTION_TICKS,
        });
      }
      if (fresh.length > 0) {
        setReactions((old) => [...old.filter((item) => item.until > next.tick), ...fresh]);
      }
    },
    [],
  );
  useShiftEvents(runner, onEvents);

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    const result = runner.result();
    const extras = { itemsMade: runner.itemsMade };
    if (target.kind === "day") {
      const applied = await store.finishShift(target.day, result, extras);
      const summary = buildSummary({
        kind: "day",
        day: target.day,
        result,
        events: applied.events,
        queue: applied.queue,
        remainder: applied.remainder,
        replay: applied.replay,
        profile: store.getState().profile,
      });
      router.replace("result", { target, summary, finale: false });
      return;
    }
    const outcome = await store.finishLateShift(result, extras);
    const summary = buildSummary({
      kind: "late",
      day: result.day,
      dateKey: outcome.dateKey,
      result,
      events: outcome.events,
      queue: outcome.queue,
      remainder: outcome.remainder,
      lamp: outcome.lampBonus,
      streakBonus: outcome.streakBonus,
      profile: store.getState().profile,
    });
    router.replace("result", { target, summary, finale: false });
  }, [runner, store, router, target]);

  useEffect(() => {
    if (state.phase === "closed") void finish();
  }, [state.phase, finish]);

  const serve = useCallback(() => {
    const seat = activeSeat(runner.state);
    if (seat === null) return;
    if (trayIsEmpty(seat)) setSheet("empty");
    else runner.dispatch({ type: "serve" });
  }, [runner]);

  const closeTop = useCallback((): boolean => {
    if (sheet === "quit") setSheet("pause");
    else if (sheet !== null) setSheet(null);
    else setSheet("pause");
    return true;
  }, [sheet]);

  useBack(router, true, closeTop);
  useShiftKeys({
    seat: (index) => {
      if (sheet !== null) return false;
      runner.dispatch({ type: "selectSeat", seat: index });
      return true;
    },
    serve: () => {
      if (sheet !== null) return false;
      serve();
      return true;
    },
    escape: () => closeTop(),
  });

  const discardTray = (slot: Component): void => {
    runner.dispatch({ type: "discard", item: { kind: "tray", slot } });
  };
  const guide = profile.settings.recipeGuide;
  const title =
    target.kind === "day"
      ? t("dayOf", { day: target.day, total: 14 })
      : `${t("homeLate")} - ${WEATHER_NAMES[state.def.weather]}`;

  return (
    <Screen name="shift" class="tlw-shift">
      <Backdrop
        slot={interiorSlot(state.def.weather)}
        owned={profile.owned}
        class="tlw-backdrop--dim"
      />
      <Hud state={state} title={title} onPause={() => setSheet("pause")} />
      <div
        class="tlw-sr"
        role="status"
        aria-live="polite"
        aria-label={t("shiftLive")}
        data-testid="shift-live"
      >
        {live.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <Seats
        state={state}
        reactions={reactions}
        onSelect={(seat) => {
          if (runner.state.active === seat) serve();
          else runner.dispatch({ type: "selectSeat", seat });
        }}
      />
      <Ticket state={state} onDiscard={discardTray} onServe={serve} />
      <div class="tlw-stations">
        <DrinkStation
          state={state}
          guide={guide}
          onStep={(token) => runner.dispatch({ type: "drinkStep", token })}
        />
        <PastryStation
          state={state}
          guide={guide}
          onPick={(pastryId) => runner.dispatch({ type: "pastryPick", pastryId })}
          onStep={(plate, token) => runner.dispatch({ type: "pastryStep", plate, token })}
          onSelectSeat={(seat) => runner.dispatch({ type: "selectSeat", seat })}
          onDiscard={(plate) =>
            runner.dispatch({ type: "discard", item: { kind: "plate", plate } })
          }
        />
        <BookShelf
          state={state}
          guide={guide}
          onPick={(bookId) => runner.dispatch({ type: "pickBook", bookId })}
        />
      </div>
      <Pause
        open={sheet === "pause"}
        unlocked={state.def.unlocked}
        onResume={() => setSheet(null)}
        onQuit={() => setSheet("quit")}
      />
      <Quit
        open={sheet === "quit"}
        onStay={() => setSheet("pause")}
        onQuit={() => {
          setSheet(null);
          router.pop();
        }}
      />
      <ServeEmpty
        open={sheet === "empty"}
        onCancel={() => setSheet(null)}
        onServe={() => {
          setSheet(null);
          runner.dispatch({ type: "serve" });
        }}
      />
    </Screen>
  );
}
