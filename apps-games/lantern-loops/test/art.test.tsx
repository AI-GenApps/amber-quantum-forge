import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { ArtImage } from "../src/art/ArtImage";
import { ART_SLOTS, bundledArtUrls, resolveSlot, SLOT_IDS } from "../src/art/slots";

afterEach(() => {
  document.body.replaceChildren();
});

describe("art slots", () => {
  it("lists the 15 slot ids of the assets index", () => {
    expect(SLOT_IDS).toHaveLength(15);
    expect(new Set(SLOT_IDS).size).toBe(15);
    expect(ART_SLOTS.map((slot) => slot.id)).toEqual([...SLOT_IDS]);
    for (const slot of ART_SLOTS) expect(slot.file).toBe(`${slot.id}.webp`);
    expect(ART_SLOTS.find((s) => s.id === "lantern-amber")).toMatchObject({
      width: 56,
      height: 56,
    });
    expect(ART_SLOTS.find((s) => s.id === "daily-medallion")).toMatchObject({
      width: 120,
      height: 120,
    });
    expect(ART_SLOTS.find((s) => s.id === "empty-archive")).toMatchObject({
      width: 160,
      height: 160,
    });
  });

  it("falls back to code-drawn art when no file is delivered", () => {
    for (const id of SLOT_IDS) {
      expect(resolveSlot(id, new Map()).kind, id).toBe("fallback");
    }
    expect(bundledArtUrls(new Map())).toEqual([]);
  });

  it("uses a delivered file as soon as one exists", () => {
    const files = new Map([["lantern-rose.webp", "/assets/lantern-rose-abc.webp"]]);
    const source = resolveSlot("lantern-rose", files);
    expect(source).toMatchObject({ kind: "file", url: "/assets/lantern-rose-abc.webp" });
    expect(resolveSlot("lantern-jade", files).kind).toBe("fallback");
    expect(bundledArtUrls(files)).toEqual(["/assets/lantern-rose-abc.webp"]);
    expect(bundledArtUrls(new Map([["feature-graphic.webp", "/x.webp"]]))).toEqual([]);
  });

  it("renders every slot as an svg fallback without text elements", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    await act(() =>
      render(
        <div>
          {SLOT_IDS.map((id) => (
            <ArtImage
              key={id}
              slot={id}
              files={new Map()}
              alt={id === "daily-medallion" ? "Medallion" : ""}
            />
          ))}
        </div>,
        container,
      ),
    );
    for (const id of SLOT_IDS) {
      const holder = container.querySelector(`[data-art='${id}']`);
      expect(holder, id).not.toBeNull();
      expect(holder?.querySelector("svg"), id).not.toBeNull();
      expect(holder?.querySelectorAll("text, foreignObject"), id).toHaveLength(0);
    }
    expect(
      container.querySelector("[data-art='daily-medallion']")?.getAttribute("aria-label"),
    ).toBe("Medallion");
    expect(container.querySelector("[data-art='lantern-amber']")?.getAttribute("style")).toContain(
      "56px",
    );
  });

  it("draws a different scene per chapter backdrop", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const ids = ["backdrop-harbor", "backdrop-garden", "backdrop-bridge", "backdrop-sky"] as const;
    await act(() =>
      render(
        <div>
          {ids.map((id) => (
            <ArtImage key={id} slot={id} files={new Map()} />
          ))}
        </div>,
        container,
      ),
    );
    const markup = ids.map((id) => container.querySelector(`[data-art='${id}']`)?.innerHTML ?? "");
    expect(new Set(markup).size).toBe(4);
    for (const html of markup) expect(html.length).toBeGreaterThan(300);
  });

  it("renders a delivered file as an image sized to the slot and keeps fallbacks elsewhere", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const files = new Map([["lantern-amber.webp", "/assets/lantern-amber-1.webp"]]);
    await act(() =>
      render(
        <div>
          <ArtImage slot="lantern-amber" alt="Amber lantern" files={files} />
          <ArtImage slot="lantern-rose" files={files} />
        </div>,
        container,
      ),
    );
    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe("/assets/lantern-amber-1.webp");
    expect(image?.getAttribute("width")).toBe("56");
    expect(image?.getAttribute("alt")).toBe("Amber lantern");
    expect(container.querySelector("[data-art='lantern-amber']")).toBeNull();
    expect(container.querySelector("[data-art='lantern-rose'] svg")).not.toBeNull();
  });
});
