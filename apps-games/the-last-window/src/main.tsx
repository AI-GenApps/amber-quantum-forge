import { createLifecycle, injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";

injectKitStyles();
void createLifecycle().setupDisplay({ lockPortrait: true });

const root = document.getElementById("app");
if (root) render(<App />, root);
