import type { MechanicCard, TutorialStep } from "./types";

export const MECHANIC_CARDS: readonly MechanicCard[] = [
  {
    id: "canal",
    title: "Dig a canal",
    mapId: "v01",
    text: "Water runs downhill. A canal is a groove that carries it faster.",
  },
  {
    id: "barrier",
    title: "Sandbags",
    mapId: "v03",
    text: "Barriers lift the ground by three. Water only climbs over when it rises that high.",
  },
  {
    id: "surge",
    title: "Rain surges",
    mapId: "v04",
    text: "The forecast bar shows weeks when the river swells. Plan for the tallest wave.",
  },
  {
    id: "pump",
    title: "Pumps",
    mapId: "v06",
    text: "A pump pushes water uphill to the cell it faces. Tap it to turn it.",
  },
  {
    id: "gate",
    title: "Sluice gates",
    mapId: "d01",
    text: "A gate is open only between the weeks you set. Closed, it is a wall.",
  },
  {
    id: "reservoir",
    title: "Reservoirs and droughts",
    mapId: "h01",
    text: "A reservoir holds ten units. Droughts cut the river, so store water while it runs.",
  },
  {
    id: "tide",
    title: "Tides",
    mapId: "e01",
    text: "The sea rises and falls on a fixed schedule. Low land by the sea floods at high tide.",
  },
];

export const TUTORIAL_STEPS: readonly TutorialStep[] = [
  { step: 1, text: "This is the river.", highlight: "inlet" },
  { step: 2, text: "Pick the canal.", highlight: "tool-canal" },
  { step: 3, text: "Drag from the river to the cottage.", highlight: "board-path" },
  { step: 4, text: "Run the season.", highlight: "run-button" },
  { step: 5, text: "Stars: supply, dry feet, thrift.", highlight: "result-stars" },
];
