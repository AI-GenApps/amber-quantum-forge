import type { StepId } from "./detectors";

/** What the overlay says. Kept apart from the markup so it is easy to find and to translate. */
export const STEP_COPY: Readonly<Record<StepId, { title: string; hint: string }>> = {
  gas: { title: "Hold gas", hint: "Press and hold the gas pedal (W or the up arrow) to move." },
  steer: { title: "Steer", hint: "Hold left or right (A and D, or the arrows) to turn." },
  brake: {
    title: "Brake or handbrake",
    hint: "Hold brake (S or the down arrow) to slow down, or Drift (Space) to skid.",
  },
};

export const BRIEFING_TIPS: readonly string[] = [
  "The glowing markers are where missions start and where you have to drive.",
  "A ribbon on the road shows the route to your next stop.",
  "Finish faster and with less damage to earn up to three stars.",
];

export const RESULTS_TIPS: readonly string[] = [
  "Every mission pays coins, and better stars pay more.",
  "Spend coins on new cars in the Garage, from the home screen.",
];
