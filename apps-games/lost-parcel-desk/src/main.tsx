import { createDefaultAdapter, createLifecycle, injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { bindGameLifecycle, createServices, loadServices } from "./state/services";
import { createIntervalTick } from "./state/ticker";
import { GameContext } from "./state/useGame";

injectKitStyles();
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true });

const services = createServices(createDefaultAdapter(), { tick: createIntervalTick() });
bindGameLifecycle(services.game, lifecycle);
void loadServices(services);

const root = document.getElementById("app");
if (root) {
  render(
    <GameContext.Provider value={services.game}>
      <App />
    </GameContext.Provider>,
    root,
  );
}
