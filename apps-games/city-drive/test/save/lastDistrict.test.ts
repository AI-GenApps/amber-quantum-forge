import { MemorySaveStore, type SaveStore } from "@city-drive/core";
import { describe, expect, it } from "vitest";
import { LastDistrict } from "../../src/save";

const open = (id: string) => id !== "district-3";

describe("LastDistrict", () => {
  it("falls back to the first district for a new player", async () => {
    const last = new LastDistrict(new MemorySaveStore(), "district-1");
    expect(await last.get(open)).toBe("district-1");
  });

  it("remembers the district across instances", async () => {
    const store = new MemorySaveStore();
    await new LastDistrict(store, "district-1").set("district-2");
    expect(await new LastDistrict(store, "district-1").get(open)).toBe("district-2");
  });

  it("ignores a remembered district that is not open any more", async () => {
    const store = new MemorySaveStore();
    await new LastDistrict(store, "district-1").set("district-3");
    expect(await new LastDistrict(store, "district-1").get(open)).toBe("district-1");
  });

  it("clear forgets it", async () => {
    const store = new MemorySaveStore();
    const last = new LastDistrict(store, "district-1");
    await last.set("district-2");
    await last.clear();
    expect(await last.get(open)).toBe("district-1");
  });

  it("never throws when the store fails: the hint is optional", async () => {
    const broken: SaveStore = {
      get: () => Promise.reject(new Error("blocked")),
      set: () => Promise.reject(new Error("blocked")),
      remove: () => Promise.reject(new Error("blocked")),
    };
    const last = new LastDistrict(broken, "district-1");
    expect(await last.get(open)).toBe("district-1");
    await expect(last.set("district-2")).resolves.toBeUndefined();
    await expect(last.clear()).resolves.toBeUndefined();
  });
});
