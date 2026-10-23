import { DAYS } from "./days";
import type { DayCard } from "./types";

const TEXTS: readonly string[] = [
  "A bright morning in Port Merrow. Marit's lamp is lit. Odile, Tobias and Priya will stop by. Keep the lamp lit, and the tea hot.",
  "An evening shift with salt on the glass. Juno, Henrik and Leona are due. Henrik will complain about the stools.",
  "The first rain of your time here. Odile, Priya, Abel and Sunniva are coming in. Wet coats and warm cups.",
  "A bright morning smelling of oil and cinnamon. Tobias, Juno and Abel will be in. Watch the clock.",
  "Evening, with lamps lit before dusk. Priya, Henrik and Leona are due. The pear tart is ready.",
  "Rain on a grey quay. Odile, Tobias and Sunniva are coming. Customers will wait a little longer today.",
  "Market morning on the quay. Juno, Henrik and Abel are due. Expect a busy counter and a good smell.",
  "An evening of ink and chamomile. Priya, Leona and Sunniva will drop in. Lemon cream buns are on the shelf.",
  "The long rain. Odile, Tobias and Juno will come in out of the wet. The shop is full today.",
  "A bright morning, and a longer shift. Priya, Henrik and Abel are due. Midnight mocha is on the menu.",
  "Evening in council week. Odile, Leona and Sunniva will visit. Ginger loaf is ready for the first time.",
  "Storm warning flags, and rain on the quay. Tobias, Juno and Abel are due. Hold the lamp steady.",
  "A bright morning, the day before the festival. Henrik, Leona and Sunniva will be in. Lanterns hang in every doorway.",
  "Lantern Night. An evening shift with every regular due. Serve them well, then walk down to the quay together.",
];

export const DAY_CARDS: readonly DayCard[] = DAYS.map((day, index) => ({
  day: day.day,
  title: day.title,
  text: TEXTS[index] as string,
}));
