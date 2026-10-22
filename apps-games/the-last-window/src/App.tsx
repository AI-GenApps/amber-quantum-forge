import { Button, Screen } from "@web-games/kit";
import { version } from "@web-games/the-last-window-core";
import { GAME_TITLE } from "./brand";

export function App() {
  return (
    <Screen name="title">
      <h1>{GAME_TITLE}</h1>
      <Button size="large" disabled>
        Coming soon
      </Button>
      <small data-testid="version">v{version}</small>
    </Screen>
  );
}
