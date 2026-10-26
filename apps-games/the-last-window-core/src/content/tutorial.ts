import type { Arrival, Customer } from "../types";
import { REGULARS } from "./regulars";
import type { ScriptedOrder, TutorialStep } from "./types";

export const TUTORIAL_PATIENCE_FREE = 2;

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  {
    id: "note",
    title: "Keep the lamp lit",
    text: "Marit left you a note on the counter: Keep the lamp lit, and the kettle on. The rest will follow.",
    action: "Open the shop",
  },
  {
    id: "seat",
    title: "Meet Tobias",
    text: "Tobias just sat down. Tap his seat to make his ticket the active one.",
    action: "Tap Tobias's seat",
  },
  {
    id: "drink",
    title: "Make a Harbour Black",
    text: "Tap the glowing steps in order: cup, brew, pour. Brewing takes a moment, so wait for the ring.",
    action: "Cup, brew, pour",
  },
  {
    id: "serve",
    title: "Serve and see the tip",
    text: "Tap Tobias, or the Serve button, to hand over the cup. A quick, correct order earns a tip.",
    action: "Serve Tobias",
  },
  {
    id: "pastry",
    title: "Pastries and the oven",
    text: "Priya wants a Salted Butter Roll. Plate it, then warm it. While it bakes, make the next customer's Fog Tea.",
    action: "Plate, warm, then serve",
  },
  {
    id: "book",
    title: "A book for Odile",
    text: "Odile asks for a comforting book. Open the shelf, read the mood tags, and pick The Lamplighter's Almanac.",
    action: "Pick the Almanac",
  },
  {
    id: "patience",
    title: "Watch the patience bar",
    text: "The bar over each customer shows how long they will wait. Serve before it runs out, and you will earn a closing grade.",
    action: "Finish the shift",
  },
];

export const TUTORIAL_ORDERS: readonly ScriptedOrder[] = [
  {
    id: "tutorial-1",
    tick: 10,
    customer: { kind: "regular", regularId: 2, look: 0 },
    order: { drink: "drink-1", pastry: null, mood: null },
  },
  {
    id: "tutorial-2",
    tick: 200,
    customer: { kind: "regular", regularId: 3, look: 0 },
    order: { drink: "drink-3", pastry: "pastry-1", mood: null },
  },
  {
    id: "tutorial-3",
    tick: 260,
    customer: { kind: "walkin", regularId: null, look: 0 },
    order: { drink: "drink-3", pastry: null, mood: null },
  },
  {
    id: "tutorial-4",
    tick: 560,
    customer: { kind: "regular", regularId: 1, look: 0 },
    order: { drink: "drink-1", pastry: null, mood: "comforting" },
  },
  {
    id: "tutorial-5",
    tick: 900,
    customer: { kind: "walkin", regularId: null, look: 2 },
    order: { drink: "drink-1", pastry: "pastry-1", mood: null },
  },
  {
    id: "tutorial-6",
    tick: 1250,
    customer: { kind: "walkin", regularId: null, look: 4 },
    order: { drink: "drink-3", pastry: null, mood: "curious" },
  },
];

function customerFor(scripted: ScriptedOrder, walkinNumber: number): Customer {
  const { kind, regularId, look } = scripted.customer;
  if (kind === "walkin" || regularId === null) {
    return { id: `walkin-${walkinNumber}`, kind: "walkin", regularId: null, look, likes: null };
  }
  const regular = REGULARS.find((entry) => entry.id === regularId);
  if (regular === undefined) throw new RangeError(`unknown regular ${regularId}`);
  return { id: `regular-${regularId}`, kind: "regular", regularId, look, likes: regular.likes };
}

export function tutorialArrivals(): Arrival[] {
  let walkins = 0;
  return TUTORIAL_ORDERS.map((scripted) => {
    if (scripted.customer.kind === "walkin") walkins += 1;
    return {
      tick: scripted.tick,
      customer: customerFor(scripted, walkins),
      order: { ...scripted.order },
    };
  });
}
