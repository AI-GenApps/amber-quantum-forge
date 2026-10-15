import { NullEngine } from "@babylonjs/core/Engines/nullEngine.js";
import { parseCityManifest } from "@city-drive/core/city";
import { GameLoop } from "../../src/game/loop";
import { GameSession } from "../../src/game/session";
import { type InputSource, NO_INPUT, type PlayerInput } from "../../src/input";
import { createCityScene } from "../../src/render";
import { createCarVisual } from "../../src/render/carVisual";
import { ChaseCamera } from "../../src/render/chaseCamera";
import { loadDistrict1 } from "../../src/render/district";
import { readManifest } from "../assets/helpers";
import { readBytes } from "../render/helpers";

/** A scripted input source: `current` is what the player is doing right now. */
export class ScriptedInput implements InputSource {
  current: PlayerInput = { ...NO_INPUT };
  private resetOnce = false;

  set(partial: Partial<PlayerInput>): void {
    this.current = { ...NO_INPUT, ...partial };
  }

  /** Request one reset on the next read. */
  pressReset(): void {
    this.resetOnce = true;
  }

  read(): PlayerInput {
    const out = { ...this.current, reset: this.current.reset || this.resetOnce };
    this.resetOnce = false;
    return out;
  }

  dispose(): void {}
}

export async function createSession(input: InputSource = new ScriptedInput()) {
  const manifest = readManifest();
  const map = loadDistrict1(manifest);
  return GameSession.create(map, parseCityManifest(manifest), input);
}

/** District-1 scene plus session, car visual, chase camera and a loop wired like main.ts. */
export async function createGame() {
  const manifest = readManifest();
  const input = new ScriptedInput();
  const engine = new NullEngine();
  const map = loadDistrict1(manifest);
  const city = await createCityScene(engine, map, manifest, readBytes);
  const session = await GameSession.create(map, parseCityManifest(manifest), input);
  const car = await createCarVisual(city.scene, manifest, readBytes, session.car.spec);
  const chase = new ChaseCamera(city.scene, session.plan.boxes);
  city.scene.activeCamera = chase.camera;
  let seen = 0;
  const loop = new GameLoop({
    step: () => session.step(),
    render: (alpha, dt) => {
      const pose = session.pose(alpha);
      car.sync(pose);
      if (session.respawns.length !== seen) {
        seen = session.respawns.length;
        chase.snap();
      }
      chase.update(dt, pose);
      city.scene.render();
    },
  });
  return {
    input,
    engine,
    city,
    session,
    car,
    chase,
    loop,
    dispose: () => {
      city.dispose();
      session.dispose();
      engine.dispose();
    },
  };
}

/** Run the loop on a fake clock: `frames` frames of `frameMs` each, from `startMs`. */
export function runFrames(loop: GameLoop, frames: number, frameMs: number, startMs = 0): number {
  let now = startMs;
  for (let i = 0; i < frames; i++) {
    now += frameMs;
    loop.frame(now);
  }
  return now;
}
