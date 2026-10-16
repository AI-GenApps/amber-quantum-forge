import type { AppController, AppView } from "../controller";

export function Pause({ view, controller }: { view: AppView; controller: AppController }) {
  const mission = view.play?.mission;
  const running = view.play?.hud.phase === "active";
  return (
    <section class="cd-screen cd-pause" aria-label="Paused" role="dialog" aria-modal="true">
      <div class="cd-panel cd-pause-panel">
        <h2>Paused</h2>
        {running && mission ? <p class="cd-dim">{mission.title}</p> : null}
        <button
          type="button"
          class="cd-button cd-button-primary"
          onClick={() => controller.resume()}
        >
          Resume
        </button>
        {running ? (
          <>
            <button type="button" class="cd-button" onClick={() => controller.restartMission()}>
              Restart mission
            </button>
            <button type="button" class="cd-button" onClick={() => controller.abandonMission()}>
              Abandon mission
            </button>
          </>
        ) : null}
        <button type="button" class="cd-button" onClick={() => controller.openSettings()}>
          Settings
        </button>
        <button type="button" class="cd-button" onClick={() => controller.quitToHome()}>
          Quit to home
        </button>
      </div>
    </section>
  );
}
