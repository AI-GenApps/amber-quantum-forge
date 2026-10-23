import { createDefaultAdapter, createLifecycle, injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { createServices, loadServices } from "./state/services";

injectKitStyles();
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true });

const services = createServices(createDefaultAdapter(), { lifecycle });
void loadServices(services);

const root = document.getElementById("app");
if (root) render(<App />, root);
