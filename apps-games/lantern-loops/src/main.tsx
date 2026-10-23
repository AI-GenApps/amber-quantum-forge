import { createLifecycle, injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { createServices } from "./services";

injectKitStyles();
void createLifecycle().setupDisplay({ lockPortrait: true });

export const services = createServices();
void services.start();

const root = document.getElementById("app");
if (root) render(<App />, root);
