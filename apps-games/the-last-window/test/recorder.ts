import type { Scene } from "../src/audio/engine";
import type { FeedbackEvent } from "../src/audio/events";
import type { Feedback } from "../src/feedback/feedback";

export interface Recorder extends Feedback {
  events: FeedbackEvent[];
  later: Array<{ event: FeedbackEvent; delayMs: number }>;
  scenes: Scene[];
  rain: boolean[];
  types(): string[];
}

/** A feedback sink that remembers what the screens asked for. */
export function createRecorder(): Recorder {
  const events: FeedbackEvent[] = [];
  const later: Array<{ event: FeedbackEvent; delayMs: number }> = [];
  const scenes: Scene[] = [];
  const rain: boolean[] = [];
  return {
    events,
    later,
    scenes,
    rain,
    types: () => events.map((event) => (event.type === "shift" ? event.event.type : event.type)),
    fire: (event) => void events.push(event),
    fireLater: (event, delayMs) => {
      later.push({ event, delayMs });
      return () => undefined;
    },
    setScene: (scene) => void scenes.push(scene),
    setRain: (on) => void rain.push(on),
    audio: null,
    haptics: null,
  };
}
