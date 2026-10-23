import { createDefaultAdapter, createLifecycle, injectKitStyles } from "@web-games/kit";
import { render } from "preact";
import { App } from "./App";
import { bootGame } from "./state/boot";

injectKitStyles();
const lifecycle = createLifecycle();
void lifecycle.setupDisplay({ lockPortrait: true });

const { game } = bootGame(lifecycle, createDefaultAdapter());
void game.load();

const root = document.getElementById("app");
if (root) render(<App />, root);
