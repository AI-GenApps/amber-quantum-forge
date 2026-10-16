/**
 * The public name. This is the one constant the UI reads for the game's name. The internal ids
 * (`city_drive`, `city-drive`, `app.w3dev.citydrive`) deliberately stay as they are. `index.html`
 * carries one static `<title>` for the moment before the script runs, and `capacitor.config.ts`
 * repeats the name for the Capacitor CLI; a test keeps all three in sync.
 */
export const GAME_TITLE = "Street Royale";
