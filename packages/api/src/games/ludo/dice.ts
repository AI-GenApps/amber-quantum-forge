/// Injectable dice sources for the TS Ludo authority engine (`engine.ts`),
/// mirroring `ludo_rules`' `LudoDiceSource` pattern (see
/// `apps-native/games/packages/ludo_rules/lib/src/ludo_engine.dart`).
///
/// The engine never draws randomness itself — every call site passes one of
/// these in, so:
///
/// - Production/online play uses `CsprngDiceSource`, backed by Node's
///   `crypto.randomInt` (CSPRNG), never `Math.random()`.
/// - Tests and cross-runtime parity checks use `ScriptedDiceSource` (a fixed,
///   pre-recorded sequence) or `FunctionDiceSource` (a caller-supplied
///   generator), so a match can be reproduced deterministically from a
///   recorded event log or fixture.

import { randomInt } from "node:crypto";

/** Draws a single die value, `1..6`. */
export interface LudoDiceSource {
  rollDie(): number;
}

/**
 * The only production-shaped dice source: draws from Node's `crypto.randomInt`
 * CSPRNG. Task 18's service wires this in and records each roll as a
 * `dice_rolled` event immediately, so a client can never influence or predict
 * it.
 */
export class CsprngDiceSource implements LudoDiceSource {
  rollDie(): number {
    // randomInt's upper bound is exclusive, so this draws a uniformly
    // distributed integer in 1..6.
    return randomInt(1, 7);
  }
}

/**
 * Replays a fixed, pre-recorded sequence of rolls. Used by parity tests and
 * the parity script so a match can be reproduced exactly from a recorded
 * event log or fixture file.
 */
export class ScriptedDiceSource implements LudoDiceSource {
  private index = 0;
  private readonly rolls: readonly number[];

  constructor(rolls: Iterable<number>) {
    this.rolls = [...rolls];
  }

  rollDie(): number {
    if (this.index >= this.rolls.length) {
      throw new Error(`ScriptedDiceSource exhausted after ${this.index} rolls`);
    }
    const value = this.rolls[this.index];
    this.index++;
    if (value === undefined || value < 1 || value > 6) {
      throw new Error(`Scripted roll out of range: ${String(value)}`);
    }
    return value;
  }
}

/**
 * A dice source backed by a caller-supplied generator function, for callers
 * that already own a PRNG (mirrors `ludo_rules`' `FunctionDiceSource`).
 */
export class FunctionDiceSource implements LudoDiceSource {
  constructor(private readonly next: () => number) {}

  rollDie(): number {
    const value = this.next();
    if (value < 1 || value > 6) {
      throw new Error(`Dice function returned out-of-range value: ${value}`);
    }
    return value;
  }
}
