import { describe, expect, it } from "vitest";
import { BUNDLE, cloneBundle } from "./bundle";
import { idProblems } from "./validators";

type Writable<T> = { -readonly [K in keyof T]: T[K] };

describe("ids and references", () => {
  it("are unique, kebab-case and resolvable", () => {
    expect(idProblems(BUNDLE)).toEqual([]);
  });

  it("has exactly one upgrade per instrument and tier", () => {
    for (const instrument of BUNDLE.catalog.instruments) {
      const tiers = BUNDLE.catalog.upgrades
        .filter((u) => u.instrumentId === instrument.id)
        .map((u) => u.tier);
      expect(tiers).toEqual([1, 2, 3]);
    }
  });

  it("fails on duplicate ids, empty names, bad references and bad tiers", () => {
    const mutations: ((b: ReturnType<typeof cloneBundle>) => void)[] = [
      (b) => {
        (b.catalog.instruments[1] as Writable<{ id: string }>).id = "telescope";
      },
      (b) => {
        (b.catalog.instruments[0] as Writable<{ name: string }>).name = " ";
      },
      (b) => {
        (b.catalog.upgrades[0] as Writable<{ instrumentId: string }>).instrumentId = "ghost";
      },
      (b) => {
        (b.catalog.upgrades[1] as Writable<{ tier: number }>).tier = 1;
      },
      (b) => {
        (
          b.catalog.constellations[0] as Writable<{
            requires: { instrumentId: string; count: number };
          }>
        ).requires = { instrumentId: "ghost", count: 1 };
      },
      (b) => {
        (b.catalog.boons[1] as Writable<{ effect: unknown }>).effect = {
          kind: "instrument-mult",
          instrumentId: "ghost",
          factor: 2,
        };
      },
      (b) => {
        (b.achievements[0] as Writable<{ id: string }>).id = "Not Kebab";
      },
      (b) => {
        (b.catalog.boons[0] as Writable<{ name: string }>).name = b.catalog.boons[1]?.name ?? "";
      },
    ];
    for (const mutate of mutations) {
      const copy = cloneBundle();
      mutate(copy);
      expect(idProblems(copy).length).toBeGreaterThan(0);
    }
  });
});
